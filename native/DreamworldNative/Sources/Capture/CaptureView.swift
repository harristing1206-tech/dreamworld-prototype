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

                    Text(recorder.isRecording ? elapsedText : "What do you remember?")
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

                    if let url = recorder.lastRecordingURL, !recorder.isRecording {
                        Label("Saved locally: \(url.lastPathComponent)", systemImage: "checkmark.circle.fill")
                            .font(.footnote)
                            .foregroundStyle(.mint)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }

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

    private var elapsedText: String {
        guard let startedAt = recorder.startedAt else { return "00:00" }
        let elapsed = max(0, Int(now.timeIntervalSince(startedAt)))
        return String(format: "%02d:%02d", elapsed / 60, elapsed % 60)
    }
}
