import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import api from "../../api/axios";
import { ThemedText } from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";

interface Contact {
  id_user_si: number;
  name: string;
  username: string;
  email: string;
  profile_image: string | null;
  role: string;
}

interface Section {
  title: string;
  data: Contact[];
}

const ChatListApp = () => {
  const router = useRouter();
  const { token, user } = useAuth();
  const [lecturers, setLecturers] = useState<Contact[]>([]);
  const [classmates, setClassmates] = useState<Contact[]>([]);
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
    if (!token) {
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

      const { lecturers: lecturersData, classmates: classmatesData } = response.data.data;

      setLecturers(lecturersData || []);
      setClassmates(classmatesData || []);
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === "AbortError" || error.name === "CanceledError") {
        console.log("❌ Request was cancelled");
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
  }, [token]);

  // Fetch contacts when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchContacts();

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
        console.log(`📤 Starting private chat with user ${recipientId}...`);
        const response = await api.post("/chat/conversations/private", {
          recipient_id: recipientId,
        });

        if (!isMounted.current) return;

        const conversation = response.data.data;
        console.log(`✅ Conversation created: ${conversation.id_conversation}`);

        // Navigate to chat screen
        router.push(`/chat/${conversation.id_conversation}` as any);
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
    [token, router]
  );

  const renderChatItem = ({ item }: { item: Contact }) => {
    // Gunakan profile_image dari API jika tersedia, fallback ke ui-avatars
    const avatarUri = item.profile_image ? `${process.env.EXPO_PUBLIC_BUAT_FOTO}/${item.profile_image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=015023&color=fff&size=150`;

    return (
      <TouchableOpacity onPress={() => handleStartPrivateChat(item.id_user_si)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <View style={styles.contactCard}>
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} defaultSource={require("../../assets/images/react-logo.png")} />

          <View style={styles.contactInfo}>
            <ThemedText style={styles.contactName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText style={styles.contactId} numberOfLines={1}>
              {item.email}
            </ThemedText>
          </View>

          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#015023" />
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" backgroundColor="#015023" />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Chat</ThemedText>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FACC15" />
            <ThemedText style={styles.loadingTextWhite}>Memuat kontak...</ThemedText>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#015023" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Chat</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.5)" />
              <ThemedText style={styles.emptyText}>Belum ada kontak tersedia</ThemedText>
            </View>
          }
          data={[{ key: "sections" }]}
          renderItem={() => (
            <>
              {/* Jika user adalah Dosen, tampilkan hanya Mahasiswa */}
              {user?.role === "dosen" ? (
                <>
                  {classmates.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <View style={styles.badgeContainer}>
                        <View style={styles.badge}>
                          <ThemedText style={styles.badgeText}>Mahasiswa</ThemedText>
                        </View>
                      </View>
                      {classmates.map((item) => (
                        <View key={item.id_user_si}>{renderChatItem({ item })}</View>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <>
                  {/* Jika user adalah Mahasiswa, tampilkan Lecturer dan Classmates */}
                  {lecturers.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <View style={styles.badgeContainer}>
                        <View style={styles.badge}>
                          <ThemedText style={styles.badgeText}>Dosen</ThemedText>
                        </View>
                      </View>
                      {lecturers.map((item) => (
                        <View key={item.id_user_si}>{renderChatItem({ item })}</View>
                      ))}
                    </View>
                  )}

                  {classmates.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <View style={styles.badgeContainer}>
                        <View style={styles.badge}>
                          <ThemedText style={styles.badgeText}>Teman Kelas</ThemedText>
                        </View>
                      </View>
                      {classmates.map((item) => (
                        <View key={item.id_user_si}>{renderChatItem({ item })}</View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </>
          )}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 35,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sectionContainer: {
    marginBottom: 16,
    backgroundColor: "#F5EFD3",
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 20,
  },
  badgeContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  badge: {
    backgroundColor: "#DABC4E",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  contactCard: {
    backgroundColor: "",
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#015023",
    backgroundColor: "#f0f8f4",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  loadingTextWhite: {
    marginTop: 12,
    fontSize: 16,
    color: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
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
});

export default ChatListApp;
