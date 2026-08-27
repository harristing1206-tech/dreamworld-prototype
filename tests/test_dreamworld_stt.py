import io
import json
import math
import os
import struct
import sys
import unittest
import wave
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "server"))
os.environ["DREAMWORLD_APP_ORIGIN"] = "https://example.tailnet.test"
os.environ["DREAMWORLD_OWNER_LOGIN"] = "owner@example.test"
os.environ["DREAMWORLD_WHISPER_URL"] = "http://127.0.0.1:8178/inference"
import dreamworld_stt as stt  # noqa: E402


def multipart(file_bytes=b"audio", filename="dream.webm", fields=None):
    boundary = "BoundaryForDreamworldTest"
    chunks = [
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\nContent-Type: audio/webm\r\n\r\n'.encode(),
        file_bytes,
        b"\r\n",
    ]
    for name, value in (fields or {}).items():
        chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    chunks.append(f"--{boundary}--\r\n".encode())
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


def spoken_wav(seconds=0.5, rate=16000):
    output = io.BytesIO()
    with wave.open(output, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        frames = [struct.pack("<h", int(6000 * math.sin(2 * math.pi * 220 * i / rate))) for i in range(int(seconds * rate))]
        wav.writeframes(b"".join(frames))
    return output.getvalue()


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self, _limit=-1):
        return self.payload


class DreamworldSTTTests(unittest.TestCase):
    def test_openwhispr_multipart_contract(self):
        body, content_type = multipart(fields={"language": "auto", "prompt": "Dreamworld"})
        fields, files = stt.parse_multipart_form(body, content_type)
        self.assertEqual(fields, {"language": "auto", "prompt": "Dreamworld"})
        self.assertEqual(files["file"], ("dream.webm", b"audio"))

    def test_unexpected_multipart_field_fails_closed(self):
        body, content_type = multipart(fields={"authorization": "secret"})
        with self.assertRaises(stt.RequestError):
            stt.parse_multipart_form(body, content_type)

    def test_pcm_rms_distinguishes_speech_from_silence(self):
        self.assertEqual(stt.pcm16_rms(b"\0" * 320), 0)
        self.assertGreater(stt.pcm16_rms(spoken_wav()[44:]), stt.SILENCE_RMS_THRESHOLD)

    def test_request_budget_is_per_identity_and_windowed(self):
        budget = stt.RequestBudget()
        for index in range(stt.RATE_LIMIT_REQUESTS):
            self.assertTrue(budget.allow("owner", now=float(index)))
        self.assertFalse(budget.allow("owner", now=float(stt.RATE_LIMIT_REQUESTS)))
        self.assertTrue(budget.allow("other-owner", now=float(stt.RATE_LIMIT_REQUESTS)))
        self.assertTrue(budget.allow("owner", now=float(stt.RATE_LIMIT_WINDOW_SECONDS + 1)))

    def test_real_ffmpeg_normalization_preserves_duration_and_signal(self):
        path, duration, rms = stt.normalize_audio(spoken_wav(), ".wav")
        try:
            self.assertAlmostEqual(duration, 0.5, places=2)
            self.assertGreater(rms, stt.SILENCE_RMS_THRESHOLD)
            with wave.open(path, "rb") as wav:
                self.assertEqual((wav.getframerate(), wav.getnchannels(), wav.getsampwidth()), (16000, 1, 2))
        finally:
            os.remove(path)

    def test_whisper_request_uses_openwhispr_decoder_safeguards(self):
        path, _duration, _rms = stt.normalize_audio(spoken_wav(), ".wav")
        try:
            request = stt.build_whisper_request(path, "auto", "Dreamworld")
            body = request.data
            self.assertIn(b'name="file"; filename="audio.wav"', body)
            self.assertIn(b'name="entropy_thold"\r\n\r\n2.8', body)
            self.assertIn(b'name="logprob_thold"\r\n\r\n-1.25', body)
            self.assertIn(b'name="prompt"\r\n\r\nDreamworld', body)
        finally:
            os.remove(path)

    def test_transcribe_returns_bounded_provenance_without_audio_retention(self):
        payload = json.dumps({"text": "I walked beside a bright lake."}).encode()
        with mock.patch.object(stt.urllib.request, "urlopen", return_value=FakeResponse(payload)):
            result = stt.transcribe("/dev/null", "auto", "")
        self.assertEqual(result["text"], "I walked beside a bright lake.")
        self.assertEqual(result["provenance"]["engine"], "whisper.cpp")
        self.assertEqual(result["provenance"]["model"], "small")
        self.assertFalse(result["provenance"]["audioRetainedByServer"])


if __name__ == "__main__":
    unittest.main()
