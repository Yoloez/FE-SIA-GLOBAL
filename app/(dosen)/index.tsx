import { Urbanist_400Regular } from "@expo-google-fonts/urbanist/400Regular";
import { Urbanist_600SemiBold } from "@expo-google-fonts/urbanist/600SemiBold";
import { useFonts } from "@expo-google-fonts/urbanist/useFonts";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react"; // <-- 1. Impor useState & useEffect
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ContentCard from "../../components/ContentCard";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");
const Ip = "192.168.0.159";
const API_URL = `http://${Ip}:8000/api/cek`;

// <-- 2. Pindahkan data ke dalam sebuah array terstruktur
const DUMMY_CONTENT_DATA = [
  {
    id: "1",
    label: "Notification",
    title: "SVPL",
    contents: ["satu", "dua", "tiga", "GOKILLLL"],
    route: null, // Tidak bisa diklik
  },
  {
    id: "2",
    label: "Your Schedule",
    title: "HANDOKO",
    contents: ["satu", "dua", "tiga", "GOKILLLL"],
    route: "../Schedule", // Rute navigasi
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

export default function HomeScreen() {
  const { logout } = useAuth();
  let [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
  });

  // <-- 3. Buat state untuk input pencarian dan data konten
  const [searchQuery, setSearchQuery] = useState("");
  const [allContent, setAllContent] = useState(DUMMY_CONTENT_DATA);
  const [filteredContent, setFilteredContent] = useState(DUMMY_CONTENT_DATA);
  const [isLoading, setIsLoading] = useState(true);

  // <-- 4. Terapkan logika filtering setiap kali searchQuery berubah
  useEffect(() => {
    if (searchQuery === "") {
      setFilteredContent(allContent);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filteredData = allContent.filter((item) => {
        // Cari di judul atau label, case-insensitive
        return item.title.toLowerCase().includes(lowercasedQuery) || item.label.toLowerCase().includes(lowercasedQuery);
      });
      setFilteredContent(filteredData);
    }
  }, [searchQuery, allContent]); // Efek ini berjalan jika searchQuery atau allContent berubah

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true); // Mulai loading
        const response = await axios.get(API_URL);
        const apiData = response.data; // Data dari Laravel: { message: "...", ... }

        // Format data API agar sesuai dengan struktur ContentCard
        const apiContentCard = {
          id: "api-1",
          label: "Info from Server",
          title: apiData.title,
          contents: [apiData.message], // Masukkan pesan dari API ke dalam array contents
          route: null,
        };

        // Gabungkan data dari API dengan data dummy
        const combinedData = [apiContentCard, ...DUMMY_CONTENT_DATA];

        setAllContent(combinedData);
        setFilteredContent(combinedData);
      } catch (error) {
        console.error("Gagal mengambil data dari server:", error);
        Alert.alert("Koneksi Gagal", "Tidak dapat mengambil data dari server. Menampilkan data offline.");
        // Jika gagal, tampilkan saja data dummy
        setAllContent(DUMMY_CONTENT_DATA);
        setFilteredContent(DUMMY_CONTENT_DATA);
      } finally {
        setIsLoading(false); // Hentikan loading, baik berhasil maupun gagal
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#015023" translucent={false} />

      <LinearGradient colors={["#015023", "#015023"]} style={styles.container}>
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

            <Link href="/chat" asChild>
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
              {/* <-- 5. Hubungkan TextInput ke state */}
              <TextInput
                placeholder="Search by title or label..."
                style={styles.searchInput}
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery} // Langsung update state saat mengetik
              />
              <Ionicons name="search-outline" size={20} color="#666" />
            </View>
            {/* Content Sections */}
            {/* <-- 6. Render konten dari state hasil filter */}
            {isLoading ? (
              <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 30 }} />
            ) : filteredContent.length > 0 ? (
              filteredContent.map((item) => (
                <TouchableOpacity key={item.id} onPress={() => item.route && router.push(item.route)} disabled={!item.route}>
                  <ContentCard label={item.label} title={item.title} contents={item.contents} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

// <-- Tambahkan style baru untuk pesan "No Results"
const styles = StyleSheet.create({
  // ... (semua style Anda yang lama biarkan di sini)
  noResultsText: {
    textAlign: "center",
    marginTop: 20,
    color: "white",
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
    marginBottom: 100,
  },
  header: {
    backgroundColor: "#015023",
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // borderBottomWidth: 1,
    // borderBottomColor: "rgba(255, 255, 255, 0.1)",
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
    // fontFamily: "Urbanist_400Regular",
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
    paddingTop: 20,
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
  contentCard: {
    backgroundColor: "#F5EFD3",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contentText: {
    fontFamily: "Urbanist_400Regular",
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 4,
  },
});
