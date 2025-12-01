import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import echo from "../../api/echo";
import { useAuth } from "../../context/AuthContext";

// Tipe data untuk Message
interface User {
  id_user_si: number;
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
  const [conversationName, setConversationName] = useState("Chat");
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

  // Update conversation name based on messages
  useEffect(() => {
    if (messages.length > 0 && user) {
      // Find the first message from someone other than current user
      const currentUserId = user?.id_user_si || (user as any)?.id || (user as any)?.id_user;
      const otherPersonMessage = messages.find((msg) => msg.sender.id_user_si !== currentUserId);

      if (otherPersonMessage) {
        setConversationName(otherPersonMessage.sender.name);
      } else if (messages[0]) {
        // If all messages are from current user, show the first sender name anyway
        setConversationName(messages[0].sender.name);
      }
    }
  }, [messages, user]);

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
    const tempId = Date.now(); // Temporary ID for optimistic update

    // Optimistic update - langsung tampilkan pesan
    const currentUserId = user?.id_user_si || (user as any)?.id || (user as any)?.id_user || 0;
    const optimisticMessage: Message = {
      id: tempId,
      message: tempMessage,
      sender: {
        id_user_si: currentUserId,
        name: user?.name || "You",
        email: user?.email || "",
      },
      created_at: new Date().toISOString(),
      conversation_id: parseInt(conversationId),
    };

    if (isMounted.current) {
      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage("");
      setIsSending(true);

      // Auto scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }

    try {
      console.log(`📤 Sending message: "${tempMessage}"`);

      const response = await api.post(`/chat/conversations/${conversationId}/messages`, { message: tempMessage });

      if (!isMounted.current) return;

      console.log("✅ Message sent successfully");

      // Replace temporary message with real one from server
      setMessages((prevMessages) => {
        const filtered = prevMessages.filter((msg) => msg.id !== tempId);
        const isDuplicate = filtered.some((msg) => msg.id === response.data.data.id);
        if (isDuplicate) {
          return filtered;
        }
        return [...filtered, response.data.data];
      });
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
      // Check multiple possible user ID properties
      const currentUserId = user?.id_user_si || (user as any)?.id || (user as any)?.id_user;
      const isMyMessage = item.sender.id_user_si === currentUserId;

      console.log("Rendering message:", {
        messageId: item.id,
        senderId: item.sender.id_user_si,
        currentUserId: currentUserId,
        userObject: user,
        isMyMessage,
        message: item.message.substring(0, 20),
      });

      return (
        <View style={[styles.messageWrapper, isMyMessage ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
          <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
            {!isMyMessage && <Text style={styles.senderName}>{item.sender.name}</Text>}
            <Text style={styles.messageText}>{item.message}</Text>
            <View style={styles.messageFooter}>
              <Text style={styles.timestamp}>
                {new Date(item.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {isMyMessage && <Ionicons name="checkmark-done" size={14} color="#4FC3F7" style={{ marginLeft: 4 }} />}
            </View>
          </View>
        </View>
      );
    },
    [user]
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen
          options={{
            title: conversationName,
            headerStyle: { backgroundColor: "#015023" },
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "600" },
          }}
        />
        <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Memuat pesan...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: conversationName,
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
      <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 30}>
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
      </LinearGradient>
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
    color: "#FFFFFF",
    fontWeight: "500",
  },
  messageList: {
    flex: 1,
    backgroundColor: "transparent",
  },
  messageWrapper: {
    marginBottom: 4,
    marginHorizontal: 8,
  },
  myMessageWrapper: {
    alignItems: "flex-end",
  },
  theirMessageWrapper: {
    alignItems: "flex-start",
  },
  messageContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: "75%",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
  },
  myMessage: {
    backgroundColor: "#DABC4E",
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 2,
  },
  theirMessage: {
    backgroundColor: "#F5EFD3",
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 2,
  },
  senderName: {
    fontWeight: "600",
    fontSize: 13,
    color: "#015023",
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    color: "#000",
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 3,
  },
  timestamp: {
    fontSize: 11,
    color: "#667781",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "transparent",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F5EFD3",
    fontSize: 16,
    color: "#000",
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#DABC4E",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    borderWidth: 1,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#B0B0B0",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: "40%",
  },
  emptyText: {
    textAlign: "center",
    color: "#FFFFFF",
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
});
