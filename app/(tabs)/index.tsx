import { Urbanist_400Regular } from "@expo-google-fonts/urbanist/400Regular";
import { Urbanist_600SemiBold } from "@expo-google-fonts/urbanist/600SemiBold";
import { useFonts } from "@expo-google-fonts/urbanist/useFonts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ContentCard from "../../components/ContentCard";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

const DUMMY_CONTENT_DATA = [
  {
    id: "1",
    label: "Notification",
    title: "SVPL",
    contents: ["satu", "dua", "tiga", "GOKILLLL"],
    route: null,
  },
  {
    id: "2",
    label: "Your Schedule",
    title: "HANDOKO",
    contents: ["satu", "dua", "tiga", "GOKILLLL"],
    route: "/jadwal",
  },
  {
    id: "3",
    label: "Tugas",
    title: "Pemrograman Mobile",
    contents: ["Buat UI Keren", "Implementasi API"],
    route: null,
  },
  {
    id: "4",
    label: "Pengumuman",
    title: "Perkuliahan",
    contents: ["Libur tanggal merah", "Jadwal ujian"],
    route: null,
  },
];

interface ContentItem {
  id: string;
  label: string;
  title: string;
  contents: string[];
  route: string | null;
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const isMounted = useRef(true);

  let [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [allContent, setAllContent] = useState<ContentItem[]>(DUMMY_CONTENT_DATA);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>(DUMMY_CONTENT_DATA);
  const [isLoading, setIsLoading] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Filter logic setiap kali searchQuery berubah
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

  // Handler untuk navigasi ke chat
  const handleChatPress = () => {
    try {
      // Coba beberapa kemungkinan route
      router.push("../chat"); // Jika folder di app/(chat)/index.tsx
      // atau router.push("/chat"); // Jika folder di app/chat/index.tsx
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback
      try {
        router.replace("../chat");
      } catch (fallbackError) {
        console.error("Fallback navigation error:", fallbackError);
      }
    }
  };

  // Handler untuk navigasi ke notifications (opsional)
  const handleNotificationPress = () => {
    console.log("Notification pressed");
    // Implementasi navigasi ke halaman notifikasi jika ada
  };

  // Handler untuk item content
  const handleContentPress = (item: ContentItem) => {
    if (!item.route) return;

    try {
      router.push(item.route as any);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  // Get user display name
  const displayName = user?.name || "User";
  const displayId = user?.email || "ID not available";

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#015023" translucent={false} />

      <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
          {/* Header Section - Fixed */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <Image source={require("../../assets/images/kairi.png")} style={styles.avatar} />
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.userId} numberOfLines={1}>
                  {displayId}
                </Text>
              </View>
            </View>

            <View style={styles.iconsSection}>
              <TouchableOpacity onPress={handleChatPress} style={styles.iconButton} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chatbox-ellipses-outline" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleNotificationPress} style={styles.iconButton} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="notifications-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Content - Scrollable */}
          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false} bounces={true}>
            {/* Achievement Cards */}
            <View style={styles.achievementContainer}>
              <View style={styles.achievementCard}>
                <Text style={styles.achievementLabel}>Achievement</Text>
                <Text style={styles.achievementValue}>38 SKS</Text>
              </View>

              <View style={styles.achievementCard}>
                <Text style={styles.achievementLabel}>IPK</Text>
                <Text style={styles.achievementValue}>3.89</Text>
              </View>

              <View style={styles.achievementCard}>
                <Text style={styles.achievementLabel}>IPS</Text>
                <Text style={styles.achievementValue}>3.90</Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput placeholder="Search by title or label..." style={styles.searchInput} placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
              <Ionicons name="search-outline" size={20} color="#666" />
            </View>

            {/* Content Sections */}
            {isLoading ? (
              <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
            ) : filteredContent.length > 0 ? (
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
    marginBottom: 100,
  },
  header: {
    // backgroundColor: "#015023",
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
});
