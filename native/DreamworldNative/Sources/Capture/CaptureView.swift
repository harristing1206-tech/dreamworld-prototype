import DreamworldCore
import SwiftUI

struct CaptureView: View {
    @StateObject private var recorder = VoiceMemoRecorder()
    @State private var now = Date()

    private let timer = Timer.publish(every: 0.25, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            Group {
                if let phase = dialoguePhase {
                    DreamDialogueTranscriptionView(
                        phase: phase,
                        provenance: recorder.captureSession.transcriptProvenance,
                        onRetry: recorder.retryTranscription,
                        onFinish: recorder.finishDialogue
                    )
                    .toolbar(.hidden, for: .navigationBar)
                } else {
                    captureSurface
                }
            }
            .onReceive(timer) { date in
                if recorder.isRecording {
                    now = date
                }
            }
        }
    }

    private var captureSurface: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0.02, green: 0.05, blue: 0.08), Color(red: 0.07, green: 0.14, blue: 0.17)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 28) {
                Spacer()

                Text(promptText)
                    .font(recorder.isRecording ? .system(size: 42, weight: .light, design: .monospaced) : .title2)
                    .contentTransition(.numericText())
                    .multilineTextAlignment(.center)

                if showsMicrophone {
                    microphoneButton
                }

                captureStatus

                if let error = recorder.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.orange)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                Spacer()
            }
        }
        .navigationTitle("Capture")
    }

    private var microphoneButton: some View {
        Button {
            if recorder.isRecording {
                recorder.stop()
            } else {
                Task { await recorder.start() }
            }
        } label: {
            ZStack {
                Circle()
                    .fill(recorder.isRecording ? Color.red.opacity(0.22) : Color.mint.opacity(0.18))
                    .frame(width: 154, height: 154)
                Circle()
                    .fill(recorder.isRecording ? .red : .mint)
                    .frame(width: 112, height: 112)
                Image(systemName: recorder.isRecording ? "stop.fill" : "mic.fill")
                    .font(.system(size: 42, weight: .semibold))
                    .foregroundStyle(.black.opacity(0.75))
            }
        }
        .accessibilityLabel(recorder.isRecording ? "Stop recording" : "Start recording")
        .disabled(isProcessing)
    }

    private var promptText: String {
        switch recorder.captureSession.phase {
        case .ready:
            return "What do you remember?"
        case .recording:
            return elapsedText
        case .saving:
            return "Saving locally…"
        case .savedDraft:
            return "Recording saved"
        case .transcribing:
            return "Transcribing locally…"
        case .transcriptReady:
            return "Your dream, in words"
        case .transcriptionFailed:
            return "Your recording is safe"
        case .logged:
            return "Dream logged"
        }
    }

    private var showsMicrophone: Bool {
        switch recorder.captureSession.phase {
        case .ready, .recording:
            return true
        default:
            return false
        }
    }

    private var isProcessing: Bool {
        switch recorder.captureSession.phase {
        case .saving, .transcribing:
            return true
        default:
            return false
        }
    }

    private var dialoguePhase: CapturePhase? {
#if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-dreamDialogueTranscribingPreview") {
            return .transcribing(audioURL: URL(fileURLWithPath: "/tmp/dream-preview.m4a"))
        }
        if ProcessInfo.processInfo.arguments.contains("-dreamDialoguePreview") {
            return .transcriptReady(
                audioURL: URL(fileURLWithPath: "/tmp/dream-preview.m4a"),
                text: "I was walking beside a dark lake under a gold moon. Across the water, a small light moved between the trees, and I knew it was waiting for me."
            )
        }
#endif
        switch recorder.captureSession.phase {
        case .transcribing, .transcriptReady, .transcriptionFailed:
            return recorder.captureSession.phase
        default:
            return nil
        }
    }

    @ViewBuilder
    private var captureStatus: some View {
        switch recorder.captureSession.phase {
        case .ready:
            Label("Microphone off", systemImage: "mic.slash")
                .font(.footnote.weight(.medium))
                .foregroundStyle(.secondary)
        case .recording:
            Label("Recording locally", systemImage: "waveform")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.red)
        case .saving:
            ProgressView("Saving the raw recording…")
                .tint(.mint)
        case .savedDraft(let audioURL):
            VStack(spacing: 18) {
                Label("Raw audio saved locally", systemImage: "checkmark.circle.fill")
                    .font(.headline)
                    .foregroundStyle(.mint)

                Text("Transcription begins only if you choose to log this dream.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                Button("Log dream") {
                    recorder.logDream()
                }
                .buttonStyle(.borderedProminent)
                .tint(Color(red: 0.36, green: 0.64, blue: 0.56))
                .controlSize(.large)
                .accessibilityHint("Opens the one-time dialogue transcription scene")

                Text(audioURL.lastPathComponent)
                    .font(.caption2.monospaced())
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 28)
        case .logged(let audioURL, _):
            VStack(spacing: 16) {
                Label("Dream logged", systemImage: "book.closed.fill")
                    .font(.headline)
                    .foregroundStyle(Color(red: 0.78, green: 0.66, blue: 0.37))
                Text("The dialogue has closed. Your raw recording and first transcript remain together.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                Text(audioURL.lastPathComponent)
                    .font(.caption2.monospaced())
                    .foregroundStyle(.secondary)
                Button("Record another dream") {
                    Task { await recorder.start() }
                }
                .buttonStyle(.bordered)
            }
            .padding(.horizontal, 28)
        case .transcribing, .transcriptReady, .transcriptionFailed:
            EmptyView()
        }
    }

    private var elapsedText: String {
        guard let startedAt = recorder.startedAt else { return "00:00" }
        let elapsed = max(0, Int(now.timeIntervalSince(startedAt)))
        return String(format: "%02d:%02d", elapsed / 60, elapsed % 60)
    }
}
