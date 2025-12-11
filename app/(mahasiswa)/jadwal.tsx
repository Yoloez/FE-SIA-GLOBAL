import { useStudentData } from "@/context/StudentDataContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, ImageBackground, SafeAreaView, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import CustomAlert from "../../components/CustomAlert";
import { ThemedText } from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const { schedules, isLoadingSchedules } = useStudentData();
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [] as { text: string; onPress: () => void }[],
  });

  // Helper function untuk mendapatkan awal minggu (Senin)
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  // Generate dates untuk minggu ini
  const generateWeekDates = () => {
    const dates = [];
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push({
        day: dayNames[date.getDay()],
        date: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        fullDate: date,
      });
    }
    return dates;
  };

  const weekDates = generateWeekDates();

  const dayFullNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Navigate ke minggu sebelumnya
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);

    const newSelectedDate = new Date(selectedDate);
    newSelectedDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(newSelectedDate);
  };

  // Navigate ke minggu berikutnya
  const goToNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);

    const newSelectedDate = new Date(selectedDate);
    newSelectedDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newSelectedDate);
  };

  // Reset ke minggu ini
  const goToThisWeek = () => {
    const today = new Date();
    setCurrentWeekStart(getWeekStart(today));
    setSelectedDate(today);
  };

  // Filter jadwal berdasarkan hari yang dipilih
  const getSchedulesForSelectedDay = () => {
    const dayOfWeek = selectedDate.getDay();
    // Convert: Sunday=0 -> 7, Monday=1 -> 1, etc.
    const apiDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

    return schedules.filter((schedule) => schedule.day_of_week === apiDayOfWeek);
  };

  // Format waktu dari HH:MM:SS ke HH:MM
  const formatTime = (time: string) => {
    if (!time) return "";
    return time.substring(0, 5);
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  // Check if date is selected
  const isSelectedDate = (date: Date) => {
    return date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
  };

  // Get week label
  const getWeekLabel = () => {
    const today = new Date();
    const weekStartToday = getWeekStart(today);

    if (currentWeekStart.getTime() === weekStartToday.getTime()) {
      return "This Week";
    }

    const diffTime = currentWeekStart.getTime() - weekStartToday.getTime();
    const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));

    if (diffWeeks === 1) return "Next Week";
    if (diffWeeks === -1) return "Last Week";
    if (diffWeeks > 1) return `${diffWeeks} Weeks Ahead`;
    if (diffWeeks < -1) return `${Math.abs(diffWeeks)} Weeks Ago`;

    return "This Week";
  };

  const filteredSchedules = getSchedulesForSelectedDay();

  // Get selected date info
  const dateInfo = {
    date: selectedDate.getDate(),
    dayName: dayFullNames[selectedDate.getDay()],
    monthYear: selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#015023" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <ThemedText variant="semibold" style={styles.headerTitle}>
            Your Schedule
          </ThemedText>
          <TouchableOpacity style={styles.calendarButton} onPress={goToThisWeek}>
            <Ionicons name="calendar-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Week Navigation */}
          <View style={styles.weekNav}>
            <TouchableOpacity onPress={goToPreviousWeek}>
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <ThemedText style={styles.weekText}>{getWeekLabel()}</ThemedText>
            <TouchableOpacity onPress={goToNextWeek}>
              <Ionicons name="chevron-forward" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Date Display */}
          <View style={styles.dateDisplay}>
            <ThemedText variant="bold" style={styles.dateNumber}>
              {dateInfo.date}
            </ThemedText>
            <View>
              <ThemedText variant="semibold" style={styles.dayName}>
                {dateInfo.dayName}
              </ThemedText>
              <ThemedText style={styles.monthYear}>{dateInfo.monthYear}</ThemedText>
            </View>
          </View>

          {/* Date Selector */}
          <View style={styles.dateSelector}>
            {weekDates.map((item, index) => {
              const isSelected = isSelectedDate(item.fullDate);
              const isTodayDate = isToday(item.fullDate);

              return (
                <TouchableOpacity key={index} style={[styles.dateItem, isSelected && styles.dateItemActive, isTodayDate && !isSelected && styles.dateItemToday]} onPress={() => setSelectedDate(item.fullDate)}>
                  <ThemedText variant="semibold" style={[styles.dateDay, isSelected && styles.dateDayActive, isTodayDate && !isSelected && styles.dateDayToday]}>
                    {item.day}
                  </ThemedText>
                  <ThemedText variant="bold" style={[styles.dateNum, isSelected && styles.dateNumActive, isTodayDate && !isSelected && styles.dateNumToday]}>
                    {item.date}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Loading Indicator */}
          {isLoadingSchedules ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#DABC4E" />
              <ThemedText style={styles.loadingText}>Memuat jadwal...</ThemedText>
            </View>
          ) : (
            /* Schedule Cards with Image Background */
            <View style={styles.scheduleList}>
              {filteredSchedules.length > 0 ? (
                filteredSchedules.map((schedule) => (
                  <ImageBackground key={schedule.id_class} source={require("../../assets/images/batik.png")} style={styles.scheduleCard} imageStyle={styles.scheduleCardImage}>
                    {/* Overlay */}
                    <View style={styles.cardOverlay}>
                      <View style={styles.cardHeader}>
                        <View style={styles.scheduleLabel}>
                          <ThemedText variant="semibold" style={styles.scheduleLabelText}>
                            Schedule
                          </ThemedText>
                        </View>
                        <ThemedText variant="semibold" style={styles.scheduleTime}>
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </ThemedText>
                      </View>

                      <ThemedText variant="bold" style={styles.scheduleTitle}>
                        {schedule.subject?.name_subject || "Subject Name"}
                      </ThemedText>
                      <ThemedText style={styles.scheduleCode}>{schedule.code_class}</ThemedText>

                      <View style={styles.scheduleInfo}>
                        <View style={styles.infoRow}>
                          <Ionicons name="school-outline" size={16} color="#1a1a1a" style={styles.infoIcon} />
                          <ThemedText style={styles.infoText}>{schedule.academic_period?.name || "Academic Period"}</ThemedText>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons name="calendar-outline" size={16} color="#1a1a1a" style={styles.infoIcon} />
                          <ThemedText style={styles.infoText}>{schedule.total_meetings} Pertemuan</ThemedText>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons name="people-outline" size={16} color="#1a1a1a" style={styles.infoIcon} />
                          <ThemedText style={styles.infoText}>{schedule.member_class} Mahasiswa</ThemedText>
                        </View>
                        {schedule.lecturer_name && (
                          <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={16} color="#1a1a1a" style={styles.infoIcon} />
                            <ThemedText style={styles.infoText}>{schedule.lecturer_name}</ThemedText>
                          </View>
                        )}
                        {schedule.room && (
                          <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={16} color="#1a1a1a" style={styles.infoIcon} />
                            <ThemedText style={styles.infoText}>{schedule.room}</ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  </ImageBackground>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={48} color="#ffffff" />
                  <ThemedText style={styles.emptyText}>Tidak ada jadwal untuk hari ini</ThemedText>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} buttons={alertConfig.buttons} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#015023",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 30,
    marginTop: 20,
  },
  backButton: {
    width: 35,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
  },
  calendarButton: {
    width: 35,
    alignItems: "flex-end",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 60,
  },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
  },
  weekText: {
    color: "#ffffff",
    fontSize: 16,
    paddingHorizontal: 20,
    minWidth: 150,
    textAlign: "center",
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "center",
  },
  dateNumber: {
    color: "#ffffff",
    fontSize: 48,
    marginRight: 15,
  },
  dayName: {
    color: "#ffffff",
    fontSize: 16,
  },
  monthYear: {
    color: "#ffffff",
    fontSize: 14,
    opacity: 0.8,
  },
  dateSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dateItem: {
    backgroundColor: "#F5EFD3",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minWidth: 40,
    alignItems: "center",
  },
  dateItemActive: {
    backgroundColor: "#DABC4E",
  },
  dateItemToday: {
    backgroundColor: "#c9e4ca",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  dateDay: {
    color: "#015023",
    fontSize: 10,
    marginBottom: 2,
  },
  dateDayActive: {
    color: "#1a1a1a",
  },
  dateDayToday: {
    color: "#015023",
  },
  dateNum: {
    color: "#015023",
    fontSize: 16,
  },
  dateNumActive: {
    color: "#1a1a1a",
  },
  dateNumToday: {
    color: "#015023",
  },
  scheduleList: {
    paddingBottom: 20,
  },
  scheduleCard: {
    borderRadius: 20,
    marginBottom: 15,
    overflow: "hidden",
  },
  scheduleCardImage: {
    borderRadius: 20,
    opacity: 1,
  },
  cardOverlay: {
    backgroundColor: "rgba(232, 213, 183, 0.2)",
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scheduleLabel: {
    backgroundColor: "#d4b676",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scheduleLabelText: {
    color: "#015023",
    fontSize: 12,
  },
  scheduleTime: {
    color: "#015023",
    fontSize: 14,
  },
  scheduleTitle: {
    color: "#1a1a1a",
    fontSize: 16,
    marginBottom: 4,
  },
  scheduleCode: {
    color: "#666",
    fontSize: 12,
    marginBottom: 12,
  },
  scheduleInfo: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    color: "#1a1a1a",
    fontSize: 13,
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 14,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 10,
    opacity: 0.8,
  },
});
