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

interface LecturerProfileData {
  name: string;
  full_name: string;
  email: string;
  employee_id_number: string | null;
  position: string;
  profile_image: string | null;
}

const CONTENT_DATA = [
  {
    id: "1",
    label: "Notification",
    title: "Pemrograman Mobile",
    contents: ["Buat UI", "Implementasi API"],
    route: "/(dosen)/notification",
  },
  {
    id: "2",
    label: "Grades",
    title: "TRPL",

    route: "/grades",
  },
  {
    id: "3",
    label: "Schedule",
    title: "JADWAL",

    route: "/jadwal",
  },
];

export default function HomeScreen() {
  const isMounted = useRef(true);
  const { forceLogout } = useAuth();

  let [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filtered, setFiltered] = useState(CONTENT_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<LecturerProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFiltered(CONTENT_DATA);
    } else {
      const q = searchQuery.toLowerCase();
      setFiltered(CONTENT_DATA.filter((item) => item.label.toLowerCase().includes(q) || item.title.toLowerCase().includes(q)));
    }
  }, [searchQuery]);

  const handlePress = (item: any) => {
    if (!item.route) return;
    router.push(item.route);
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
                    <Text style={styles.userName}>Loading...</Text>
                    <Text style={styles.userId}>...</Text>
                  </View>
                </>
              ) : (
                <>
                  <Image source={profileData?.profile_image ? { uri: profileData.profile_image } : require("../../assets/images/kairi.png")} style={styles.avatar} defaultSource={require("../../assets/images/kairi.png")} />
                  <View style={styles.profileInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {profileData?.full_name || profileData?.name || "Dosen"}
                    </Text>
                    <Text style={styles.userId} numberOfLines={1}>
                      {profileData?.employee_id_number || "NIP belum diisi"}
                    </Text>
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
            {/* Search */}
            <View style={styles.searchContainer}>
              <TextInput placeholder="Search by title or label..." placeholderTextColor="#666" style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
              <Ionicons name="search-outline" size={18} color="#666" />
            </View>

            {/* List Content */}
            {isLoading ? (
              <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
            ) : filtered.length > 0 ? (
              filtered.map((item) => (
                <TouchableOpacity key={item.id} onPress={() => handlePress(item)} disabled={!item.route}>
                  <ContentCard label={item.label} title={item.title} contents={item.contents} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.5)" />
                <Text style={styles.noResultsText}>No results found</Text>
              </View>
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

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5EFD3",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 25,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },

  noResultsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  noResultsText: {
    marginTop: 10,
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
  },
});
