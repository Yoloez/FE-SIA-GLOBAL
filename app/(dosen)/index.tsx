import ContentCard from "@/components/ContentCard";
import { Urbanist_400Regular } from "@expo-google-fonts/urbanist/400Regular";
import { Urbanist_600SemiBold } from "@expo-google-fonts/urbanist/600SemiBold";
import { useFonts } from "@expo-google-fonts/urbanist/useFonts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 5;
const CARD_WIDTH = (width - 70 - CARD_MARGIN * 3) / 4;

const DUMMY_CONTENT_DATA = [
  {
    id: "1",
    label: "Grades",
    title: "SVPL",
    contents: ["satu", "dua", "tiga", "GOKILLLL"],
    route: "/grades",
    icon: "ribbon",
    gradient: ["#FFD93D", "#FFA62E"],
  },
  {
    id: "2",
    label: "Schedule",
    title: "Dosen2",
    contents: ["satu", "dua", "tiga", "GOKILLLL"],
    route: "/jadwal",
    icon: "calendar",
    gradient: ["#6BCB77", "#4D96A9"],
  },
  {
    id: "3",
    label: "Tugas",
    title: "Pemrograman Mobile",
    contents: ["Buat UI Keren", "Implementasi API"],
    route: null,
    icon: "clipboard",
    gradient: ["#7FC8F8", "#5AA9E6"],
  },
  {
    id: "4",
    label: "News",
    title: "Perkuliahan",
    contents: ["Libur tanggal merah", "Jadwal ujian"],
    route: null,
    icon: "megaphone",
    gradient: ["#FF6B6B", "#EE5A6F"],
  },
  {
    id: "5",
    label: "Library",
    title: "Books",
    contents: ["Digital", "Physical"],
    route: null,
    icon: "library",
    gradient: ["#B08BBB", "#9B59B6"],
  },
  {
    id: "6",
    label: "Profile",
    title: "Account",
    contents: ["Settings", "Info"],
    route: null,
    icon: "person",
    gradient: ["#F8B500", "#F28900"],
  },
  {
    id: "7",
    label: "Events",
    title: "Campus",
    contents: ["Upcoming", "Past"],
    route: null,
    icon: "calendar-number",
    gradient: ["#00D9FF", "#0099CC"],
  },
  {
    id: "8",
    label: "More",
    title: "Options",
    contents: ["Settings"],
    route: null,
    icon: "apps",
    gradient: ["#A8E6CF", "#56AB91"],
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
  const { logout } = useAuth();
  let [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [allContent, setAllContent] = useState(DUMMY_CONTENT_DATA);
  const [filteredContent, setFilteredContent] = useState(DUMMY_CONTENT_DATA);
  const [isLoading, setIsLoading] = useState(false);

  const handleContentPress = (item: ContentItem) => {
    if (!item.route) return;

    try {
      router.push(item.route as any);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  useEffect(() => {
    if (searchQuery === "") {
      setFilteredContent(allContent);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filteredData = allContent.filter((item) => {
        return item.label.toLowerCase().includes(lowercasedQuery);
      });
      setFilteredContent(filteredData);
    }
  }, [searchQuery, allContent]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#015023" translucent={false} />

      <View style={styles.container}>
        <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
          <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
            {/* Header Section - Fixed */}
            <View style={styles.header}>
              <View style={styles.profileSection}>
                <Image source={require("../../assets/images/react-logo.png")} style={styles.avatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>Dosen 1</Text>
                  <Text style={styles.userId}>8888</Text>
                </View>
              </View>

              <TouchableOpacity onPress={logout} style={{ marginRight: 10 }}>
                <View>
                  <Ionicons name="log-out-outline" size={24} color="white" />
                </View>
              </TouchableOpacity>

              <Link href="../(chat)/index" asChild>
                <TouchableOpacity style={styles.iconsSection} activeOpacity={0.7}>
                  <Ionicons name="chatbox-ellipses-outline" size={24} color="white" style={styles.iconSpacing} />
                  <Ionicons name="notifications-outline" size={24} color="white" />
                </TouchableOpacity>
              </Link>
            </View>

            {/* Main Content - Scrollable */}
            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false} bounces={true}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#015023" style={styles.searchIcon} />
                <TextInput placeholder="Search menu..." style={styles.searchInput} placeholderTextColor="#6B7280" value={searchQuery} onChangeText={setSearchQuery} />
              </View>

              {/* Grid Content */}
              {isLoading ? (
                <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 30 }} />
              ) : filteredContent.length > 0 ? (
                <View style={styles.gridContainer}>
                  {filteredContent.map((item) => (
                    <TouchableOpacity key={item.id} onPress={() => handleContentPress(item)} disabled={!item.route} activeOpacity={0.7} style={styles.iconCard}>
                      <LinearGradient colors={["#F5EFD3", "white"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconGradient}>
                        <Ionicons name={item.icon as any} size={28} color="black" />
                      </LinearGradient>
                      <Text style={styles.iconLabel} numberOfLines={1}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <ContentCard label="Grades" title="SVPL" contents={["satu", "dua", "tiga", "GOKILLLL"]} />
                </View>
              ) : (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                  <Text style={styles.noResultsText}>No results found</Text>
                  <Text style={styles.noResultsSubtext}>Try a different search term</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </View>
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
    paddingLeft: 16,
  },
  iconSpacing: {
    marginRight: 16,
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
    paddingTop: 24,
    paddingBottom: 30,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    fontFamily: "Urbanist_400Regular",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  iconCard: {
    width: CARD_WIDTH,
    alignItems: "center",
    marginBottom: 24,
  },
  iconGradient: {
    borderColor: "black",
    borderWidth: 1,
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 8,
  },
  iconLabel: {
    fontSize: 11,
    color: "white",
    fontFamily: "Urbanist_600SemiBold",
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noResultsText: {
    textAlign: "center",
    marginTop: 16,
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist_600SemiBold",
    fontWeight: "600",
  },
  noResultsSubtext: {
    textAlign: "center",
    marginTop: 8,
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontFamily: "Urbanist_400Regular",
  },
});
