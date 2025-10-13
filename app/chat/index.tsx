import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, SectionList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

// --- KONFIGURASI API ---
const IP_ADDRESS = "192.168.0.159"; // Ganti dengan IP laptop Anda
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

// Definisikan tipe data untuk objek Pengguna
interface User {
  id: number;
  name: string;
  username: string; // Diasumsikan username ada untuk ditampilkan
  email: string; // Digunakan untuk avatar dummy
}

export default function ChatListScreen() {
  const { token, user } = useAuth();
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk mengambil daftar kontak dari API
  const fetchContacts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { lecturers, classmates } = response.data.data;

      // Format data agar sesuai dengan yang dibutuhkan SectionList
      const newSections = [];
      if (lecturers && lecturers.length > 0) {
        newSections.push({ title: "Lecturer", data: lecturers });
      }
      if (classmates && classmates.length > 0) {
        newSections.push({ title: "Classmates", data: classmates });
      }
      setSections(newSections);
    } catch (error) {
      console.error("Gagal memuat kontak:", error.response?.data);
      alert("Gagal memuat daftar kontak.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, [fetchContacts])
  );

  // Fungsi untuk memulai percakapan privat
  const handleStartPrivateChat = async (recipientId: number) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/conversations/private`, { recipient_id: recipientId }, { headers: { Authorization: `Bearer ${token}` } });
      const conversation = response.data.data;
      router.push(`/chat/${conversation.id_conversation}`);
    } catch (error) {
      // --- INI BAGIAN PERBAIKANNYA: Penanganan Error yang Lebih Detail ---
      console.error("================ GAGAL MEMULAI CHAT PRIVAT ================");
      let alertMessage = "Terjadi kesalahan yang tidak diketahui.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server merespons dengan status error (4xx atau 5xx)
          console.error("Status Kode:", error.response.status);
          console.error("Pesan dari Server:", JSON.stringify(error.response.data, null, 2));
          alertMessage = `Gagal memulai percakapan. Server merespons dengan error ${error.response.status}. Cek terminal untuk detail.`;
        } else if (error.request) {
          // Request terkirim tapi tidak ada respons
          console.error("Tidak ada respons dari server.");
          alertMessage = "Tidak dapat terhubung ke server.";
        } else {
          // Error lain
          console.error("Error Axios:", error.message);
          alertMessage = "Terjadi masalah saat menyiapkan permintaan.";
        }
      } else {
        // Error JavaScript biasa
        console.error("Error tidak terduga:", error);
      }
      console.error("========================================================");
      Alert.alert("Error", alertMessage);
      // -----------------------------------------------------------------
    }
  };

  // Komponen untuk merender setiap item kontak
  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.contactCard}>
      <Image
        // Gunakan layanan avatar dummy untuk visual yang menarik
        source={{ uri: `https://i.pravatar.cc/150?u=${item.email}` }}
        style={styles.avatar}
      />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactId}>{item.username}</Text>
      </View>
      <TouchableOpacity onPress={() => handleStartPrivateChat(item.id)}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#333" />
      </TouchableOpacity>
    </View>
  );

  // Komponen untuk merender header setiap seksi ("Lecturer", "Classmates")
  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Chat List" }} />
      {isLoading ? (
        <ActivityIndicator size="large" color="#FACC15" style={{ flex: 1 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Anda belum memiliki kontak di kelas manapun.</Text>
            </View>
          }
          contentContainerStyle={styles.container}
        />
      )}
    </SafeAreaView>
  );
}

// Stylesheet yang dirancang agar mirip dengan desain Anda
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#015023" },
  container: { paddingHorizontal: 15, paddingBottom: 20 },
  sectionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    backgroundColor: "#FACC15",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 2,
  },
  contactCard: {
    backgroundColor: "#FEFBEA",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  contactInfo: {
    flex: 1,
    marginLeft: 15,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  contactId: {
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: "40%",
  },
  emptyText: {
    textAlign: "center",
    color: "#ccc",
    marginTop: 20,
    fontSize: 16,
  },
});
