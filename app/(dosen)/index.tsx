import { Urbanist_400Regular } from "@expo-google-fonts/urbanist/400Regular";
import { Urbanist_600SemiBold } from "@expo-google-fonts/urbanist/600SemiBold";
import { useFonts } from "@expo-google-fonts/urbanist/useFonts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ContentCard from "../../components/ContentCard";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

const CONTENT_DATA = [
  {
    id: "1",
    label: "Grades",
    title: "TRPL",
    
    route: "/grades",
  },
  {
    id: "2",
    label: "Schedule",
    title: "JADWAL",
   
    route: "/jadwal",
  },
  {
    id: "3",
    label: "Tugas",
    title: "Pemrograman Mobile",
    contents: ["Buat UI", "Implementasi API"],
    route: null,
  },
];

export default function HomeScreen() {
  const { logout } = useAuth();
  let [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filtered, setFiltered] = useState(CONTENT_DATA);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFiltered(CONTENT_DATA);
    } else {
      const q = searchQuery.toLowerCase();
      setFiltered(
        CONTENT_DATA.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.title.toLowerCase().includes(q)
        )
      );
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
            <View style={styles.profileSection}>
              <Image
                source={require("../../assets/images/react-logo.png")}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.userName}>Dosen 1</Text>
                <Text style={styles.userId}>8888</Text>
              </View>
            </View>

            <View style={styles.iconsSection}>
              <TouchableOpacity
                onPress={() => router.push("/(dosen)/ListChat")}
                style={styles.iconButton}
              >
                <Ionicons name="chatbox-ellipses-outline" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity onPress={logout} style={styles.iconButton}>
                <Ionicons name="log-out-outline" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scroll Content */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Search */}
            <View style={styles.searchContainer}>
              <TextInput
                placeholder="Search by title or label..."
                placeholderTextColor="#666"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Ionicons name="search-outline" size={18} color="#666" />
            </View>

            {/* List Content */}
            {isLoading ? (
              <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
            ) : filtered.length > 0 ? (
              filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handlePress(item)}
                  disabled={!item.route}
                >
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
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
    marginRight: 12,
  },

  userName: {
    fontSize: 18,
    color: "white",
    fontFamily: "Urbanist_600SemiBold",
  },

  userId: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
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
