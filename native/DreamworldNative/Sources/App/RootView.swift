import DreamworldCore
import SwiftUI

struct RootView: View {
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
        .onOpenURL { url in
            if let destination = AppDeepLink.destination(for: url) {
                selectedTab = destination
            }
        }
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
                        Text("In Shortcuts, create a personal automation for Alarm → Is Stopped or Snoozed, then open dreamworld://capture.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("Dreamworld does not create or replace your alarm.")
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
