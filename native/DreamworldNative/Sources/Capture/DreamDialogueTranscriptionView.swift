import DreamworldCore
import SwiftUI

struct DreamDialogueTranscriptionView: View {
    let phase: CapturePhase
    let provenance: TranscriptionProvenance?
    let onRetry: () -> Void
    let onFinish: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var sceneIsAlive = false

    var body: some View {
        ZStack {
            Color(red: 0.025, green: 0.045, blue: 0.07)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                statusStrip
                dreamScene
                    .frame(maxHeight: .infinity)
                dialoguePanel
            }
        }
        .foregroundStyle(Color(red: 0.93, green: 0.90, blue: 0.79))
        .preferredColorScheme(.dark)
        .onAppear {
            guard !reduceMotion else { return }
            sceneIsAlive = true
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(accessibilitySummary)
    }

    private var statusStrip: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(statusColor)
                .frame(width: 7, height: 7)
            Text(statusLabel)
                .font(.system(size: 10, weight: .bold, design: .monospaced))
                .tracking(1.4)
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(provenanceLabel)
                    .font(.system(size: 8, weight: .bold, design: .monospaced))
                    .tracking(0.8)
                    .foregroundStyle(Color(red: 0.64, green: 0.71, blue: 0.63))
                Text("RAW AUDIO SAFE")
                    .font(.system(size: 8, weight: .bold, design: .monospaced))
                    .tracking(0.9)
                    .foregroundStyle(Color(red: 0.73, green: 0.67, blue: 0.48))
            }
        }
        .padding(.horizontal, 18)
        .frame(height: 42)
        .background(Color(red: 0.035, green: 0.06, blue: 0.085))
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Color(red: 0.26, green: 0.31, blue: 0.30))
                .frame(height: 1)
        }
    }

    private var dreamScene: some View {
        GeometryReader { proxy in
            ZStack {
                PixelNightBackground()

                Ellipse()
                    .fill(Color(red: 0.19, green: 0.25, blue: 0.23).opacity(0.8))
                    .frame(width: proxy.size.width * 0.78, height: 72)
                    .blur(radius: 1)
                    .position(x: proxy.size.width / 2, y: proxy.size.height - 24)

                Rectangle()
                    .fill(Color(red: 0.51, green: 0.43, blue: 0.26).opacity(0.32))
                    .frame(width: 1, height: max(24, proxy.size.width * 0.18))
                    .rotationEffect(.degrees(90))
                    .position(x: proxy.size.width / 2, y: proxy.size.height - 28)

                PixelSilhouette(kind: .dreamer, facingRight: true)
                    .frame(width: 72, height: 104)
                    .position(x: proxy.size.width * 0.27, y: proxy.size.height - 72)
                    .offset(y: sceneIsAlive ? -2 : 1)
                    .animation(
                        reduceMotion ? nil : .easeInOut(duration: 1.35).repeatForever(autoreverses: true),
                        value: sceneIsAlive
                    )

                PixelSilhouette(kind: .listener, facingRight: false)
                    .frame(width: 78, height: 108)
                    .position(x: proxy.size.width * 0.73, y: proxy.size.height - 72)
                    .offset(y: sceneIsAlive ? 1 : -1)
                    .animation(
                        reduceMotion ? nil : .easeInOut(duration: 1.6).repeatForever(autoreverses: true),
                        value: sceneIsAlive
                    )

                if case .transcribing = phase {
                    ListeningGlyph()
                        .position(x: proxy.size.width / 2, y: proxy.size.height - 102)
                }
            }
            .clipped()
        }
        .accessibilityHidden(true)
    }

    private var dialoguePanel: some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: 14) {
                PixelPortrait(kind: portraitKind)
                    .frame(width: 72, height: 72)

                VStack(alignment: .leading, spacing: 9) {
                    Text(speakerLabel)
                        .font(.system(size: 11, weight: .black, design: .monospaced))
                        .tracking(1.5)
                        .foregroundStyle(Color(red: 0.78, green: 0.66, blue: 0.37))

                    dialogueContent
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(.horizontal, 18)
            .padding(.top, 18)
            .padding(.bottom, 14)

            Rectangle()
                .fill(Color(red: 0.28, green: 0.33, blue: 0.31))
                .frame(height: 1)

            dialogueAction
                .frame(minHeight: 54)
                .padding(.horizontal, 18)
        }
        .background(Color(red: 0.055, green: 0.08, blue: 0.095))
        .overlay {
            Rectangle()
                .stroke(Color(red: 0.56, green: 0.50, blue: 0.34), lineWidth: 2)
        }
        .padding(.horizontal, 10)
        .padding(.bottom, 8)
    }

    @ViewBuilder
    private var dialogueContent: some View {
        switch phase {
        case .transcribing:
            VStack(alignment: .leading, spacing: 8) {
                Text("…")
                    .font(.system(size: 30, weight: .bold, design: .monospaced))
                Text("Listening back on this device. Your words will appear together when the first transcript is ready.")
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(Color(red: 0.75, green: 0.77, blue: 0.70))
                    .fixedSize(horizontal: false, vertical: true)
            }
        case .transcriptReady(_, let text):
            ScrollView {
                Text(text)
                    .font(.system(size: 17, weight: .medium, design: .rounded))
                    .lineSpacing(5)
                    .textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(minHeight: 92, maxHeight: 176)
        case .transcriptionFailed(_, let message):
            VStack(alignment: .leading, spacing: 8) {
                Text("The recording is still safe.")
                    .font(.system(size: 17, weight: .semibold, design: .rounded))
                Text(message)
                    .font(.system(size: 14, weight: .regular, design: .rounded))
                    .foregroundStyle(Color(red: 0.88, green: 0.61, blue: 0.42))
            }
        default:
            EmptyView()
        }
    }

    @ViewBuilder
    private var dialogueAction: some View {
        switch phase {
        case .transcribing:
            HStack(spacing: 10) {
                ListeningBars()
                Text("TRANSCRIBING ON THIS DEVICE")
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .tracking(1.1)
                    .foregroundStyle(Color(red: 0.64, green: 0.71, blue: 0.63))
                Spacer()
            }
        case .transcriptReady:
            Button(action: onFinish) {
                HStack {
                    Text("FINISH LOGGING")
                        .font(.system(size: 11, weight: .black, design: .monospaced))
                        .tracking(1.2)
                    Spacer()
                    Image(systemName: "chevron.down")
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityHint("Closes this one-time dialogue and keeps the logged dream")
        case .transcriptionFailed:
            Button(action: onRetry) {
                HStack {
                    Text("TRY TRANSCRIPTION AGAIN")
                        .font(.system(size: 11, weight: .black, design: .monospaced))
                        .tracking(1.1)
                    Spacer()
                    Image(systemName: "arrow.clockwise")
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        default:
            EmptyView()
        }
    }

    private var speakerLabel: String {
        switch phase {
        case .transcribing, .transcriptReady:
            return "YOU · DREAM LOG"
        case .transcriptionFailed:
            return "DREAMWORLD · SYSTEM"
        default:
            return "DREAM LOG"
        }
    }

    private var portraitKind: PixelSilhouette.Kind {
        if case .transcriptionFailed = phase { return .listener }
        return .dreamer
    }

    private var statusLabel: String {
        switch phase {
        case .transcribing:
            return "LISTENING BACK"
        case .transcriptReady:
            return "FIRST TRANSCRIPT READY"
        case .transcriptionFailed:
            return "TRANSCRIPT PAUSED"
        default:
            return "DREAM LOG"
        }
    }

    private var statusColor: Color {
        switch phase {
        case .transcribing:
            return Color(red: 0.36, green: 0.76, blue: 0.66)
        case .transcriptReady:
            return Color(red: 0.78, green: 0.66, blue: 0.37)
        case .transcriptionFailed:
            return Color(red: 0.85, green: 0.44, blue: 0.30)
        default:
            return .gray
        }
    }

    private var provenanceLabel: String {
        guard let provenance else { return "APPLE SPEECH · ON DEVICE" }
        return "\(provenance.provider) · \(provenance.processing.rawValue)".uppercased()
    }

    private var accessibilitySummary: String {
        switch phase {
        case .transcribing:
            return "Dream dialogue. Transcribing on this device. Raw audio is safe."
        case .transcriptReady(_, let text):
            return "First transcript ready. \(text)"
        case .transcriptionFailed(_, let message):
            return "Transcription paused. The recording is safe. \(message)"
        default:
            return "Dream dialogue"
        }
    }
}

private struct PixelNightBackground: View {
    var body: some View {
        GeometryReader { proxy in
            ZStack {
                LinearGradient(
                    colors: [
                        Color(red: 0.035, green: 0.07, blue: 0.11),
                        Color(red: 0.08, green: 0.14, blue: 0.16),
                        Color(red: 0.11, green: 0.16, blue: 0.14)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )

                ForEach(Array(stars.enumerated()), id: \.offset) { _, star in
                    Rectangle()
                        .fill(Color(red: 0.79, green: 0.74, blue: 0.55).opacity(star.opacity))
                        .frame(width: star.size, height: star.size)
                        .position(x: proxy.size.width * star.x, y: proxy.size.height * star.y)
                }

                Circle()
                    .fill(Color(red: 0.80, green: 0.75, blue: 0.57))
                    .frame(width: 44, height: 44)
                    .overlay(alignment: .topTrailing) {
                        Circle()
                            .fill(Color(red: 0.04, green: 0.075, blue: 0.11))
                            .frame(width: 38, height: 38)
                            .offset(x: 9, y: -4)
                    }
                    .position(x: proxy.size.width * 0.78, y: proxy.size.height * 0.20)

                PixelTree()
                    .frame(width: 104, height: 168)
                    .position(x: 42, y: proxy.size.height - 72)

                PixelTree()
                    .frame(width: 92, height: 152)
                    .scaleEffect(x: -1, y: 1)
                    .position(x: proxy.size.width - 32, y: proxy.size.height - 66)
            }
        }
    }

    private let stars: [(x: CGFloat, y: CGFloat, size: CGFloat, opacity: Double)] = [
        (0.10, 0.14, 3, 0.55), (0.22, 0.25, 2, 0.8), (0.34, 0.12, 3, 0.7),
        (0.47, 0.30, 2, 0.45), (0.59, 0.17, 3, 0.65), (0.69, 0.34, 2, 0.7),
        (0.87, 0.12, 2, 0.6), (0.93, 0.29, 3, 0.5), (0.42, 0.43, 2, 0.45)
    ]
}

private struct PixelTree: View {
    var body: some View {
        ZStack(alignment: .bottom) {
            Rectangle()
                .fill(Color(red: 0.11, green: 0.14, blue: 0.13))
                .frame(width: 16, height: 96)
            VStack(spacing: -8) {
                Rectangle().frame(width: 44, height: 32)
                HStack(spacing: 4) {
                    Rectangle().frame(width: 38, height: 34)
                    Rectangle().frame(width: 50, height: 40)
                }
                Rectangle().frame(width: 72, height: 36)
            }
            .foregroundStyle(Color(red: 0.08, green: 0.12, blue: 0.11))
            .offset(y: -70)
        }
    }
}

private struct PixelSilhouette: View {
    enum Kind {
        case dreamer
        case listener
    }

    let kind: Kind
    let facingRight: Bool

    var body: some View {
        ZStack {
            if kind == .listener {
                Rectangle()
                    .fill(accent.opacity(0.6))
                    .frame(width: 52, height: 18)
                    .offset(y: -34)
            }

            VStack(spacing: 0) {
                Rectangle()
                    .fill(face)
                    .frame(width: 28, height: 26)
                    .overlay(alignment: .trailing) {
                        Rectangle()
                            .fill(accent)
                            .frame(width: 5, height: 5)
                            .padding(.horizontal, 6)
                    }
                Rectangle()
                    .fill(bodyColor)
                    .frame(width: kind == .listener ? 46 : 42, height: 44)
                HStack(spacing: 10) {
                    Rectangle().frame(width: 13, height: 24)
                    Rectangle().frame(width: 13, height: 24)
                }
                .foregroundStyle(bodyColor.opacity(0.92))
            }

            if kind == .dreamer {
                Rectangle()
                    .fill(accent.opacity(0.9))
                    .frame(width: 36, height: 7)
                    .offset(y: -45)
            }
        }
        .scaleEffect(x: facingRight ? 1 : -1, y: 1)
    }

    private var face: Color {
        Color(red: 0.23, green: 0.27, blue: 0.26)
    }

    private var bodyColor: Color {
        kind == .dreamer
            ? Color(red: 0.20, green: 0.37, blue: 0.36)
            : Color(red: 0.29, green: 0.25, blue: 0.38)
    }

    private var accent: Color {
        kind == .dreamer
            ? Color(red: 0.76, green: 0.62, blue: 0.35)
            : Color(red: 0.49, green: 0.58, blue: 0.54)
    }
}

private struct PixelPortrait: View {
    let kind: PixelSilhouette.Kind

    var body: some View {
        ZStack {
            Color(red: 0.035, green: 0.055, blue: 0.07)
            PixelSilhouette(kind: kind, facingRight: true)
                .frame(width: 48, height: 62)
                .offset(y: 7)
        }
        .overlay {
            Rectangle()
                .stroke(Color(red: 0.39, green: 0.43, blue: 0.37), lineWidth: 2)
        }
        .clipped()
        .accessibilityHidden(true)
    }
}

private struct ListeningGlyph: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var expanded = false

    var body: some View {
        HStack(spacing: 7) {
            ForEach(0..<3, id: \.self) { index in
                Rectangle()
                    .fill(Color(red: 0.73, green: 0.67, blue: 0.48))
                    .frame(width: 4, height: 4)
                    .opacity(expanded ? 0.9 : 0.3)
                    .animation(reduceMotion ? nil : .easeInOut(duration: 0.8)
                        .repeatForever(autoreverses: true)
                        .delay(Double(index) * 0.16), value: expanded)
            }
        }
        .onAppear {
            guard !reduceMotion else { return }
            expanded = true
        }
    }
}

private struct ListeningBars: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var active = false

    var body: some View {
        HStack(alignment: .center, spacing: 3) {
            ForEach([8.0, 15.0, 11.0, 18.0, 9.0], id: \.self) { height in
                Rectangle()
                    .fill(Color(red: 0.36, green: 0.76, blue: 0.66))
                    .frame(width: 3, height: active ? height : 5)
            }
        }
        .frame(width: 30, height: 22)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.7).repeatForever(autoreverses: true), value: active)
        .onAppear {
            guard !reduceMotion else { return }
            active = true
        }
        .accessibilityHidden(true)
    }
}
