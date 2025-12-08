import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
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
  is_active: boolean;
  total_present: number;
  total_students: number;
  attendance_percentage: number;
}

interface ApiResponse {
  status: string;
  message: string;
  data: {
    class_info: ClassInfo;
    schedules: Schedule[];
  };
}

export default function ClassDetailPage() {
  const { id_class } = useLocalSearchParams<{ id_class: string }>();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchClassDetail = useCallback(async () => {
    if (!id_class || !isMounted.current) return;

    setIsLoading(true);
    try {
      const response = await api.get<ApiResponse>(`/lecturer/attendance/classes/${id_class}/schedules`);

      if (response.data.status === "success" && isMounted.current) {
        setClassInfo(response.data.data.class_info);
        setSchedules(response.data.data.schedules);
      }
    } catch (error: any) {
      console.error("Error fetching class detail:", error);
      if (isMounted.current) {
        Alert.alert("Error", error.response?.data?.message || "Gagal memuat data kelas");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [id_class]);

  // Fetch pertama kali saat mount
  useEffect(() => {
    fetchClassDetail();
  }, [fetchClassDetail]);

  // Auto-refresh setiap kali screen menjadi focus (kembali dari halaman lain)
  useFocusEffect(
    useCallback(() => {
      if (isMounted.current) {
        fetchClassDetail();
      }
    }, [fetchClassDetail])
  );

  const handleManualPresence = (schedule: Schedule) => {
    if (!classInfo) return;

    router.push({
      pathname: "./_manualAttendance",
      params: {
        id_class: classInfo.id_class,
        id_schedule: schedule.id_schedule,
        pertemuan: schedule.pertemuan,
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Oct", "Nov", "Des"];

    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const renderScheduleCard = ({ item }: { item: Schedule }) => (
    <View style={styles.scheduleCard}>
      {/* Schedule Header */}
      <View style={styles.scheduleHeader}>
        <View style={styles.scheduleHeaderLeft}>
          <ThemedText variant="bold" style={styles.scheduleNumber}>
            Pertemuan {item.pertemuan}
          </ThemedText>
          {item.is_active && (
            <View style={styles.activeBadge}>
              <ThemedText variant="semibold" style={styles.activeBadgeText}>
                Aktif
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Date & Time */}
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

      {/* Attendance Stats */}
      <View style={styles.attendanceStats}>
        <View style={styles.statItem}>
          <ThemedText variant="semibold" style={styles.statValue}>
            {item.total_present}/{item.total_students}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Mahasiswa Hadir</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText variant="semibold" style={styles.statValue}>
            {item.attendance_percentage.toFixed(0)}%
          </ThemedText>
          <ThemedText style={styles.statLabel}>Kehadiran</ThemedText>
        </View>
      </View>

      {/* Manual Presence Button */}
      <TouchableOpacity style={styles.manualButton} onPress={() => handleManualPresence(item)} activeOpacity={0.7}>
        <Ionicons name="checkbox-outline" size={20} color="#015023" />
        <ThemedText variant="semibold" style={styles.manualButtonText}>
          Presensi Manual
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F5EFD3" />
            <ThemedText variant="semibold" style={styles.loadingText}>
              Memuat detail kelas...
            </ThemedText>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!classInfo) {
    return (
      <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="rgba(255,255,255,0.5)" />
            <ThemedText variant="semibold" style={styles.emptyText}>
              Data kelas tidak ditemukan
            </ThemedText>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <ThemedText variant="bold" style={styles.headerTitle}>
            Detail Kelas
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
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <ThemedText style={styles.classInfoText}>{classInfo.academic_period}</ThemedText>
            </View>

            <View style={styles.classInfoRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <ThemedText style={styles.classInfoText}>
                {classInfo.start_time} - {classInfo.end_time}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Schedules List */}
        <View style={styles.schedulesSection}>
          <ThemedText variant="semibold" style={styles.sectionTitle}>
            Daftar Pertemuan
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
    gap: 10,
  },
  scheduleNumber: {
    fontSize: 16,
    color: "#015023",
  },
  activeBadge: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
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
  attendanceStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(1, 80, 35, 0.05)",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(1, 80, 35, 0.2)",
  },
  statValue: {
    fontSize: 18,
    color: "#015023",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
  },
  manualButton: {
    backgroundColor: "#DABC4E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  manualButtonText: {
    fontSize: 14,
    color: "#015023",
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
