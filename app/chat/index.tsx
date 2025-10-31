import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, SectionList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

// Definisikan tipe data untuk objek Pengguna
interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}

// Tipe untuk section
interface Section {
  title: string;
  data: User[];
}

export default function ChatListScreen() {
  // Ambil SEMUA state dari AuthContext
  const { token, user, isLoading: isAuthLoading } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  React.useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fungsi untuk mengambil daftar kontak dari API
  const fetchContacts = useCallback(async () => {
    console.log("========================================");
    console.log("[DEBUG] Memulai fetchContacts...");
    console.log("[DEBUG] Status AuthContext isLoading:", isAuthLoading);
    console.log("[DEBUG] Nilai token:", token ? `DITEMUKAN (panjang: ${token.length})` : "NULL atau UNDEFINED");
    console.log("========================================");

    // Jangan lakukan apa-apa jika AuthContext masih loading atau jika token belum ada
    if (isAuthLoading || !token) {
      if (isMounted.current) {
        setIsLoading(false);
      }
      return;
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    if (isMounted.current) {
      setIsLoading(true);
    }

    try {
      const response = await api.get("/chat/contacts", {
        signal: abortControllerRef.current.signal,
      });
      if (!isMounted.current) return;
      const { lecturers, classmates } = response.data.data;
      const newSections: Section[] = [];
      if (lecturers && lecturers.length > 0) {
        newSections.push({ title: "Dosen Pengajar", data: lecturers });
      }
      if (classmates && classmates.length > 0) {
        newSections.push({ title: "Teman Sekelas", data: classmates });
      }

      setSections(newSections);
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === "AbortError" || error.name === "CanceledError") {
        console.log("Request was cancelled");
        return;
      }

      if (!isMounted.current) return;

      console.error("================ GAGAL MEMUAT KONTAK ================");
      let alertMessage = "Terjadi kesalahan yang tidak diketahui.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Status Kode:", error.response.status);
          console.error("Pesan dari Server:", JSON.stringify(error.response.data, null, 2));
          alertMessage = `Gagal memuat kontak. Server merespons dengan error ${error.response.status}.`;
        } else if (error.request) {
          console.error("Tidak ada respons dari server.");
          alertMessage = "Tidak dapat terhubung ke server. Pastikan server berjalan.";
        } else {
          console.error("Error Axios:", error.message);
          alertMessage = "Terjadi masalah saat menyiapkan permintaan.";
        }
      } else {
        console.error("Error tidak terduga:", error);
      }
      console.error("====================================================");

      Alert.alert("Error", alertMessage);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [token, isAuthLoading]);

  useFocusEffect(
    useCallback(() => {
      fetchContacts();

      // Cleanup when screen loses focus
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, [fetchContacts])
  );

  // Fungsi untuk memulai percakapan privat
  const handleStartPrivateChat = useCallback(
    async (recipientId: number) => {
      if (!token || !isMounted.current) return;

      try {
        const response = await api.post("/chat/conversations/private", { recipient_id: recipientId });
        if (!isMounted.current) return;
        const conversation = response.data.data;

        // Tambahkan try-catch untuk navigation
        try {
          router.push(`/(chat)/${conversation.id_conversation}`);
        } catch (navError) {
          console.error("Navigation error:", navError);
          // Fallback navigation
          router.replace(`/(chat)/${conversation.id_conversation}`);
        }
      } catch (error: any) {
        if (!isMounted.current) return;
        console.error("================ GAGAL MEMULAI CHAT PRIVAT ================");
        let alertMessage = "Terjadi kesalahan yang tidak diketahui.";

        if (axios.isAxiosError(error)) {
          if (error.response) {
            console.error("Status Kode:", error.response.status);
            console.error("Pesan dari Server:", JSON.stringify(error.response.data, null, 2));
            alertMessage = `Gagal memulai percakapan. Server merespons dengan error ${error.response.status}.`;
          } else if (error.request) {
            console.error("Tidak ada respons dari server.");
            alertMessage = "Tidak dapat terhubung ke server. Pastikan server berjalan.";
          } else {
            console.error("Error Axios:", error.message);
            alertMessage = "Terjadi masalah saat menyiapkan permintaan.";
          }
        } else {
          console.error("Error tidak terduga:", error);
        }
        console.error("========================================================");

        Alert.alert("Error", alertMessage);
      }
    },
    [token]
  );

  const renderItem = useCallback(
    ({ item }: { item: User }) => {
      // Safe email untuk avatar
      const avatarEmail = item.email || `user${item.id}@default.com`;

      return (
        <View style={styles.contactCard}>
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=${avatarEmail}` }}
            style={styles.avatar}
            onError={(error) => {
              console.log("Avatar load error:", error.nativeEvent.error);
            }}
          />
          <View style={styles.contactInfo}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.contactId} numberOfLines={1}>
              @{item.username}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleStartPrivateChat(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#015023" />
          </TouchableOpacity>
        </View>
      );
    },
    [handleStartPrivateChat]
  );

  // Komponen untuk merender header setiap seksi
  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    ),
    []
  );

  // Loading state
  if (isLoading || isAuthLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen
          options={{
            title: "Daftar Chat",
            headerStyle: { backgroundColor: "#015023" },
            headerTintColor: "#fff",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FACC15" />
          <Text style={styles.loadingText}>Memuat kontak...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Daftar Chat",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Anda belum memiliki kontak di kelas manapun.</Text>
          </View>
        }
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#015023",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#fff",
  },
  container: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    flexGrow: 1,
  },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contactCard: {
    backgroundColor: "#FEFBEA",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#015023",
    backgroundColor: "#f0f8f4",
  },
  contactInfo: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
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
    color: "#fff",
    marginTop: 20,
    fontSize: 16,
  },
});
