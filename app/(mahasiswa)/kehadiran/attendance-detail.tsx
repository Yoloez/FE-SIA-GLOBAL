import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api/axios";
import { ThemedText } from "../../../components/ThemedText";

interface ClassInfo {
  id_class: number;
  code_class: string;
  code_subject: string;
  name_subject: string;
  sks: number;
  dosen: string;
  start_time: string;
  end_time: string;
  academic_period: string;
}

interface Schedule {
  no: number;
  id_schedule: number;
  pertemuan: number;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  code_class: string;
  jam_presensi: string | null;
  status: string | null;
  is_active: boolean;
}

interface Statistics {
  total_pertemuan: number;
  sudah_presensi: number;
  persentase_kehadiran: number;
}

export default function AttendanceDetailScreen() {
  const { id_class } = useLocalSearchParams<{ id_class: string }>();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttendanceHistory = useCallback(async () => {
    if (!id_class) return;

    setIsLoading(true);
    try {
      const response = await api.get(`/student/attendance/classes/${id_class}/history`);
      const data = response.data.data;

      setClassInfo(data.class_info);
      setSchedules(data.schedules);
      setStatistics(data.statistics);
    } catch (error: any) {
      console.error("Error fetching attendance history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id_class]);

  useFocusEffect(
    useCallback(() => {
      fetchAttendanceHistory();
    }, [fetchAttendanceHistory])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "#9ca3af";
    if (status === "Scan QR") return "#22c55e";
    return "#3b82f6";
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return "close-circle";
    if (status === "Scan QR") return "qr-code";
    return "checkmark-circle";
  };

  const renderScheduleCard = ({ item }: { item: Schedule }) => (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <View style={styles.scheduleHeaderLeft}>
          <View style={styles.pertemuanBadge}>
            <ThemedText variant="bold" style={styles.pertemuanText}>
              #{item.pertemuan}
            </ThemedText>
          </View>
          {item.is_active && (
            <View style={styles.activeBadge}>
              <ThemedText variant="semibold" style={styles.activeBadgeText}>
                Active
              </ThemedText>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={14} color="#fff" />
          <ThemedText variant="semibold" style={styles.statusText}>
            {item.status || "Belum"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.scheduleInfo}>
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <ThemedText style={styles.scheduleInfoText}>{formatDate(item.tanggal)}</ThemedText>
      </View>

      <View style={styles.scheduleInfo}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <ThemedText style={styles.scheduleInfoText}>
          {item.jam_mulai} - {item.jam_selesai}
        </ThemedText>
      </View>

      {item.jam_presensi && (
        <View style={styles.scheduleInfo}>
          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
          <ThemedText style={[styles.scheduleInfoText, { color: "#22c55e" }]}>Presensi: {item.jam_presensi}</ThemedText>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F5EFD3" />
            <ThemedText variant="semibold" style={styles.loadingText}>
              Loading Riwayat Kehadiran
            </ThemedText>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!classInfo || !statistics) {
    return (
      <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="rgba(255,255,255,0.5)" />
            <ThemedText variant="semibold" style={styles.emptyText}>
              Class data not found
            </ThemedText>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const percentageColor = statistics.persentase_kehadiran >= 80 ? "#22c55e" : statistics.persentase_kehadiran >= 60 ? "#eab308" : "#ef4444";

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <ThemedText variant="bold" style={styles.headerTitle}>
            Riwayat Kehadiran
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Class Info Card */}
        <View style={styles.classInfoContainer}>
          <View style={styles.classInfoCard}>
            <View style={styles.classInfoHeader}>
              <View style={styles.codeChip}>
                <ThemedText variant="bold" style={styles.codeChipText}>
                  {classInfo.code_subject}
                </ThemedText>
              </View>
              <View style={styles.sksChip}>
                <ThemedText variant="bold" style={styles.sksChipText}>
                  {classInfo.sks} SKS
                </ThemedText>
              </View>
            </View>

            <ThemedText variant="bold" style={styles.className}>
              {classInfo.name_subject}
            </ThemedText>

            <View style={styles.classInfoRow}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <ThemedText style={styles.classInfoText}>Kelas {classInfo.code_class}</ThemedText>
            </View>

            <View style={styles.classInfoRow}>
              <Ionicons name="person-outline" size={16} color="#666" />
              <ThemedText style={styles.classInfoText}>{classInfo.dosen}</ThemedText>
            </View>

            <View style={styles.classInfoRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <ThemedText style={styles.classInfoText}>
                {classInfo.start_time} - {classInfo.end_time}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Statistics Card */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Total Pertemuan</ThemedText>
              <ThemedText variant="bold" style={styles.statValue}>
                {statistics.total_pertemuan}
              </ThemedText>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Sudah Presensi</ThemedText>
              <ThemedText variant="bold" style={styles.statValue}>
                {statistics.sudah_presensi}
              </ThemedText>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Kehadiran</ThemedText>
              <ThemedText variant="bold" style={[styles.statValue, { color: percentageColor }]}>
                {statistics.persentase_kehadiran.toFixed(0)}%
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Schedules List */}
        <View style={styles.schedulesSection}>
          <ThemedText variant="semibold" style={styles.sectionTitle}>
            Riwayat Pertemuan
          </ThemedText>
          {schedules.length > 0 ? (
            <FlatList data={schedules} renderItem={renderScheduleCard} keyExtractor={(item) => item.id_schedule.toString()} contentContainerStyle={styles.schedulesList} showsVerticalScrollIndicator={false} />
          ) : (
            <View style={styles.emptySchedules}>
              <Ionicons name="calendar-outline" size={48} color="rgba(255,255,255,0.4)" />
              <ThemedText style={styles.emptySchedulesText}>Belum ada jadwal pertemuan</ThemedText>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  classInfoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  classInfoCard: {
    backgroundColor: "#F5EFD3",
    borderRadius: 20,
    padding: 18,
  },
  classInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  codeChip: {
    backgroundColor: "#DABC4E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  codeChipText: {
    fontSize: 12,
    color: "#015023",
  },
  sksChip: {
    backgroundColor: "#015023",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sksChipText: {
    fontSize: 12,
    color: "#F5EFD3",
  },
  className: {
    fontSize: 16,
    color: "#015023",
    marginBottom: 12,
    lineHeight: 22,
  },
  classInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  classInfoText: {
    fontSize: 13,
    color: "#666",
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  statsCard: {
    backgroundColor: "#F5EFD3",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(1, 80, 35, 0.2)",
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    color: "#015023",
  },
  schedulesSection: {
    flex: 1,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#F5EFD3",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  schedulesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scheduleCard: {
    backgroundColor: "#F5EFD3",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scheduleHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pertemuanBadge: {
    backgroundColor: "#015023",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pertemuanText: {
    fontSize: 12,
    color: "#F5EFD3",
  },
  activeBadge: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    color: "#ffffff",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    color: "#ffffff",
  },
  scheduleInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  scheduleInfoText: {
    fontSize: 13,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#F5EFD3",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginTop: 16,
  },
  emptySchedules: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptySchedulesText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 12,
  },
});
