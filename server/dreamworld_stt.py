#!/usr/bin/env python3
"""Owner-only Dreamworld speech-to-text bridge.

The PWA posts a preserved MediaRecorder Blob to this private endpoint. Audio is
normalized with ffmpeg and transcribed by the pinned OpenWhispr whisper.cpp
server on loopback. Request audio and transcripts are never logged or retained.
"""
from __future__ import annotations

import array
import ipaddress
import json
import os
import re
import socket
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import wave
from collections import defaultdict, deque
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

HOST = os.environ.get("DREAMWORLD_STT_HOST", "127.0.0.1")
PORT = int(os.environ.get("DREAMWORLD_STT_PORT", "8766"))
ALLOWED_ORIGIN = os.environ.get("DREAMWORLD_APP_ORIGIN", "").rstrip("/")
OWNER_LOGIN = os.environ.get("DREAMWORLD_OWNER_LOGIN", "").strip()
WHISPER_URL = os.environ.get("DREAMWORLD_WHISPER_URL", "http://127.0.0.1:8178/inference")
MODEL_NAME = os.environ.get("DREAMWORLD_STT_MODEL", "small")

MAX_BODY_BYTES = 10 * 1024 * 1024
MAX_AUDIO_BYTES = 8 * 1024 * 1024
MAX_DURATION_SECONDS = 180.0
MAX_PROMPT_CHARS = 600
MAX_TRANSCRIPT_CHARS = 12_000
WHISPER_TIMEOUT_SECONDS = 180
SILENCE_RMS_THRESHOLD = 32
RATE_LIMIT_REQUESTS = 8
RATE_LIMIT_WINDOW_SECONDS = 60
ALLOWED_FIELDS = {"file", "language", "prompt"}
ALLOWED_SUFFIXES = {".webm", ".ogg", ".mp4", ".m4a", ".wav", ".mp3", ".aac"}
SAFE_LANGUAGE = re.compile(r"^(auto|[a-z]{2,3}(?:-[A-Z]{2})?)$")
CONCURRENCY = threading.BoundedSemaphore(1)


class RequestError(ValueError):
    pass


class UpstreamError(RuntimeError):
    pass


class RequestBudget:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._requests: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, identity: str, now: float | None = None) -> bool:
        timestamp = now if now is not None else time.time()
        with self._lock:
            requests = self._requests[identity]
            while requests and timestamp - requests[0] >= RATE_LIMIT_WINDOW_SECONDS:
                requests.popleft()
            if len(requests) >= RATE_LIMIT_REQUESTS:
                return False
            requests.append(timestamp)
            return True


REQUEST_BUDGET = RequestBudget()


def parse_multipart_form(body: bytes, content_type: str) -> tuple[dict[str, str], dict[str, tuple[str, bytes]]]:
    """Parse the bounded OpenAI/OpenWhispr multipart transcription contract.

    Adapted from OpenWhispr's MIT-licensed custom ASR shim template.
    """
    match = re.search(r'boundary="?([^";]+)"?', content_type)
    if not match:
        raise RequestError("Missing multipart boundary.")
    boundary = match.group(1).strip().encode("ascii", "strict")
    if not 1 <= len(boundary) <= 200:
        raise RequestError("Invalid multipart boundary.")
    delimiter = b"--" + boundary
    fields: dict[str, str] = {}
    files: dict[str, tuple[str, bytes]] = {}
    for chunk in body.split(delimiter):
        if not chunk or chunk.startswith(b"--"):
            continue
        chunk = chunk.removeprefix(b"\r\n").removesuffix(b"\r\n")
        if b"\r\n\r\n" not in chunk:
            continue
        raw_headers, content = chunk.split(b"\r\n\r\n", 1)
        disposition = ""
        for line in raw_headers.decode("utf-8", "replace").split("\r\n"):
            if line.lower().startswith("content-disposition:"):
                disposition = line
        name_match = re.search(r'name="([^"]*)"', disposition)
        if not name_match:
            continue
        name = name_match.group(1)
        if name not in ALLOWED_FIELDS:
            raise RequestError("Unexpected multipart field.")
        file_match = re.search(r'filename="([^"]*)"', disposition)
        if file_match:
            files[name] = (Path(file_match.group(1)).name, content)
        else:
            fields[name] = content.decode("utf-8", "replace")
    return fields, files


def require_loopback_host(host: str, label: str) -> None:
    addresses = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
    ips = {str(entry[4][0]).split("%", 1)[0] for entry in addresses}
    if not ips or any(not ipaddress.ip_address(ip).is_loopback for ip in ips):
        raise SystemExit(f"{label} must resolve only to loopback addresses.")


