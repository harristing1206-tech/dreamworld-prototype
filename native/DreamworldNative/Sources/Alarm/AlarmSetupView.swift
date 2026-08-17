import AlarmKit
import Foundation
import SwiftUI

struct AlarmSetupView: View {
    let onRecordDream: () -> Void

    @StateObject private var service = DreamAlarmService()
    @State private var wakeTime = Calendar.current.date(from: DateComponents(hour: 7, minute: 30)) ?? Date()
    @State private var selectedWeekdays: Set<Locale.Weekday> = []
    @State private var statusMessage = ""
    @State private var isScheduling = false
    @State private var showingRingPreview = false

    init(onRecordDream: @escaping () -> Void = {}) {
        self.onRecordDream = onRecordDream
    }

    private let weekdays: [(String, Locale.Weekday)] = [
        ("S", .sunday), ("M", .monday), ("T", .tuesday), ("W", .wednesday),
        ("T", .thursday), ("F", .friday), ("S", .saturday)
    ]

    var body: some View {
        NavigationStack {
            Form {
                wakeTimeSection
                repeatSection
                scheduleSection
                activeAlarmsSection
                previewSection
            }
            .navigationTitle("Alarms")
        }
        .fullScreenCover(isPresented: $showingRingPreview) {
            AlarmRingPreviewView(time: wakeTime, onRecordDream: onRecordDream)
        }
    }

    private var wakeTimeSection: some View {
        Section("Wake time") {
            DatePicker("Alarm", selection: $wakeTime, displayedComponents: .hourAndMinute)
                .datePickerStyle(.wheel)
                .labelsHidden()
                .frame(maxWidth: .infinity)
        }
    }

    private var repeatSection: some View {
        Section("Repeat") {
            HStack(spacing: 10) {
                ForEach(weekdays.indices, id: \.self) { index in
                    weekdayButton(at: index)
                }
            }
            .frame(maxWidth: .infinity)
        }
    }

    private func weekdayButton(at index: Int) -> some View {
        let item = weekdays[index]
        let selected = selectedWeekdays.contains(item.1)
        return Button(item.0) {
            if selected {
                selectedWeekdays.remove(item.1)
            } else {
                selectedWeekdays.insert(item.1)
            }
        }
        .buttonStyle(.borderedProminent)
        .buttonBorderShape(.circle)
        .tint(selected ? .mint : .gray.opacity(0.35))
        .accessibilityLabel(item.0)
    }

    private var scheduleSection: some View {
        Section {
            Button(action: scheduleAlarm) {
                HStack {
                    Spacer()
                    if isScheduling {
                        ProgressView()
                    } else {
                        Label("Add Alarm", systemImage: "alarm.waves.left.and.right.fill")
                    }
                    Spacer()
                }
            }
            .disabled(isScheduling)

            if !statusMessage.isEmpty {
                Text(statusMessage)
                    .font(.footnote)
                    .foregroundStyle(statusMessage.hasPrefix("Scheduled") ? .mint : .orange)
            }
        } footer: {
            Text("The alarm uses Apple’s system alarm experience. Snooze waits nine minutes; stopping the alarm opens Capture, where recording begins only when you tap the microphone.")
        }
    }

    private var previewSection: some View {
        Section {
            Button("Preview Ringing Screen") {
                showingRingPreview = true
            }
        } header: {
            Text("Interaction prototype")
        } footer: {
            Text("The slider previews Dreamworld’s in-app interaction. Apple controls the real locked-screen alarm buttons.")
        }
    }

    @ViewBuilder
    private var activeAlarmsSection: some View {
        Section("Active Dreamworld alarms") {
            if service.scheduledAlarms.isEmpty {
                Text("None")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(service.scheduledAlarms, id: \.id) { alarm in
                    HStack(spacing: 12) {
                        Image(systemName: "alarm.fill")
                            .foregroundStyle(.mint)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(displayTime(for: alarm))
                                .font(.headline.monospacedDigit())
                            Text(repeatLabel(for: alarm))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Button("Cancel", role: .destructive) {
                            cancelAlarm(alarm.id)
                        }
                    }
                }
            }
        }
    }

