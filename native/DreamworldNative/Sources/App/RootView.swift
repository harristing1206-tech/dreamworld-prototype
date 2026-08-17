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

            AlarmSetupView()
                .tag(AppTab.alarm)
                .tabItem { Label("Alarm", systemImage: "alarm.fill") }
        }
        .tint(Color(red: 0.58, green: 0.68, blue: 0.63))
        .onAppear(perform: consumePendingAlarmRoute)
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                consumePendingAlarmRoute()
            }
        }
    }

    private func consumePendingAlarmRoute() {
        guard UserDefaults.standard.bool(forKey: OpenDreamCaptureIntent.routeKey) else { return }
        UserDefaults.standard.set(false, forKey: OpenDreamCaptureIntent.routeKey)
        selectedTab = .capture
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