def validate_configuration() -> None:
    require_loopback_host(HOST, "Dreamworld STT bridge")
    parsed = urllib.parse.urlparse(WHISPER_URL)
    if parsed.scheme != "http" or not parsed.hostname:
        raise SystemExit("Whisper URL must be loopback HTTP.")
    require_loopback_host(parsed.hostname, "Whisper server")
    origin = urllib.parse.urlparse(ALLOWED_ORIGIN)
    if origin.scheme != "https" or not origin.hostname or origin.path not in {"", "/"}:
        raise SystemExit("Dreamworld app origin must be one exact HTTPS origin.")
    if not OWNER_LOGIN:
        raise SystemExit("Dreamworld owner identity is required.")


def pcm16_rms(raw: bytes) -> int:
    samples = array.array("h")
    samples.frombytes(raw)
    if sys.byteorder != "little":
        samples.byteswap()
    if not samples:
        return 0
    return int((sum(sample * sample for sample in samples) / len(samples)) ** 0.5)


def normalize_audio(file_bytes: bytes, suffix: str) -> tuple[str, float, int]:
    if not file_bytes or len(file_bytes) > MAX_AUDIO_BYTES:
        raise RequestError("Audio size is outside the supported range.")
    if suffix not in ALLOWED_SUFFIXES:
        suffix = ".webm"
    in_fd, in_path = tempfile.mkstemp(prefix="dreamworld-stt-", suffix=suffix)
    out_fd, out_path = tempfile.mkstemp(prefix="dreamworld-stt-", suffix=".wav")
    os.close(out_fd)
    try:
        with os.fdopen(in_fd, "wb") as handle:
            handle.write(file_bytes)
        subprocess.run(
            ["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-i", in_path,
             "-vn", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", out_path],
            check=True,
            timeout=45,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        with wave.open(out_path, "rb") as wav:
            frames = wav.getnframes()
            rate = wav.getframerate()
            channels = wav.getnchannels()
            width = wav.getsampwidth()
            if rate != 16000 or channels != 1 or width != 2 or frames <= 0:
                raise RequestError("Normalized audio format was invalid.")
            duration = frames / rate
            if not 0.15 <= duration <= MAX_DURATION_SECONDS:
                raise RequestError("Audio duration is outside the supported range.")
            rms = pcm16_rms(wav.readframes(frames))
            if rms < SILENCE_RMS_THRESHOLD:
                raise RequestError("No clear speech was detected in the recording.")
        return out_path, duration, rms
    except subprocess.TimeoutExpired as exc:
        raise RequestError("Audio conversion timed out.") from exc
    except subprocess.CalledProcessError as exc:
        raise RequestError("The recorded audio could not be decoded.") from exc
    except wave.Error as exc:
        raise RequestError("The normalized audio could not be read.") from exc
    finally:
        try:
            os.remove(in_path)
        except FileNotFoundError:
            pass


def build_whisper_request(wav_path: str, language: str, prompt: str) -> urllib.request.Request:
    boundary = "----DreamworldWhisperBoundary7MA4YWxkTrZu0gW"
    parts: list[bytes] = []

    def field(name: str, value: str) -> None:
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        )

    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.wav"\r\nContent-Type: audio/wav\r\n\r\n'.encode()
    )
    parts.append(Path(wav_path).read_bytes())
    parts.append(b"\r\n")
    field("language", language)
    field("entropy_thold", "2.8")
    field("logprob_thold", "-1.25")
    if prompt:
        field("prompt", prompt)
    field("response_format", "json")
    parts.append(f"--{boundary}--\r\n".encode())
    body = b"".join(parts)
    return urllib.request.Request(
        WHISPER_URL,
        data=body,
        method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}", "Content-Length": str(len(body))},
    )


def transcribe(wav_path: str, language: str, prompt: str) -> dict[str, Any]:
    request = build_whisper_request(wav_path, language, prompt)
    try:
        with urllib.request.urlopen(request, timeout=WHISPER_TIMEOUT_SECONDS) as response:
            raw = response.read(128 * 1024 + 1)
    except (urllib.error.URLError, TimeoutError) as exc:
        raise UpstreamError("Private transcription engine is unavailable.") from exc
    if len(raw) > 128 * 1024:
        raise UpstreamError("Transcription response was too large.")
    try:
        result = json.loads(raw)
        text = re.sub(r"\s+", " ", str(result.get("text", ""))).strip()
    except (json.JSONDecodeError, AttributeError) as exc:
        raise UpstreamError("Transcription engine returned malformed output.") from exc
    if not text:
        raise RequestError("No clear speech was detected in the recording.")
    if len(text) > MAX_TRANSCRIPT_CHARS:
        raise UpstreamError("Transcript exceeded the supported length.")
    return {
        "text": text,
        "provenance": {
            "provider": "OpenWhispr-compatible private engine",
            "engine": "whisper.cpp",
            "model": MODEL_NAME,
            "processing": "private-vps",
            "audioRetainedByServer": False,
        },
    }


