import AlarmKit
import Foundation
import SwiftUI

struct AlarmSetupView: View {
    @StateObject private var service = DreamAlarmService()
    @State private var wakeTime = Calendar.current.date(from: DateComponents(hour: 7, minute: 30)) ?? Date()
    @State private var selectedWeekdays: Set<Locale.Weekday> = []
    @State private var statusMessage = ""
    @State private var isScheduling = false

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
            }
            .navigationTitle("Wake Alarm")
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
                        Label("Schedule Dream Alarm", systemImage: "alarm.waves.left.and.right.fill")
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
            Text("The alarm uses Apple’s system alarm experience. Record Dream opens Capture; recording begins only when you tap the microphone.")
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
                    HStack {
                        Label("Dream alarm", systemImage: "alarm.fill")
                        Spacer()
                        Button("Cancel", role: .destructive) {
                            cancelAlarm(alarm.id)
                        }
                    }
                }
            }
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