    private func displayTime(for alarm: Alarm) -> String {
        switch alarm.schedule {
        case .relative(let relative):
            let date = Calendar.current.date(
                from: DateComponents(hour: relative.time.hour, minute: relative.time.minute)
            )
            return date?.formatted(date: .omitted, time: .shortened) ?? "Dream alarm"
        case .fixed(let date):
            return date.formatted(date: .omitted, time: .shortened)
        case nil:
            return "Dream alarm"
        @unknown default:
            return "Dream alarm"
        }
    }

    private func repeatLabel(for alarm: Alarm) -> String {
        guard case .relative(let relative)? = alarm.schedule else { return "Once" }
        switch relative.repeats {
        case .never:
            return "Once"
        case .weekly(let days):
            return days.map(shortWeekday).joined(separator: " · ")
        @unknown default:
            return "Repeats"
        }
    }

    private func shortWeekday(_ weekday: Locale.Weekday) -> String {
        switch weekday {
        case .sunday: return "Sun"
        case .monday: return "Mon"
        case .tuesday: return "Tue"
        case .wednesday: return "Wed"
        case .thursday: return "Thu"
        case .friday: return "Fri"
        case .saturday: return "Sat"
        @unknown default: return "Day"
        }
    }

    private func cancelAlarm(_ id: UUID) {
        do {
            try service.cancelAlarm(id: id)
        } catch {
            statusMessage = error.localizedDescription
        }
    }

    private func scheduleAlarm() {
        let components = Calendar.current.dateComponents([.hour, .minute], from: wakeTime)
        guard let hour = components.hour, let minute = components.minute else { return }

        isScheduling = true
        statusMessage = ""
        Task {
            do {
                try await service.scheduleWakeAlarm(
                    hour: hour,
                    minute: minute,
                    weekdays: selectedWeekdays
                )
                statusMessage = "Scheduled for \(wakeTime.formatted(date: .omitted, time: .shortened))."
            } catch {
                statusMessage = error.localizedDescription
            }
            isScheduling = false
        }
    }
}

private struct AlarmRingPreviewView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var slideValue = 0.0
    @State private var isEnding = false

    let time: Date
    let onRecordDream: () -> Void

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0.14, green: 0.19, blue: 0.24), Color(red: 0.03, green: 0.05, blue: 0.09)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 24) {
                Text("DREAMWORLD ALARM")
                    .font(.caption2.weight(.bold).monospaced())
                    .tracking(2)
                    .foregroundStyle(.orange.opacity(0.8))

                Spacer()

                Image(systemName: "alarm.fill")
                    .font(.system(size: 58, weight: .light))
                    .foregroundStyle(.white)
                Text(time.formatted(date: .omitted, time: .shortened))
                    .font(.system(size: 62, weight: .medium, design: .monospaced))
                    .minimumScaleFactor(0.7)
                Text("Wake & capture")
                    .foregroundStyle(.secondary)

                Spacer()

                Button("Snooze") {
                    endRinging(openCapture: false)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .tint(.white)
                .foregroundStyle(.black)
                .frame(maxWidth: .infinity)

                ZStack {
                    Capsule()
                        .fill(.white.opacity(0.08))
                        .overlay(Capsule().stroke(.white.opacity(0.2)))
                    Text("SLIDE TO STOP")
                        .font(.caption2.weight(.bold).monospaced())
                        .tracking(1.5)
                        .foregroundStyle(.secondary)
                    Slider(value: $slideValue, in: 0...1) { editing in
                        guard !editing else { return }
                        if slideValue >= 0.92 {
                            endRinging(openCapture: true)
                        } else {
                            withAnimation { slideValue = 0 }
                        }
                    }
                    .tint(.white)
                    .padding(.horizontal, 8)
                    .accessibilityLabel("Slide to stop alarm")
                }
                .frame(height: 64)

                Text("IN-APP INTERACTION PREVIEW · IOS OWNS LOCKED-SCREEN CONTROLS")
                    .font(.system(size: 8, weight: .bold, design: .monospaced))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 56)
        }
        .opacity(isEnding ? 0 : 1)
        .scaleEffect(isEnding ? 0.975 : 1)
        .animation(.easeInOut(duration: 0.52), value: isEnding)
        .preferredColorScheme(.dark)
    }

    private func endRinging(openCapture: Bool) {
        guard !isEnding else { return }
        withAnimation {
            isEnding = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.56) {
            if openCapture {
                onRecordDream()
            }
            dismiss()
        }
    }
}
