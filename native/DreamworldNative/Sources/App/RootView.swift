import DreamworldCore
import SwiftUI

struct RootView: View {
    @Environment(\.scenePhase) private var scenePhase
    @State private var selectedTab: AppTab = .world

    var body: some View {
        TabView(selection: $selectedTab) {
            WorldView()
                .tag(AppTab.world)
                .tabItem { Label("World", systemImage: "globe.americas.fill") }

            CaptureView()
                .tag(AppTab.capture)
                .tabItem { Label("Capture", systemImage: "waveform.circle.fill") }

            SettingsView()
                .tag(AppTab.settings)
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
        .tint(Color(red: 0.58, green: 0.68, blue: 0.63))
        .onAppear(perform: consumeCaptureLaunchRequest)
        .onOpenURL { url in
            if let destination = AppDeepLink.destination(for: url) {
                selectedTab = destination
            }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                consumeCaptureLaunchRequest()
            }
        }
    }

    private func consumeCaptureLaunchRequest() {
        guard UserDefaults.standard.bool(forKey: CaptureLaunchRequest.userDefaultsKey) else { return }
        UserDefaults.standard.set(false, forKey: CaptureLaunchRequest.userDefaultsKey)
        selectedTab = .capture
    }
}

private struct SettingsView: View {
    var body: some View {
        NavigationStack {
            Form {
                Section("iOS alarm handoff") {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Use your existing alarm")
                            .font(.headline)
                        Text("Dreamworld installs a Capture Dream App Shortcut automatically. In Shortcuts, create an Alarm → Is Stopped → Any automation, set it to Run Immediately, and choose Capture Dream as the action.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("Optional: repeat once with Is Snoozed. Apple requires each trigger to be approved separately.")
                            .font(.caption)
                            .foregroundStyle(.mint)
                    }
                    .padding(.vertical, 6)
                }

                Section("Capture") {
                    LabeledContent("Alarm destination", value: "Capture")
                    LabeledContent("Microphone", value: "Explicit action")
                    LabeledContent("Audio storage", value: "Local")
                }
            }
            .navigationTitle("Settings")
        }
    }
}

private struct WorldView: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0.02, green: 0.05, blue: 0.08), Color(red: 0.05, green: 0.12, blue: 0.16)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 18) {
                Image(systemName: "moon.stars.fill")
                    .font(.system(size: 64, weight: .light))
                    .foregroundStyle(.mint.opacity(0.85))
                Text("Dreamworld")
                    .font(.largeTitle.weight(.semibold))
                Text("Wake gently. Capture before it fades.")
                    .foregroundStyle(.secondary)
            }
        }
    }
}
