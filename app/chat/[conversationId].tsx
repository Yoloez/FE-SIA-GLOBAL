import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import echo from "../../api/echo"; // Impor konfigurasi Echo
import { useAuth } from "../../context/AuthContext";

const IP_ADDRESS = "192.168.0.159"; // Ganti dengan IP Anda
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Fungsi untuk mengambil riwayat pesan dari API
  const fetchMessages = useCallback(async () => {
    if (!token || !conversationId) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data.data);
    } catch (error) {
      alert("Gagal memuat pesan.");
    } finally {
      setIsLoading(false);
    }
  }, [token, conversationId]);

  // useEffect ini berjalan saat halaman dibuka untuk mengambil data
  // dan menyiapkan "telinga" untuk pesan real-time
  useEffect(() => {
    fetchMessages();

    const channel = echo.private(`chat.${conversationId}`);

    channel.listen("NewChatMessage", (event: { message: any }) => {
      console.log("Pesan baru diterima via WebSocket:", event.message);
      setMessages((prevMessages) => [...prevMessages, event.message]);
    });

    return () => {
      echo.leaveChannel(`chat.${conversationId}`);
      console.log(`Meninggalkan channel chat.${conversationId}`);
    };
  }, [conversationId, fetchMessages]);

  // Fungsi untuk mengirim pesan baru
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !token) return;
    const tempMessage = newMessage;
    setNewMessage(""); // Kosongkan input segera untuk UX yang baik
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, { message: tempMessage }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages((prevMessages) => [...prevMessages, response.data.data]);
    } catch (error) {
      // --- INI BAGIAN PERBAIKANNYA: Penanganan Error yang Lebih Detail ---
      console.error("================ GAGAL MENGIRIM PESAN ================");
      let alertMessage = "Terjadi kesalahan yang tidak diketahui.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server merespons dengan status error (4xx atau 5xx)
          console.error("Status Kode:", error.response.status);
          console.error("Pesan dari Server:", JSON.stringify(error.response.data, null, 2));
          alertMessage = `Gagal mengirim pesan. Server merespons dengan error ${error.response.status}. Cek terminal untuk detail.`;
        } else if (error.request) {
          // Request terkirim tapi tidak ada respons
          console.error("Tidak ada respons dari server. Cek koneksi, IP, dan server Laravel/Reverb.");
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
      console.error("======================================================");
      alert(alertMessage); // Tampilkan pesan yang lebih informatif
      setNewMessage(tempMessage); // Kembalikan teks jika pengiriman gagal
      // -----------------------------------------------------------------
    }
  };

  // Komponen untuk merender setiap gelembung pesan
  const renderItem = ({ item }) => {
    const isMyMessage = item.sender.id === user?.id;
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        {!isMyMessage && <Text style={styles.senderName}>{item.sender.name}</Text>}
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.timestamp}>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Grup Kelas" }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={80}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#015023" style={{ flex: 1 }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id?.toString() || `msg-${index}`}
            style={styles.messageList}
            contentContainerStyle={{ padding: 10 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}
        <View style={styles.inputContainer}>
          <TextInput style={styles.textInput} value={newMessage} onChangeText={setNewMessage} placeholder="Ketik pesan..." multiline />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#e5ddd5" },
  messageList: { flex: 1 },
  messageContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: "80%",
    elevation: 1,
  },
  myMessage: {
    backgroundColor: "#dcf8c6",
    alignSelf: "flex-end",
    borderBottomRightRadius: 2,
  },
  theirMessage: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 2,
  },
  senderName: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#015023",
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    color: "#999",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#015023",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
});
