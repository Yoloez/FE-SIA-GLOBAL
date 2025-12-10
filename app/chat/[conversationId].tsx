import { ThemedText } from "@/components/ThemedText";
import notificationService from "@/utils/notificationService";
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
  id_message?: number;
  id?: number;
  message: string;
  sender: User;
  created_at: string;
  sent_at?: string;
  conversation_id?: number;
  id_conversation?: number;
  isOptimistic?: boolean; // Flag untuk pesan yang belum terkirim
  isSending?: boolean; // Flag untuk status pengiriman
  sendFailed?: boolean; // Flag jika pengiriman gagal
}

interface OtherParticipant {
  id_user_si: number;
  name: string;
  nim: string | null;
}

interface ConversationData {
  id_conversation: number;
  type: string;
  other_participant: OtherParticipant | null;
}

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [conversationName, setConversationName] = useState("Chat");
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const echoChannelRef = useRef<any>(null);
  const processedMessageIds = useRef<Set<number>>(new Set()); // Track processed messages
  const isSubscribedRef = useRef(false); // Prevent double subscription

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
      if (echoChannelRef.current && conversationId && isSubscribedRef.current) {
        try {
          const channelName = `chat.${conversationId}`;
          echo.leave(channelName);
          console.log(`✅ Left channel: private-${channelName}`);
          isSubscribedRef.current = false;
        } catch (error) {
          console.error("❌ Error leaving channel:", error);
        }
        echoChannelRef.current = null;
      }

      // Clear processed messages
      processedMessageIds.current.clear();
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

      const { messages: messagesData, conversation } = response.data.data;

      console.log(`✅ Loaded ${messagesData?.length || 0} messages`);

      // Set messages dengan mapping id yang benar
      const formattedMessages = (messagesData || []).map((msg: any) => ({
        id: msg.id_message,
        id_message: msg.id_message,
        message: msg.message,
        sender: msg.sender,
        created_at: msg.sent_at || msg.created_at,
        conversation_id: msg.id_conversation,
      }));

      setMessages(formattedMessages);
      setConversationData(conversation);

      // Track loaded message IDs to prevent duplicates
      formattedMessages.forEach((msg: Message) => {
        if (msg.id_message) {
          processedMessageIds.current.add(msg.id_message);
        }
      });

      // Set conversation name dari other participant
      if (conversation?.other_participant) {
        setConversationName(conversation.other_participant.name);
      }
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
    if (!conversationId || !token) {
      console.warn("⚠️ Cannot setup Echo: missing conversationId or token");
      return;
    }

    // Prevent double subscription
    if (isSubscribedRef.current) {
      console.log("⚠️ Already subscribed to channel, skipping...");
      return;
    }

    // Fetch initial messages
    fetchMessages();

    const channelName = `chat.${conversationId}`;

    try {
      console.log(`🎧 Subscribing to channel: private-${channelName}`);

      const channel = echo.private(channelName);
      echoChannelRef.current = channel;
      isSubscribedRef.current = true;

      // Listen for new messages - using .listen() method
      channel.listen(".NewChatMessage", async (event: { message: any }) => {
        console.log("📨 [LISTENER] New message received via WebSocket:", event.message);

        if (!isMounted.current) {
          console.log("⚠️ Component unmounted, ignoring message");
          return;
        }

        const newMsg = event.message;
        const messageId = newMsg.id_message || newMsg.id;

        // Check if message already processed (strict duplicate prevention)
        if (processedMessageIds.current.has(messageId)) {
          console.log(`⚠️ Message ${messageId} already processed, skipping...`);
          return;
        }

        // Mark as processed immediately
        processedMessageIds.current.add(messageId);

        setMessages((prevMessages) => {
          const currentMessages = Array.isArray(prevMessages) ? prevMessages : [];

          // Double-check for duplicates in current state
          const isDuplicate = currentMessages.some((msg) => {
            const msgId = msg.id_message || msg.id;
            return msgId === messageId || (msg.isOptimistic && msg.message === newMsg.message && msg.sender?.id_user_si === newMsg.sender?.id_user_si);
          });

          if (isDuplicate) {
            console.log(`⚠️ Duplicate message ${messageId} found in state, skipping...`);
            return currentMessages;
          }

          // Format message from broadcast
          const formattedMsg: Message = {
            id: messageId,
            id_message: messageId,
            message: newMsg.message,
            sender: newMsg.sender,
            created_at: newMsg.created_at || newMsg.sent_at || new Date().toISOString(),
            conversation_id: newMsg.id_conversation || newMsg.conversation_id,
          };

          console.log(`✅ Adding new message ${messageId} to state`);
          return [...currentMessages, formattedMsg];
        });

        // Show popup notification if message from another user
        if (user && newMsg.sender?.id_user_si !== user.id_user_si) {
          try {
            await notificationService.showLocalNotification({
              type: "chat",
              title: newMsg.sender?.name || "Pesan Baru",
              message: newMsg.message,
              sender: newMsg.sender?.name,
              id_conversation: parseInt(conversationId),
              id_message: messageId,
            });
            console.log("📬 Popup notification displayed for new chat message");
          } catch (error) {
            console.error("❌ Error showing popup notification:", error);
          }
        }

        // Auto scroll to bottom when new message arrives
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      // Handle subscription errors
      channel.error((error: any) => {
        console.error("❌ Echo channel error:", error);
        isSubscribedRef.current = false;
      });

      // Log successful subscription
      console.log(`✅ Successfully subscribed to ${channelName}`);
    } catch (error) {
      console.error("❌ Error setting up Echo:", error);
      isSubscribedRef.current = false;
    }

    // Cleanup is handled by the first useEffect
  }, [conversationId, token, fetchMessages]);

  // Fungsi untuk mengirim pesan baru dengan optimistic update
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !token || !conversationId) {
      return;
    }

    const tempMessage = newMessage.trim();
    const tempId = -Date.now(); // Negative ID untuk temporary message
    const currentUserId = user?.id_user_si || (user as any)?.id || (user as any)?.id_user || 0;

    // Buat pesan optimistic
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
      isOptimistic: true,
      isSending: true,
      sendFailed: false,
    };

    // LANGSUNG tampilkan pesan dan kosongkan input
    setMessages((prev) => {
      const currentMessages = Array.isArray(prev) ? prev : [];
      return [...currentMessages, optimisticMessage];
    });
    setNewMessage("");

    // Auto scroll ke bawah SEGERA
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      console.log(`📤 Sending message: "${tempMessage}"`);

      const response = await api.post(`chat/conversations/${conversationId}/messages`, {
        message: tempMessage,
      });

      if (!isMounted.current) return;

      console.log("✅ Message sent successfully:", response.data);

      const serverMessage = response.data.data;
      const realMessageId = serverMessage.id_message || serverMessage.id;

      // Track the real message ID
      if (realMessageId) {
        processedMessageIds.current.add(realMessageId);
      }

      // Replace pesan optimistic dengan pesan real dari server
      setMessages((prevMessages) => {
        const currentMessages = Array.isArray(prevMessages) ? prevMessages : [];
        return currentMessages.map((msg) =>
          msg.id === tempId
            ? {
                id: realMessageId,
                id_message: realMessageId,
                message: serverMessage.message,
                sender: serverMessage.sender,
                created_at: serverMessage.created_at || serverMessage.sent_at || new Date().toISOString(),
                conversation_id: parseInt(conversationId),
                isOptimistic: false,
                isSending: false,
              }
            : msg
        );
      });
    } catch (error: any) {
      if (!isMounted.current) return;

      console.error("================ GAGAL MENGIRIM PESAN ================");
      let alertMessage = "Gagal mengirim pesan.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Status Kode:", error.response.status);
          console.error("Pesan dari Server:", JSON.stringify(error.response.data, null, 2));
          alertMessage = `Gagal mengirim pesan. Server merespons dengan error ${error.response.status}.`;
        } else if (error.request) {
          console.error("Tidak ada respons dari server.");
          alertMessage = "Tidak dapat terhubung ke server.";
        } else {
          console.error("Error Axios:", error.message);
        }
      } else {
        console.error("Error tidak terduga:", error);
      }
      console.error("======================================================");

      // Update pesan sebagai gagal
      setMessages((prevMessages) => {
        const currentMessages = Array.isArray(prevMessages) ? prevMessages : [];
        return currentMessages.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                isSending: false,
                sendFailed: true,
              }
            : msg
        );
      });

      // Show alert
      Alert.alert(
        "Pesan Gagal Terkirim",
        alertMessage,
        [
          {
            text: "Coba Lagi",
            onPress: () => {
              // Hapus pesan yang gagal
              setMessages((prev) => {
                const currentMessages = Array.isArray(prev) ? prev : [];
                return currentMessages.filter((msg) => msg.id !== tempId);
              });
              // Kembalikan ke input
              setNewMessage(tempMessage);
            },
          },
          {
            text: "Hapus",
            style: "destructive",
            onPress: () => {
              // Hapus pesan yang gagal
              setMessages((prev) => {
                const currentMessages = Array.isArray(prev) ? prev : [];
                return currentMessages.filter((msg) => msg.id !== tempId);
              });
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, [newMessage, token, conversationId, user]);

  // Komponen untuk merender setiap gelembung pesan
  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const currentUserId = user?.id_user_si || (user as any)?.id || (user as any)?.id_user;
      const isMyMessage = item.sender?.id_user_si === currentUserId;

      // Determine message status icon
      let statusIcon = null;
      if (isMyMessage) {
        if (item.sendFailed) {
          statusIcon = <Ionicons name="alert-circle" size={14} color="#ff4444" style={{ marginLeft: 4 }} />;
        } else if (item.isSending) {
          statusIcon = <ActivityIndicator size={12} color="#667781" style={{ marginLeft: 4 }} />;
        } else if (item.isOptimistic) {
          statusIcon = <Ionicons name="checkmark" size={14} color="#667781" style={{ marginLeft: 4 }} />;
        } else {
          statusIcon = <Ionicons name="checkmark-done" size={14} color="#4FC3F7" style={{ marginLeft: 4 }} />;
        }
      }

      return (
        <View style={[styles.messageWrapper, isMyMessage ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
          <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage, item.sendFailed && styles.failedMessage]}>
            {!isMyMessage && <ThemedText style={styles.senderName}>{item.sender.name}</ThemedText>}
            <ThemedText style={[styles.messageText, item.sendFailed && styles.failedMessageText]}>{item.message}</ThemedText>
            <View style={styles.messageFooter}>
              <Text style={styles.timestamp}>
                {new Date(item.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {statusIcon}
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
            <ThemedText style={styles.loadingText}>Memuat pesan...</ThemedText>
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
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 120}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item, index) => (item.id_message || item.id)?.toString() || `msg-${index}`}
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
            <TextInput style={styles.textInput} value={newMessage} onChangeText={setNewMessage} placeholder="Ketik pesan..." placeholderTextColor="#999" multiline maxLength={1000} />
            <TouchableOpacity style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]} onPress={handleSendMessage} disabled={!newMessage.trim()}>
              <Ionicons name="send" size={20} color="#fff" />
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
  failedMessage: {
    backgroundColor: "#ffdddd",
    borderWidth: 1,
    borderColor: "#ff4444",
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
  failedMessageText: {
    color: "#666",
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
    opacity: 0.6,
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
