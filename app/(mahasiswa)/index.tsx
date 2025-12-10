import { ThemedText } from "@/components/ThemedText";
import { Urbanist_400Regular } from "@expo-google-fonts/urbanist/400Regular";
import { Urbanist_600SemiBold } from "@expo-google-fonts/urbanist/600SemiBold";
import { useFonts } from "@expo-google-fonts/urbanist/useFonts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Image, ImageBackground, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import ContentCard from "../../components/ContentCard";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

interface ContentItem {
  id: string;
  label: string;
  title: string;
  contents: string[];
  route: string | null;
}

interface ClassScheduleItem {
  id_class: number;
  code_class: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  subject: {
    id_subject: number;
    name_subject: string;
  };
  academic_period?: {
    id: number;
    name: string;
  };
  lecturer_name?: string;
}

interface StudentIdentity {
  name: string;
  username: string;
  profile_image: string | null;
  full_name: string;
  email: string;
  program_name: string | null;
  generation: string | null;
  gender: string | null;
  registration_number: string | null;
}

interface GradeItem {
  id_class: number;
  code_class: string;
  subject_name: string;
  code_subject: string;
  sks: number;
  academic_period: string;
  grade_details: {
    score: number;
    letter: string;
    ip: number;
  } | null;
}

interface AcademicStats {
  totalSks: number;
  ipk: string;
  currentIps: string;
  currentPeriod: string;
}

interface AttendanceClass {
  id_class: number;
  kelas: string;
  nama_matkul: string;
  dosen: string;
  attendance_stats: {
    total_pertemuan: number;
    sudah_presensi: number;
    persentase_kehadiran: number;
  };
}

interface NotificationItem {
  id_notification: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  sent_at: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const isMounted = useRef(true);