class DreamworldSTTHandler(BaseHTTPRequestHandler):
    server_version = "DreamworldSTT/1"

    def log_message(self, format: str, *args: Any) -> None:
        print(f"dreamworld-stt {self.client_address[0]} {format % args}")

    def _origin_allowed(self) -> bool:
        return bool(ALLOWED_ORIGIN) and self.headers.get("Origin", "") == ALLOWED_ORIGIN

    def _owner_allowed(self) -> bool:
        return bool(OWNER_LOGIN) and self.headers.get("Tailscale-User-Login", "") == OWNER_LOGIN

    def _send_json(self, status: int, payload: dict[str, Any], *, cors: bool = True) -> None:
        raw = json.dumps(payload, separators=(",", ":")).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        if cors and self._origin_allowed():
            self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
            self.send_header("Vary", "Origin")
        self.end_headers()
        try:
            self.wfile.write(raw)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_OPTIONS(self) -> None:
        if not self._origin_allowed():
            self._send_json(HTTPStatus.FORBIDDEN, {"error": "Origin not allowed."}, cors=False)
            return
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")
        self.end_headers()

    def do_GET(self) -> None:
        if self.path != "/health":
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Not found."}, cors=False)
            return
        try:
            parsed = urllib.parse.urlparse(WHISPER_URL)
            with urllib.request.urlopen(f"{parsed.scheme}://{parsed.netloc}/health", timeout=3) as response:
                whisper_ready = response.status == 200
        except Exception:
            whisper_ready = False
        self._send_json(
            HTTPStatus.OK if whisper_ready else HTTPStatus.SERVICE_UNAVAILABLE,
            {"status": "ok" if whisper_ready else "starting", "schemaVersion": 1, "engine": "whisper.cpp", "model": MODEL_NAME},
            cors=False,
        )

    def do_POST(self) -> None:
        if self.path.rstrip("/") not in {"/v1/transcribe", "/audio/transcriptions"}:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Not found."}, cors=False)
            return
        if not self._origin_allowed():
            self._send_json(HTTPStatus.FORBIDDEN, {"error": "Private Dreamworld origin required."}, cors=False)
            return
        if not self._owner_allowed():
            self._send_json(HTTPStatus.FORBIDDEN, {"error": "Owner Tailscale identity required."})
            return
        identity = self.headers.get("Tailscale-User-Login", "")
        if not REQUEST_BUDGET.allow(identity):
            self._send_json(HTTPStatus.TOO_MANY_REQUESTS, {"error": "Transcription rate limit reached. Try again shortly."})
            return
        if not CONCURRENCY.acquire(blocking=False):
            self._send_json(HTTPStatus.TOO_MANY_REQUESTS, {"error": "Another transcription is active."})
            return
        wav_path = None
        try:
            raw_length = self.headers.get("Content-Length", "")
            if not raw_length.isdigit():
                raise RequestError("Content-Length is required.")
            length = int(raw_length)
            if length <= 0 or length > MAX_BODY_BYTES:
                raise RequestError("Request body is outside the supported range.")
            body = self.rfile.read(length)
            fields, files = parse_multipart_form(body, self.headers.get("Content-Type", ""))
            if set(files) != {"file"}:
                raise RequestError("Exactly one audio file is required.")
            filename, file_bytes = files["file"]
            language = fields.get("language", "auto").strip() or "auto"
            if not SAFE_LANGUAGE.fullmatch(language):
                raise RequestError("Unsupported language value.")
            prompt = re.sub(r"\s+", " ", fields.get("prompt", "")).strip()[:MAX_PROMPT_CHARS]
            wav_path, duration, _rms = normalize_audio(file_bytes, Path(filename).suffix.lower())
            result = transcribe(wav_path, language, prompt)
            result["durationSeconds"] = round(duration, 3)
            self._send_json(HTTPStatus.OK, result)
        except RequestError as exc:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
        except UpstreamError as exc:
            self._send_json(HTTPStatus.BAD_GATEWAY, {"error": str(exc)})
        except Exception:
            self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Private transcription failed safely."})
        finally:
            if wav_path:
                try:
                    os.remove(wav_path)
                except FileNotFoundError:
                    pass
            CONCURRENCY.release()


def main() -> None:
    validate_configuration()
    server = ThreadingHTTPServer((HOST, PORT), DreamworldSTTHandler)
    server.daemon_threads = True
    print(f"Dreamworld STT bridge listening on http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
