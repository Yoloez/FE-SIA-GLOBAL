import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface CalendarPickerProps {
  visible: boolean;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
}

export default function CalendarPicker({ visible, selectedDate, onDateSelect, onClose }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const generateCalendarDays = () => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.calendarModalOverlay}>
        <View style={styles.calendarModal}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePreviousMonth} style={styles.calendarNavButton}>
              <Ionicons name="chevron-back" size={24} color="#015023" />
            </TouchableOpacity>
            <ThemedText variant="bold" style={styles.calendarHeaderText}>
              {currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </ThemedText>
            <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavButton}>
              <Ionicons name="chevron-forward" size={24} color="#015023" />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarWeekDays}>
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
              <ThemedText key={day} variant="semibold" style={styles.weekDayText}>
                {day}
              </ThemedText>
            ))}
          </View>

          <ScrollView style={styles.calendarDaysContainer}>
            <View style={styles.calendarDays}>
              {generateCalendarDays().map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.emptyDay} />;
                }

                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    style={[styles.dayButton, isToday && styles.todayButton, isSelected && styles.selectedDayButton, isPast && styles.pastDayButton]}
                    onPress={() => onDateSelect(day)}
                    disabled={isPast}
                  >
                    <ThemedText variant="medium" style={[styles.dayText, isToday && styles.todayText, isSelected && styles.selectedDayText, isPast && styles.pastDayText]}>
                      {day.getDate()}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.calendarCloseButton}>
            <ThemedText variant="semibold" style={styles.calendarCloseText}>
              Tutup
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  calendarModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F5EFD3",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  calendarHeaderText: {
    fontSize: 16,
    color: "#015023",
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(1, 80, 35, 0.1)",
  },
  calendarWeekDays: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "#f9fafb",
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#666",
  },
  calendarDaysContainer: {
    maxHeight: 320,
  },
  calendarDays: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  emptyDay: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 4,
  },
  dayButton: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  todayButton: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 8,
  },
  selectedDayButton: {
    backgroundColor: "#DABC4E",
    borderRadius: 8,
  },
  pastDayButton: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    color: "#1f2937",
  },
  todayText: {
    color: "#3b82f6",
    fontWeight: "700",
  },
  selectedDayText: {
    color: "#015023",
    fontWeight: "700",
  },
  pastDayText: {
    color: "#9ca3af",
  },
  calendarCloseButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    alignItems: "center",
  },
  calendarCloseText: {
    fontSize: 14,
    color: "#6b7280",
  },
});
