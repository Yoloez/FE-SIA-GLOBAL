import { ThemedText } from "@/components/ThemedText";
import { Urbanist_400Regular } from "@expo-google-fonts/urbanist/400Regular";
import { Urbanist_600SemiBold } from "@expo-google-fonts/urbanist/600SemiBold";
import { useFonts } from "@expo-google-fonts/urbanist/useFonts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, ImageBackground, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ContentCard from "../../components/ContentCard";
import { useAuth } from "../../context/AuthContext";
import { useStudentData } from "../../context/StudentDataContext";

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

export default function HomeScreen() {
  const { user } = useAuth();
  const { studentIdentity, academicStats, schedules, unreadCount, attendanceClasses, notifications, isLoadingProfile, isLoadingGrades, isLoadingSchedules, isLoadingAttendance, isLoadingNotifications } = useStudentData();

  let [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);

  // New state for filtered notifications and attendance
  const [filteredNotifications, setFilteredNotifications] = useState(notifications);
  const [filteredAttendance, setFilteredAttendance] = useState(attendanceClasses);

  // Generate content from schedules
  useEffect(() => {
    if (schedules.length === 0 && !isLoadingSchedules) {
      const contentItem: ContentItem = {
        id: "schedule-empty",
        label: "Jadwal Anda",
        title: "No Classes Today",
        contents: ["Tap to view full schedule"],
        route: "/jadwal",
      };
      setAllContent([contentItem]);
      setFilteredContent([contentItem]);
      return;
    }

    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const todaySchedules = schedules.filter((schedule) => schedule.day_of_week === dayOfWeek);

    if (todaySchedules.length > 0) {
      const scheduleContents = todaySchedules.map((schedule) => {
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
  }, [schedules, isLoadingSchedules]);

  // Enhanced search effect for all content types
  useEffect(() => {
    if (searchQuery === "") {
      setFilteredContent(allContent);
      setFilteredNotifications(notifications);
      setFilteredAttendance(attendanceClasses);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();

      // Filter schedule content
      const filteredSchedule = allContent.filter((item) => {
        return item.title.toLowerCase().includes(lowercasedQuery) || item.label.toLowerCase().includes(lowercasedQuery) || item.contents.some((content) => content.toLowerCase().includes(lowercasedQuery));
      });
      setFilteredContent(filteredSchedule);

      // Filter notifications
      const filteredNotifs = notifications.filter((notif) => {
        return notif.title.toLowerCase().includes(lowercasedQuery) || notif.message.toLowerCase().includes(lowercasedQuery) || notif.type.toLowerCase().includes(lowercasedQuery);
      });
      setFilteredNotifications(filteredNotifs);

      // Filter attendance classes
      const filteredAttend = attendanceClasses.filter((classItem) => {
        return classItem.nama_matkul.toLowerCase().includes(lowercasedQuery) || classItem.dosen.toLowerCase().includes(lowercasedQuery) || classItem.kelas.toLowerCase().includes(lowercasedQuery);
      });
      setFilteredAttendance(filteredAttend);
    }
  }, [searchQuery, allContent, notifications, attendanceClasses]);

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
      pathname: "/(mahasiswa)/kehadiran/attendance-detail",
      params: { id_class: classId },
    } as any);
  };

  const formatTimeAgo = (sent_at: string): string => {
    const now = new Date();
    const sentDate = new Date(sent_at);
    const diffMs = now.getTime() - sentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return sentDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  const getPercentageColor = (percentage: number): string => {
    if (percentage >= 80) return "#10B981"; // Green
    if (percentage >= 60) return "#F59E0B"; // Yellow
    return "#EF4444"; // Red
  };

  const displayName = studentIdentity?.full_name || studentIdentity?.name || "Student Name";
  const displayId = studentIdentity?.email || "NIM";

  const renderProfileImage = () => {
    if (isLoadingProfile) {
      return (
        <View style={[styles.avatar, styles.avatarLoading]}>
          <ActivityIndicator size="small" color="#015023" />
        </View>
      );
    }

    if (studentIdentity?.profile_image) {
      return (
        <Image
          source={{ uri: studentIdentity.profile_image }}
          style={styles.avatar}
          onError={() => {
            console.log("[Profile Image] Failed to load image, using default");
          }}
        />
      );
    }

    return <Image source={require("../../assets/images/unnamed.jpg")} style={styles.avatar} />;
  };

  // Check if there are any search results
  const hasSearchResults = filteredContent.length > 0 || filteredNotifications.length > 0 || filteredAttendance.length > 0;

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
                <ThemedText style={styles.userId} numberOfLines={1}>
                  {displayId}
                </ThemedText>
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
            <TouchableOpacity onPress={() => router.push("/(mahasiswa)/kehadiran/" as any)} activeOpacity={0.7}>
              <View style={styles.achievementContainer}>
                <View style={styles.achievementCard}>
                  <ThemedText variant="semibold" style={styles.achievementLabel}>
                    Total SKS
                  </ThemedText>
                  {isLoadingGrades ? (
                    <ActivityIndicator size="small" color="#015023" />
                  ) : (
                    <ThemedText variant="bold" style={styles.achievementValue}>
                      {academicStats?.totalSks || 0}
                    </ThemedText>
                  )}
                </View>

                <View style={styles.achievementCard}>
                  <ThemedText variant="semibold" style={styles.achievementLabel}>
                    IPK
                  </ThemedText>
                  {isLoadingGrades ? (
                    <ActivityIndicator size="small" color="#015023" />
                  ) : (
                    <ThemedText variant="bold" style={styles.achievementValue}>
                      {academicStats?.ipk || "0.00"}
                    </ThemedText>
                  )}
                </View>

                <View style={styles.achievementCard}>
                  <ThemedText variant="semibold" style={styles.achievementLabel}>
                    IPS
                  </ThemedText>
                  {isLoadingGrades ? (
                    <ActivityIndicator size="small" color="#015023" />
                  ) : (
                    <ThemedText variant="bold" style={styles.achievementValue}>
                      {academicStats?.currentIps || "0.00"}
                    </ThemedText>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.searchContainer}>
              <TextInput placeholder="Cari jadwal, notifikasi, atau kehadiran..." style={styles.searchInput} placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              ) : (
                <Ionicons name="search-outline" size={20} color="#666" />
              )}
            </View>

            {/* Show message when searching but no results */}
            {searchQuery && !hasSearchResults && (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.5)" />
                <Text style={styles.noResultsText}>Tidak ada hasil untuk "{searchQuery}"</Text>
              </View>
            )}

            {/* Notifications Section - Show only if there are results or no search */}
            {(!searchQuery || filteredNotifications.length > 0) && (
              <>
                <ThemedText variant="bold" style={styles.cardTitle}>
                  Notifikasi Terbaru {searchQuery && `(${filteredNotifications.length})`}
                </ThemedText>
                <ImageBackground source={require("../../assets/images/batik.png")} style={styles.dashboardCard} imageStyle={styles.cardImage} resizeMode="cover">
                  <TouchableOpacity style={styles.cardContent} onPress={handleNotificationPress} activeOpacity={0.7}>
                    {isLoadingNotifications ? (
                      <View style={styles.loadingCard}>
                        <ActivityIndicator size="small" color="#015023" />
                      </View>
                    ) : filteredNotifications.length > 0 ? (
                      <>
                        {filteredNotifications.slice(0, 2).map((notif, index) => (
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
                        <ThemedText style={styles.emptyCardText}>{searchQuery ? "Tidak ada notifikasi yang cocok" : "Belum ada notifikasi"}</ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                </ImageBackground>
              </>
            )}

            {/* Attendance Classes Section - Show only if there are results or no search */}
            {(!searchQuery || filteredAttendance.length > 0) && (
              <>
                <ThemedText variant="bold" style={styles.cardTitle}>
                  Kehadiran Kelas {searchQuery && `(${filteredAttendance.length})`}
                </ThemedText>

                <ImageBackground source={require("../../assets/images/batik.png")} style={styles.dashboardCard} imageStyle={styles.cardImage} resizeMode="cover">
                  <TouchableOpacity style={styles.cardContent} onPress={() => router.push("/(mahasiswa)/kehadiran/" as any)} activeOpacity={0.7}>
                    {isLoadingAttendance ? (
                      <View style={styles.loadingCard}>
                        <ActivityIndicator size="small" color="#015023" />
                      </View>
                    ) : filteredAttendance.length > 0 ? (
                      <>
                        {filteredAttendance.slice(0, 2).map((classItem, index) => {
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
                        <ThemedText style={styles.emptyCardText}>{searchQuery ? "Tidak ada kelas yang cocok" : "Belum ada data kehadiran"}</ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                </ImageBackground>
              </>
            )}

            {/* Schedule Section - Show only if there are results or no search */}
            {(!searchQuery || filteredContent.length > 0) && filteredContent.length > 0 && (
              <>
                {searchQuery && (
                  <ThemedText variant="bold" style={styles.cardTitle}>
                    Jadwal ({filteredContent.length})
                  </ThemedText>
                )}
                {filteredContent.map((item) => (
                  <TouchableOpacity key={item.id} onPress={() => handleContentPress(item)} disabled={!item.route} activeOpacity={item.route ? 0.7 : 1}>
                    <ContentCard label={item.label} title={item.title} contents={item.contents} />
                  </TouchableOpacity>
                ))}
              </>
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
    marginBottom: 85,
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
    color: "white",
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
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
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  achievementValue: {
    fontSize: 18,
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
    textAlign: "center",
  },
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
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  emptyCardText: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 8,
  },
  attendanceItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
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
});