  let [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [studentIdentity, setStudentIdentity] = useState<StudentIdentity | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [academicStats, setAcademicStats] = useState<AcademicStats>({
    totalSks: 0,
    ipk: "0.00",
    currentIps: "0.00",
    currentPeriod: "-",
  });
  const [isLoadingGrades, setIsLoadingGrades] = useState(true);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [attendanceClasses, setAttendanceClasses] = useState<AttendanceClass[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  const fetchStudentIdentity = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      console.log("[MAHASISWA HOME] Fetching student identity...");
      const response = await api.get("/student/profile/identity");
      if (isMounted.current) {
        setStudentIdentity(response.data.data);
        console.log("[MAHASISWA HOME] Student identity loaded successfully");
      }
    } catch (error: any) {
      console.error("========================================");
      console.error("[MAHASISWA HOME] Error fetching student identity:", error);
      console.error("[MAHASISWA HOME] Error status:", error.response?.status);
      console.error("[MAHASISWA HOME] Error message:", error.response?.data?.message);
      console.error("========================================");

      // If 401, user will be auto-logged out by axios interceptor
      if (error.response?.status === 401) {
        console.log("[MAHASISWA HOME] 401 detected - waiting for auto logout");
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingProfile(false);
      }
    }
  }, []);

  const fetchGrades = useCallback(async () => {
    setIsLoadingGrades(true);
    try {
      const response = await api.get("/student/grades");
      const responseData = response.data.data;
      const gradesData = responseData.grade || {};

      // Konversi object ke array
      let gradesArray: GradeItem[] = [];
      if (Array.isArray(gradesData)) {
        gradesArray = gradesData;
      } else if (typeof gradesData === "object" && gradesData !== null) {
        gradesArray = Object.values(gradesData);
      }

      if (gradesArray.length === 0) {
        if (isMounted.current) {
          setAcademicStats({
            totalSks: 0,
            ipk: "0.00",
            currentIps: "0.00",
            currentPeriod: "-",
          });
        }
        return;
      }

      // Hitung IPK (semua periode)
      let totalSksAll = 0;
      let totalBobotAll = 0;

      gradesArray.forEach((item) => {
        if (item.grade_details) {
          const sks = item.sks;
          const ip = item.grade_details.ip;
          totalSksAll += sks;
          totalBobotAll += sks * ip;
        }
      });

      const ipk = totalSksAll > 0 ? (totalBobotAll / totalSksAll).toFixed(2) : "0.00";

      // Cari periode terbaru (asumsi format periode seperti "2024/2025 Ganjil")
      const periods = [...new Set(gradesArray.map((item) => item.academic_period))].filter(Boolean).sort().reverse();
      const currentPeriod = periods[0] || "-";

      // Hitung IPS (periode terbaru)
      const currentPeriodGrades = gradesArray.filter((item) => item.academic_period === currentPeriod);
      let totalSksCurrent = 0;
      let totalBobotCurrent = 0;

      currentPeriodGrades.forEach((item) => {
        if (item.grade_details) {
          const sks = item.sks;
          const ip = item.grade_details.ip;
          totalSksCurrent += sks;
          totalBobotCurrent += sks * ip;
        }
      });

      const currentIps = totalSksCurrent > 0 ? (totalBobotCurrent / totalSksCurrent).toFixed(2) : "0.00";

      if (isMounted.current) {
        setAcademicStats({
          totalSks: totalSksAll,
          ipk,
          currentIps,
          currentPeriod,
        });
      }
    } catch (error: any) {
      console.error("========================================");
      console.error("[MAHASISWA HOME] Error fetching grades:", error);
      console.error("[MAHASISWA HOME] Error status:", error.response?.status);
      console.error("========================================");

      if (error.response?.status === 401) {
        console.log("[MAHASISWA HOME] 401 in grades - waiting for auto logout");
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingGrades(false);
      }
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      if (isMounted.current && response.data.status === "success") {
        setUnreadCount(response.data.data.unread_count || 0);
      }
    } catch (error: any) {
      console.error("[MAHASISWA HOME] Error fetching unread count:", error);
      if (error.response?.status === 401) {
        console.log("[MAHASISWA HOME] 401 in notifications - waiting for auto logout");
      }
    }
  }, []);

  const fetchAttendanceClasses = useCallback(async () => {
    setIsLoadingAttendance(true);
    try {
      const response = await api.get("/student/attendance/classes");
      const classesData = response.data.data || [];

      // Fetch attendance stats for each class (limit to 2)
      const limitedClasses = classesData.slice(0, 2);
      const classesWithStats = await Promise.all(
        limitedClasses.map(async (classItem: any) => {
          try {
            const historyResponse = await api.get(`/student/attendance/classes/${classItem.id_class}/history`);
            const stats = historyResponse.data.data.statistics;
            return {
              ...classItem,
              attendance_stats: stats,
            };
          } catch (error) {
            console.error(`Error fetching attendance for class ${classItem.id_class}:`, error);
            return {
              ...classItem,
              attendance_stats: {
                total_pertemuan: 0,
                sudah_presensi: 0,
                persentase_kehadiran: 0,
              },
            };
          }
        })
      );

      if (isMounted.current) {
        setAttendanceClasses(classesWithStats);
      }
    } catch (error: any) {
      console.error("[MAHASISWA HOME] Error fetching attendance classes:", error);
      if (error.response?.status === 401) {
        console.log("[MAHASISWA HOME] 401 in attendance - waiting for auto logout");
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingAttendance(false);
      }
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      const response = await api.get("/notifications", { params: { limit: 3 } });
      if (isMounted.current && response.data.status === "success") {
        const notificationsData = response.data.data.notifications || [];
        setNotifications(notificationsData.slice(0, 2)); // Limit to 2
      }
    } catch (error: any) {
      console.error("[MAHASISWA HOME] Error fetching notifications:", error);
      if (error.response?.status === 401) {
        console.log("[MAHASISWA HOME] 401 in notifications - waiting for auto logout");
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingNotifications(false);
      }
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    setIsLoadingSchedules(true);
    try {
      const response = await api.get("/student/schedules");
      const schedulesData = response.data.data || [];

      if (isMounted.current) {
        setSchedules(schedulesData);

        // Generate content card dari jadwal hari ini
        const today = new Date();
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday=0 to 7

        const todaySchedules = schedulesData.filter((schedule: ClassScheduleItem) => schedule.day_of_week === dayOfWeek);

        if (todaySchedules.length > 0) {
          const scheduleContents = todaySchedules.map((schedule: ClassScheduleItem) => {
            const formatTime = (time: string) => time.substring(0, 5);
            return `${schedule.subject?.name_subject} (${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)})`;
          });

          const contentItem: ContentItem = {
            id: "schedule-today",
            label: "Jadwal Anda",
            title: `${todaySchedules.length} Class${todaySchedules.length > 1 ? "es" : ""} Today`,
            contents: scheduleContents,
            route: "/jadwal",
          };

          setAllContent([contentItem]);
          setFilteredContent([contentItem]);
        } else {
          const contentItem: ContentItem = {
            id: "schedule-empty",
            label: "Jadwal Anda",
            title: "No Classes Today",
            contents: ["Tap to view full schedule"],
            route: "/jadwal",
          };

          setAllContent([contentItem]);
          setFilteredContent([contentItem]);
        }
      }
    } catch (error: any) {
      console.error("========================================");
      console.error("[MAHASISWA HOME] Error fetching schedules:", error);
      console.error("[MAHASISWA HOME] Error status:", error.response?.status);
      console.error("========================================");

      if (error.response?.status === 401) {
        console.log("[MAHASISWA HOME] 401 in schedules - waiting for auto logout");
      }

      // Set empty content on error
      const contentItem: ContentItem = {
        id: "schedule-error",
        label: "Jadwal Anda",
        title: "Unable to load schedule",
        contents: ["Tap to retry"],
        route: "/jadwal",
      };

      if (isMounted.current) {
        setAllContent([contentItem]);
        setFilteredContent([contentItem]);
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingSchedules(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStudentIdentity();
      fetchGrades();
      fetchSchedules();
      fetchUnreadCount();
      fetchAttendanceClasses();
      fetchNotifications();
    }, [fetchStudentIdentity, fetchGrades, fetchSchedules, fetchUnreadCount, fetchAttendanceClasses, fetchNotifications])
  );

  useEffect(() => {
    if (searchQuery === "") {
      setFilteredContent(allContent);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filteredData = allContent.filter((item) => {
        return item.title.toLowerCase().includes(lowercasedQuery) || item.label.toLowerCase().includes(lowercasedQuery);
      });
      setFilteredContent(filteredData);
    }
  }, [searchQuery, allContent]);

  const handleChatPress = () => {
    try {
      router.push("/chat" as any);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleNotificationPress = () => {
    router.push("/notification" as any);
  };

  const handleContentPress = (item: ContentItem) => {
    if (!item.route) return;
    try {
      router.push(`/(mahasiswa)${item.route}` as any);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleAttendancePress = (classId: number) => {
    router.push({
      pathname: "/(mahasiswa)/attendance-detail",
      params: { id_class: classId },
    } as any);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return "#22c55e";
    if (pct >= 60) return "#eab308";
    return "#ef4444";
  };

  const displayName = studentIdentity?.full_name || studentIdentity?.name || user?.name || "User";
  const displayId = studentIdentity?.registration_number || studentIdentity?.username || user?.email || "NIM not available";
  const profileImageUri = studentIdentity?.profile_image;

  const renderProfileImage = () => {
    if (isLoadingProfile) {
      return (
        <View style={[styles.avatar, styles.avatarLoading]}>
          <ActivityIndicator size="small" color="#015023" />
        </View>
      );
    }

    if (profileImageUri) {
      return (
        <Image
          source={{ uri: profileImageUri }}
          style={styles.avatar}
          defaultSource={require("../../assets/images/unnamed.jpg")}
          onError={(error) => {
            console.log("Image load error:", error.nativeEvent.error);
          }}
        />
      );
    }

    return <Image source={require("../../assets/images/unnamed.jpg")} style={styles.avatar} />;
  };

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#015023" translucent={false} />

      <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push("/(mahasiswa)/profil" as any)} style={styles.profileSection}>
              {renderProfileImage()}
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.userId} numberOfLines={1}>
                  {displayId}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.iconsSection}>
              <TouchableOpacity onPress={handleChatPress} style={styles.iconButton} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chatbox-ellipses-outline" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleNotificationPress} style={styles.iconButton} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <View>
                  <Ionicons name="notifications-outline" size={24} color="white" />
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false} bounces={true}>
            <TouchableOpacity onPress={() => router.push("/(mahasiswa)/grades" as any)} activeOpacity={0.7}>
              <View style={styles.achievementContainer}>
                <View style={styles.achievementCard}>
                  <ThemedText style={styles.achievementLabel}>Total SKS</ThemedText>
                  {isLoadingGrades ? <ActivityIndicator size="small" color="#015023" /> : <Text style={styles.achievementValue}>{academicStats.totalSks}</Text>}
                </View>

                <View style={styles.achievementCard}>
                  <ThemedText style={styles.achievementLabel}>IPK</ThemedText>
                  {isLoadingGrades ? <ActivityIndicator size="small" color="#015023" /> : <Text style={styles.achievementValue}>{academicStats.ipk}</Text>}
                </View>

                <View style={styles.achievementCard}>
                  <ThemedText style={styles.achievementLabel}>IPS</ThemedText>
                  {isLoadingGrades ? <ActivityIndicator size="small" color="#015023" /> : <Text style={styles.achievementValue}>{academicStats.currentIps}</Text>}
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.searchContainer}>
              <TextInput placeholder="Search by title or label..." style={styles.searchInput} placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
              <Ionicons name="search-outline" size={20} color="#666" />
            </View>

            {/* Attendance Classes Card */}
            <ThemedText variant="bold" style={styles.cardTitle}>
              Kehadiran Kelas
            </ThemedText>

            <ImageBackground source={require("../../assets/images/batik.png")} style={styles.dashboardCard} imageStyle={styles.cardImage} resizeMode="cover">
              <TouchableOpacity style={styles.cardContent} onPress={() => router.push("/(mahasiswa)/grades" as any)} activeOpacity={0.7}>
                {isLoadingAttendance ? (
                  <View style={styles.loadingCard}>
                    <ActivityIndicator size="small" color="#015023" />
                  </View>
                ) : attendanceClasses.length > 0 ? (
                  <>
                    {attendanceClasses.map((classItem, index) => {
                      const percentage = classItem.attendance_stats.persentase_kehadiran || 0;
                      return (
                        <TouchableOpacity key={classItem.id_class} style={[styles.attendanceItem, index > 0 && styles.attendanceItemBorder]} onPress={() => handleAttendancePress(classItem.id_class)} activeOpacity={0.7}>
                          <View style={styles.attendanceHeader}>
                            <View style={styles.attendanceHeaderLeft}>
                              <View style={styles.classCodeBadge}>
                                <ThemedText variant="semibold" style={styles.classCodeText}>
                                  {classItem.kelas}
                                </ThemedText>
                              </View>
                            </View>
                            <View style={[styles.percentageChip, { backgroundColor: getPercentageColor(percentage) }]}>
                              <ThemedText variant="semibold" style={styles.percentageText}>
                                {percentage.toFixed(0)}%
                              </ThemedText>
                            </View>
                          </View>

                          <ThemedText variant="semibold" style={styles.attendanceSubject} numberOfLines={1}>
                            {classItem.nama_matkul}
                          </ThemedText>
                          <ThemedText style={styles.attendanceDosen} numberOfLines={1}>
                            {classItem.dosen}
                          </ThemedText>

                          <View style={styles.attendanceFooter}>
                            <View style={styles.attendanceStats}>
                              <Ionicons name="calendar-outline" size={14} color="#8B7355" />
                              <ThemedText style={styles.attendanceStatsText}>
                                {classItem.attendance_stats.sudah_presensi}/{classItem.attendance_stats.total_pertemuan} Pertemuan
                              </ThemedText>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons name="calendar-outline" size={32} color="#ccc" />
                    <ThemedText style={styles.emptyCardText}>Belum ada data kehadiran</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            </ImageBackground>

            {/* Notifications Card */}
            <ThemedText variant="bold" style={styles.cardTitle}>
              Notifikasi Terbaru
            </ThemedText>
            <ImageBackground source={require("../../assets/images/batik.png")} style={styles.dashboardCard} imageStyle={styles.cardImage} resizeMode="cover">
              <TouchableOpacity style={styles.cardContent} onPress={handleNotificationPress} activeOpacity={0.7}>
                {isLoadingNotifications ? (
                  <View style={styles.loadingCard}>
                    <ActivityIndicator size="small" color="#015023" />
                  </View>
                ) : notifications.length > 0 ? (
                  <>
                    {notifications.map((notif, index) => (
                      <View key={notif.id_notification} style={[styles.notifItem, index > 0 && styles.notifItemBorder]}>
                        <View style={styles.notifHeader}>
                          <View style={styles.notifTypeIcon}>
                            <Ionicons name={notif.type === "chat" ? "chatbubble" : "megaphone"} size={14} color={notif.type === "chat" ? "#0EA5E9" : "#F59E0B"} />
                          </View>
                          <ThemedText variant="semibold" style={styles.notifTitle} numberOfLines={1}>
                            {notif.title}
                          </ThemedText>
                          {!notif.is_read && <View style={styles.unreadDot} />}
                        </View>
                        <ThemedText style={styles.notifMessage} numberOfLines={2}>
                          {notif.message}
                        </ThemedText>
                        <ThemedText style={styles.notifTime}>{formatTimeAgo(notif.sent_at)}</ThemedText>
                      </View>
                    ))}
                  </>
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons name="notifications-outline" size={32} color="#ccc" />
                    <ThemedText style={styles.emptyCardText}>Belum ada notifikasi</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            </ImageBackground>

            {filteredContent.length > 0 ? (
              filteredContent.map((item) => (
                <TouchableOpacity key={item.id} onPress={() => handleContentPress(item)} disabled={!item.route} activeOpacity={item.route ? 0.7 : 1}>
                  <ContentCard label={item.label} title={item.title} contents={item.contents} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.5)" />
                <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
    marginBottom: 85, // Disesuaikan agar tidak tertutup tab bar
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: "Urbanist_600SemiBold",
    fontWeight: "600",
    color: "white",
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "400",
  },
  iconsSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarLoading: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  achievementContainer: {
    backgroundColor: "#F5EFD3",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000",
    flexDirection: "row",
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  achievementCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementLabel: {
    fontFamily: "Urbanist_400Regular",
    fontSize: 14,
    fontWeight: "800",
    color: "#333",
    marginBottom: 4,
  },
  achievementValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#015023",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5EFD3",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginBottom: 25,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontFamily: "Urbanist_400Regular",
    fontWeight: "400",
  },
  loader: {
    marginTop: 30,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    textAlign: "center",
    marginTop: 16,
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontFamily: "Urbanist_400Regular",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#015023",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Dashboard Cards
  dashboardCard: {
    backgroundColor: "#F5EFD3",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000",
    marginBottom: 26,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  cardImage: {
    borderRadius: 12,
    opacity: 0.5,
  },

  cardContent: {
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 18,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },

  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(1, 80, 35, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  cardTitle: {
    lineHeight: 18,
    fontSize: 18,
    color: "#fff",
    marginBottom: 12,
  },

  loadingCard: {
    alignItems: "center",
    paddingVertical: 20,
  },

  emptyCard: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },

  emptyCardText: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 8,
  },

  // Attendance Items
  attendanceItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },

  attendanceItemBorder: {
    marginTop: 8,
  },

  attendanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  attendanceHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  classCodeBadge: {
    backgroundColor: "#DABC4E",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  classCodeText: {
    fontSize: 11,
    color: "#015023",
  },

  percentageChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 50,
    alignItems: "center",
  },

  percentageText: {
    fontSize: 12,
    color: "#fff",
  },

  attendanceSubject: {
    fontSize: 15,
    color: "#015023",
    marginBottom: 4,
  },

  attendanceDosen: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },

  attendanceFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },

  attendanceStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  attendanceStatsText: {
    fontSize: 12,
    color: "#8B7355",
  },

  // Notification Items
  notifItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },

  notifItemBorder: {
    marginTop: 8,
  },

  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  notifTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },

  notifTitle: {
    flex: 1,
    fontSize: 14,
    color: "#015023",
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },

  notifMessage: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
    marginBottom: 4,
  },

  notifTime: {
    fontSize: 11,
    color: "#9CA3AF",
  },

  notificationBadgeSmall: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  badgeTextSmall: {
    color: "#fff",
    fontSize: 10,
  },
});
