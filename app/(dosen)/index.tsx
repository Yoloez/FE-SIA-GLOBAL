import { ThemedText } from "@/components/ThemedText";
import { Urbanist_400Regular } from "@expo-google-fonts/urbanist/400Regular";
import { Urbanist_600SemiBold } from "@expo-google-fonts/urbanist/600SemiBold";
import { useFonts } from "@expo-google-fonts/urbanist/useFonts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

interface LecturerProfileData {
  name: string;
  full_name: string;
  email: string;
  employee_id_number: string | null;
  position: string;
  profile_image: string | null;
}

interface ClassScheduleItem {
  id_class: number;
  code_class: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  subject: {
    name_subject: string;
  };
}

interface LecturerClass {
  id_class: number;
  code_class: string;
  subject: {
    name_subject: string;
    sks: number;
  };
  student_count?: number;
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
  const isMounted = useRef(true);
  const { forceLogout } = useAuth();

  let [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<LecturerProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Dashboard data states
  const [todaySchedules, setTodaySchedules] = useState<ClassScheduleItem[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [classes, setClasses] = useState<LecturerClass[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const response = await api.get("/lecturer/profile");
      if (isMounted.current && response.data.status === "success") {
        setProfileData(response.data.data);
      }
    } catch (error: any) {
      console.error("Gagal memuat profil dosen:", error);

      // Auto logout jika Unauthenticated
      if (error.response?.status === 401 || error.response?.data?.message === "Unauthenticated.") {
        console.log("[INDEX] Token invalid/expired, auto force logout...");
        await forceLogout();
        return;
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingProfile(false);
      }
    }
  }, [forceLogout]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setIsLoadingDashboard(true);
    try {
      // Fetch schedules, notifications, and classes in parallel
      const [schedulesRes, notificationsRes, classesRes] = await Promise.all([api.get("/lecturer/schedules"), api.get("/notifications", { params: { limit: 3 } }), api.get("/lecturer/classes")]);

      // Filter today's schedules
      const today = new Date().getDay();
      const apiDayOfWeek = today === 0 ? 7 : today;
      const todaySchedule = (schedulesRes.data.data || []).filter((schedule: ClassScheduleItem) => schedule.day_of_week === apiDayOfWeek);
      setTodaySchedules(todaySchedule.slice(0, 2)); // Limit to 2

      // Get recent notifications
      if (notificationsRes.data.status === "success") {
        setRecentNotifications(notificationsRes.data.data.notifications.slice(0, 2));
        setUnreadCount(notificationsRes.data.data.unread_count);
      }

      // Get classes
      setClasses((classesRes.data.data || []).slice(0, 2)); // Limit to 2
    } catch (error: any) {
      console.error("Gagal memuat data dashboard:", error);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchDashboardData();
    }, [fetchProfile, fetchDashboardData])
  );

  const formatTime = (time: string) => {
    if (!time) return "";
    return time.substring(0, 5);
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

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#015023" />

      <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push("/ProfilDosen")} style={styles.profileSection}>
              {isLoadingProfile ? (
                <>
                  <View style={[styles.avatar, styles.avatarLoading]}>
                    <ActivityIndicator size="small" color="#015023" />
                  </View>
                  <View style={styles.profileInfo}>
                    <ThemedText style={styles.userName}>Loading...</ThemedText>
                    <ThemedText style={styles.userId}>...</ThemedText>
                  </View>
                </>
              ) : (
                <>
                  <Image source={profileData?.profile_image ? { uri: profileData.profile_image } : require("../../assets/images/kairi.png")} style={styles.avatar} defaultSource={require("../../assets/images/kairi.png")} />
                  <View style={styles.profileInfo}>
                    <ThemedText style={styles.userName} numberOfLines={1}>
                      {profileData?.full_name || profileData?.name || "Dosen"}
                    </ThemedText>
                    <ThemedText style={styles.userId} numberOfLines={1}>
                      {profileData?.employee_id_number || "NIP belum diisi"}
                    </ThemedText>
                  </View>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.iconsSection}>
              <TouchableOpacity onPress={() => router.push("/chat")} style={styles.iconButton}>
                <Ionicons name="chatbox-ellipses-outline" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/getNotification")}>
                <Ionicons name="notifications-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scroll Content */}
          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
            {isLoadingDashboard ? (
              <View style={styles.loadingDashboard}>
                <ActivityIndicator size="large" color="#DABC4E" />
                <ThemedText style={styles.loadingText}>Memuat data...</ThemedText>
              </View>
            ) : (
              <>
                {/* Today's Schedule Card */}
                <View style={styles.card}>
                  <TouchableOpacity style={styles.dashboardCard} onPress={() => router.push("/jadwal")} activeOpacity={0.7}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={styles.iconCircle}>
                          <Ionicons name="calendar" size={20} color="#015023" />
                        </View>
                        <ThemedText variant="bold" style={styles.cardTitle}>
                          Jadwal Hari Ini
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#015023" />
                    </View>

                    {todaySchedules.length > 0 ? (
                      <>
                        {todaySchedules.map((schedule, index) => (
                          <View key={schedule.id_class} style={[styles.scheduleItem, index > 0 && styles.scheduleItemBorder]}>
                            <View style={styles.scheduleTime}>
                              <Ionicons name="time-outline" size={16} color="#666" />
                              <ThemedText style={styles.timeText}>
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </ThemedText>
                            </View>
                            <ThemedText style={styles.scheduleSubject} numberOfLines={1}>
                              {schedule.subject.name_subject}
                            </ThemedText>
                            <View style={styles.scheduleInfo}>
                              <View style={styles.scheduleInfoItem}>
                                <Ionicons name="bookmark-outline" size={14} color="#8B7355" />
                                <ThemedText style={styles.scheduleInfoText}>{schedule.code_class}</ThemedText>
                              </View>
                              {schedule.room && (
                                <View style={styles.scheduleInfoItem}>
                                  <Ionicons name="location-outline" size={14} color="#8B7355" />
                                  <ThemedText style={styles.scheduleInfoText}>{schedule.room}</ThemedText>
                                </View>
                              )}
                            </View>
                          </View>
                        ))}
                        {todaySchedules.length > 2 && <ThemedText style={styles.moreText}>+{todaySchedules.length - 2} jadwal lainnya</ThemedText>}
                      </>
                    ) : (
                      <View style={styles.emptyCard}>
                        <Ionicons name="calendar-outline" size={32} color="#ccc" />
                        <ThemedText style={styles.emptyCardText}>Tidak ada jadwal hari ini</ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Notifications Card */}
                <View style={styles.card}>
                  <TouchableOpacity style={styles.dashboardCard} onPress={() => router.push("/getNotification")} activeOpacity={0.7}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                          <Ionicons name="notifications" size={20} color="#EF4444" />
                          {unreadCount > 0 && (
                            <View style={styles.notificationBadge}>
                              <ThemedText style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</ThemedText>
                            </View>
                          )}
                        </View>
                        <ThemedText variant="bold" style={styles.cardTitle}>
                          Notifikasi Terbaru
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#015023" />
                    </View>

                    {recentNotifications.length > 0 ? (
                      <>
                        {recentNotifications.map((notif, index) => (
                          <View key={notif.id_notification} style={[styles.notifItem, index > 0 && styles.scheduleItemBorder]}>
                            <View style={styles.notifHeader}>
                              <View style={styles.notifTypeIcon}>
                                <Ionicons name={notif.type === "chat" ? "chatbubble" : "megaphone"} size={14} color={notif.type === "chat" ? "#0EA5E9" : "#F59E0B"} />
                              </View>
                              <ThemedText style={styles.notifTitle} numberOfLines={1}>
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
                        {unreadCount > 3 && <ThemedText style={styles.moreText}>+{unreadCount - 3} notifikasi belum dibaca</ThemedText>}
                      </>
                    ) : (
                      <View style={styles.emptyCard}>
                        <Ionicons name="notifications-outline" size={32} color="#ccc" />
                        <ThemedText style={styles.emptyCardText}>Belum ada notifikasi</ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Classes Card */}
                <View style={styles.card}>
                  <TouchableOpacity style={styles.dashboardCard} onPress={() => router.push("/grades")} activeOpacity={0.7}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: "rgba(34, 197, 94, 0.1)" }]}>
                          <Ionicons name="school" size={20} color="#22C55E" />
                        </View>
                        <ThemedText variant="bold" style={styles.cardTitle}>
                          Kelas Saya
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#015023" />
                    </View>

                    {classes.length > 0 ? (
                      <>
                        {classes.map((classItem, index) => (
                          <View key={classItem.id_class} style={[styles.classItem, index > 0 && styles.scheduleItemBorder]}>
                            <View style={styles.classHeader}>
                              <View style={styles.classBadge}>
                                <ThemedText style={styles.classBadgeText}>{classItem.code_class}</ThemedText>
                              </View>
                              <View style={styles.sksChip}>
                                <ThemedText style={styles.sksChipText}>{classItem.subject.sks} SKS</ThemedText>
                              </View>
                            </View>
                            <ThemedText style={styles.classSubject} numberOfLines={1}>
                              {classItem.subject.name_subject}
                            </ThemedText>
                            {classItem.student_count && (
                              <View style={styles.classFooter}>
                                <Ionicons name="people-outline" size={14} color="#8B7355" />
                                <ThemedText style={styles.classStudentCount}>{classItem.student_count} Mahasiswa</ThemedText>
                              </View>
                            )}
                          </View>
                        ))}
                        {classes.length > 2 && <Text style={styles.moreText}>Lihat semua kelas</Text>}
                      </>
                    ) : (
                      <View style={styles.emptyCard}>
                        <Ionicons name="school-outline" size={32} color="#ccc" />
                        <ThemedText style={styles.emptyCardText}>Belum ada kelas</ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    marginBottom: 100,
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
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

  userName: {
    fontSize: 18,
    color: "white",
    fontFamily: "Urbanist_600SemiBold",
    fontWeight: "600",
    marginBottom: 2,
  },

  userId: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
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

  scrollContent: {
    flex: 1,
  },

  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
  },

  loadingDashboard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },

  loadingText: {
    color: "#F5EFD3",
    fontSize: 14,
    marginTop: 12,
  },

  card: {
    backgroundColor: "#F5EFD3",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000",
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  dashboardCard: {
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

  notificationBadge: {
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

  badgeText: {
    color: "#fff",
    fontSize: 10,
  },

  cardTitle: {
    fontSize: 16,
    color: "#015023",
  },

  // Schedule Item Styles
  scheduleItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },

  scheduleItemBorder: {
    marginTop: 8,
  },

  scheduleTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  timeText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },

  scheduleSubject: {
    fontSize: 15,
    color: "#015023",
    marginBottom: 6,
    fontWeight: "600",
  },

  scheduleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  scheduleInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  scheduleInfoText: {
    fontSize: 12,
    color: "#8B7355",
  },

  // Notification Item Styles
  notifItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
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
    fontWeight: "600",
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

  // Class Item Styles
  classItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },

  classHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  classBadge: {
    backgroundColor: "#D4A574",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  classBadgeText: {
    fontSize: 12,
    color: "#015023",
    fontWeight: "600",
  },

  sksChip: {
    backgroundColor: "rgba(1, 80, 35, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  sksChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#015023",
  },

  classSubject: {
    fontSize: 15,
    color: "#015023",
    marginBottom: 6,
    fontWeight: "600",
  },

  classFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  classStudentCount: {
    fontSize: 12,
    color: "#8B7355",
  },

  // Empty State
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

  moreText: {
    fontSize: 12,
    color: "#015023",
    textAlign: "center",
    marginTop: 12,
    fontWeight: "600",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
});
