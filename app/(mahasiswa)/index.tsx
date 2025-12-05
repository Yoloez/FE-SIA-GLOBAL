import { ThemedText } from "@/components/ThemedText";
import { Urbanist_400Regular } from "@expo-google-fonts/urbanist/400Regular";
import { Urbanist_600SemiBold } from "@expo-google-fonts/urbanist/600SemiBold";
import { useFonts } from "@expo-google-fonts/urbanist/useFonts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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

  const fetchStudentIdentity = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const response = await api.get("/student/profile/identity");
      if (isMounted.current) {
        setStudentIdentity(response.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat identitas mahasiswa:", error);
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
    } catch (error) {
      console.error("Gagal memuat data nilai:", error);
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
    } catch (error) {
      console.error("Gagal memuat jumlah notifikasi:", error);
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
            label: "Your Schedule Today",
            title: `${todaySchedules.length} Class${todaySchedules.length > 1 ? "es" : ""} Today`,
            contents: scheduleContents,
            route: "/jadwal",
          };

          setAllContent([contentItem]);
          setFilteredContent([contentItem]);
        } else {
          const contentItem: ContentItem = {
            id: "schedule-empty",
            label: "Your Schedule",
            title: "No Classes Today",
            contents: ["Tap to view full schedule"],
            route: "/jadwal",
          };

          setAllContent([contentItem]);
          setFilteredContent([contentItem]);
        }
      }
    } catch (error) {
      console.error("Gagal memuat jadwal:", error);
      // Set empty content on error
      const contentItem: ContentItem = {
        id: "schedule-error",
        label: "Your Schedule",
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
    }, [fetchStudentIdentity, fetchGrades, fetchSchedules, fetchUnreadCount])
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
});
