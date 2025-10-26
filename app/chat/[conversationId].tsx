import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import echo from "../../api/echo";
import { useAuth } from "../../context/AuthContext";

// Tipe data untuk Message
interface User {
  id: number;
  name: string;
  email: string;
}

interface Message {
  id: number;
  message: string;
  sender: User;
  created_at: string;
  conversation_id?: number;
}

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const echoChannelRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;

      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Leave Echo channel
      if (echoChannelRef.current && conversationId) {
        try {
          echo.leaveChannel(`private-chat.${conversationId}`);
          console.log(`✅ Left channel: private-chat.${conversationId}`);
        } catch (error) {
          console.error("Error leaving channel:", error);
        }
      }
    };
  }, [conversationId]);

  // Fungsi untuk mengambil riwayat pesan dari API
  const fetchMessages = useCallback(async () => {
    if (!token || !conversationId) {
      console.warn("⚠️ Token atau conversationId tidak tersedia");
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
      console.log(`🔄 Fetching messages for conversation: ${conversationId}`);

      const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
        signal: abortControllerRef.current.signal,
      });

      if (!isMounted.current) return;

      console.log(`✅ Loaded ${response.data.data.length} messages`);
      setMessages(response.data.data);
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === "AbortError" || error.name === "CanceledError") {
        console.log("❌ Request was cancelled");
        return;
      }

      if (!isMounted.current) return;

      console.error("================ GAGAL MEMUAT PESAN ================");
      let alertMessage = "Terjadi kesalahan yang tidak diketahui.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Status Kode:", error.response.status);
          console.error("Pesan dari Server:", JSON.stringify(error.response.data, null, 2));
          alertMessage = `Gagal memuat pesan. Server merespons dengan error ${error.response.status}.`;
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
      console.error("===================================================");

      Alert.alert("Error", alertMessage);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [token, conversationId]);

  // Setup Echo listener untuk real-time messages
  useEffect(() => {
    if (!conversationId || !token) return;

    fetchMessages();

    try {
      console.log(`🎧 Subscribing to channel: private-chat.${conversationId}`);

      const channel = echo.private(`chat.${conversationId}`);
      echoChannelRef.current = channel;

      channel.listen("NewChatMessage", (event: { message: Message }) => {
        console.log("📨 Pesan baru diterima via WebSocket:", event.message);

        if (isMounted.current) {
          setMessages((prevMessages) => {
            // Cek duplikasi berdasarkan ID
            const isDuplicate = prevMessages.some((msg) => msg.id === event.message.id);
            if (isDuplicate) {
              console.log("⚠️ Duplicate message, skipping...");
              return prevMessages;
            }
            return [...prevMessages, event.message];
          });

          // Auto scroll to bottom saat ada pesan baru
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      });

      channel.error((error: any) => {
        console.error("❌ Echo channel error:", error);
      });
    } catch (error) {
      console.error("❌ Error setting up Echo:", error);
    }

    // Cleanup akan di-handle oleh useEffect pertama
  }, [conversationId, token, fetchMessages]);

  // Fungsi untuk mengirim pesan baru
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !token || !conversationId || isSending) {
      return;
    }

    const tempMessage = newMessage.trim();

    if (isMounted.current) {
      setNewMessage("");
      setIsSending(true);
    }

    try {
      console.log(`📤 Sending message: "${tempMessage}"`);

      const response = await api.post(`/chat/conversations/${conversationId}/messages`, { message: tempMessage });

      if (!isMounted.current) return;

      console.log("✅ Message sent successfully");

      // Tambahkan pesan ke list (kecuali jika sudah ada dari WebSocket)
      setMessages((prevMessages) => {
        const isDuplicate = prevMessages.some((msg) => msg.id === response.data.data.id);
        if (isDuplicate) {
          return prevMessages;
        }
        return [...prevMessages, response.data.data];
      });

      // Auto scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      if (!isMounted.current) return;

      console.error("================ GAGAL MENGIRIM PESAN ================");
      let alertMessage = "Terjadi kesalahan yang tidak diketahui.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Status Kode:", error.response.status);
          console.error("Pesan dari Server:", JSON.stringify(error.response.data, null, 2));
          alertMessage = `Gagal mengirim pesan. Server merespons dengan error ${error.response.status}.`;
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
      console.error("======================================================");

      Alert.alert("Error", alertMessage);

      // Kembalikan teks jika pengiriman gagal
      setNewMessage(tempMessage);
    } finally {
      if (isMounted.current) {
        setIsSending(false);
      }
    }
  }, [newMessage, token, conversationId, isSending]);

  // Komponen untuk merender setiap gelembung pesan
  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const isMyMessage = item.sender.id === user?.id;

      return (
        <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
          {!isMyMessage && <Text style={styles.senderName}>{item.sender.name}</Text>}
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      );
    },
    [user?.id]
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen
          options={{
            title: "Chat",
            headerStyle: { backgroundColor: "#015023" },
            headerTintColor: "#fff",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#015023" />
          <Text style={styles.loadingText}>Memuat pesan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Chat",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id?.toString() || `msg-${index}`}
          style={styles.messageList}
          contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
          onContentSizeChange={() => {
            // Auto scroll saat ada perubahan ukuran content
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          onLayout={() => {
            // Scroll ke bawah saat pertama kali render
            if (messages.length > 0) {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 100);
            }
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada pesan. Mulai percakapan!</Text>
            </View>
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={20}
          updateCellsBatchingPeriod={50}
          initialNumToRender={20}
          windowSize={10}
        />

        <View style={styles.inputContainer}>
          <TextInput style={styles.textInput} value={newMessage} onChangeText={setNewMessage} placeholder="Ketik pesan..." placeholderTextColor="#999" multiline maxLength={1000} editable={!isSending} />
          <TouchableOpacity style={[styles.sendButton, (isSending || !newMessage.trim()) && styles.sendButtonDisabled]} onPress={handleSendMessage} disabled={isSending || !newMessage.trim()}>
            {isSending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e5ddd5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  messageList: {
    flex: 1,
  },
  messageContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: "80%",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
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
    color: "#000",
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
    alignItems: "flex-end",
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
    color: "#000",
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
  sendButtonDisabled: {
    backgroundColor: "#999",
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: "50%",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontSize: 16,
  },
});
