import DreamworldCore
import SwiftUI

struct CaptureView: View {
    @StateObject private var recorder = VoiceMemoRecorder()
    @State private var now = Date()

    private let timer = Timer.publish(every: 0.25, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
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
            .onReceive(timer) { date in
                if recorder.isRecording {
                    now = date
                }
            }
        }
    }

    private var promptText: String {
        switch recorder.captureSession.phase {
        case .ready:
            return "What do you remember?"
        case .recording:
            return elapsedText
        case .saving:
            return "Saving locally…"
        case .transcribing:
            return "Transcribing locally…"
        case .transcriptReady:
            return "Your dream, in words"
        case .transcriptionFailed:
            return "Your recording is safe"
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

    @ViewBuilder
    private var captureStatus: some View {
        switch recorder.captureSession.phase {
        case .ready, .recording:
            EmptyView()
        case .saving:
            ProgressView("Saving the raw recording…")
                .tint(.mint)
        case .transcribing(let audioURL):
            VStack(spacing: 10) {
                ProgressView()
                    .tint(.mint)
                Text("WhisperKit is creating an initial transcript on this device.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Text("Audio saved: \(audioURL.lastPathComponent)")
                    .font(.caption2.monospaced())
                    .foregroundStyle(.mint)
            }
            .multilineTextAlignment(.center)
            .padding(.horizontal)
        case .transcriptReady(let audioURL, let text):
            VStack(alignment: .leading, spacing: 12) {
                Label("Initial transcript", systemImage: "text.quote")
                    .font(.headline)
                    .foregroundStyle(.mint)
                ScrollView {
                    Text(text)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .textSelection(.enabled)
                }
                .frame(maxHeight: 180)
                Text("Raw audio preserved locally · \(audioURL.lastPathComponent)")
                    .font(.caption2.monospaced())
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background(.black.opacity(0.2), in: RoundedRectangle(cornerRadius: 18))
            .padding(.horizontal)
        case .transcriptionFailed(let audioURL, let message):
            VStack(spacing: 12) {
                Label("Audio saved locally", systemImage: "checkmark.circle.fill")
                    .foregroundStyle(.mint)
                Text(message)
                    .font(.footnote)
                    .foregroundStyle(.orange)
                    .multilineTextAlignment(.center)
                Text(audioURL.lastPathComponent)
                    .font(.caption2.monospaced())
                    .foregroundStyle(.secondary)
                Button("Retry transcription") {
                    recorder.retryTranscription()
                }
                .buttonStyle(.bordered)
            }
            .padding(.horizontal)
        }
    }

    private var elapsedText: String {
        guard let startedAt = recorder.startedAt else { return "00:00" }
        let elapsed = max(0, Int(now.timeIntervalSince(startedAt)))
        return String(format: "%02d:%02d", elapsed / 60, elapsed % 60)
    }
}
