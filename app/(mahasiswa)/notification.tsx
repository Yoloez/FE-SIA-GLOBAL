import api from "@/api/axios";
import echo from "@/api/echo";
import { useAuth } from "@/context/AuthContext";
import notificationService from "@/utils/notificationService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../../components/ThemedText";

const { width } = Dimensions.get("window");

interface NotificationMetadata {
  id_conversation?: number;
  id_message?: number;
  id_class?: number;
  class_code?: string;
  id_announcement?: number;
  subject_name?: string;
  subject_code?: string;
  lecturer_name?: string;
  student_name?: string;
  student_nim?: string;
}

interface NotificationItem {
  id_notification: number;
  type: "chat" | "announcement";
  title: string;
  message: string;
  sender: string;
  sent_at: string;
  read_at: string | null;
  is_read: boolean;
  metadata: NotificationMetadata;
}

interface NotificationResponse {
  notifications: NotificationItem[];
  unread_count: number;
  total: number;
}

type FilterType = "all" | "chat" | "announcement";
type FilterStatus = "all" | "read" | "unread";

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "info" | "announcement";
  metadata?: NotificationMetadata;
}

const CustomModal: React.FC<CustomModalProps> = ({ visible, onClose, title, message, type = "info", metadata }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconConfig = () => {
    switch (type) {
      case "success":
        return { name: "checkmark-circle", color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)" };
      case "error":
        return { name: "close-circle", color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.1)" };
      case "announcement":
        return { name: "megaphone", color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)" };
      default:
        return { name: "information-circle", color: "#0EA5E9", bgColor: "rgba(14, 165, 233, 0.1)" };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.modalContent}>
            {/* Icon Header */}
            <View style={[styles.iconHeader, { backgroundColor: iconConfig.bgColor }]}>
              <Ionicons name={iconConfig.name as any} size={28} color={iconConfig.color} />
            </View>

            {/* Title */}
            <ThemedText variant="bold" style={styles.modalTitle}>
              {title}
            </ThemedText>

            {/* Message */}
            <ScrollView style={styles.messageScrollView} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.modalMessage}>{message}</ThemedText>

              {/* Metadata Info */}
              {metadata && (
                <View style={styles.metadataContainer}>
                  {metadata.class_code && (
                    <View style={styles.metadataRow}>
                      <Ionicons name="school-outline" size={16} color="#6B7280" />
                      <ThemedText variant="semibold" style={styles.metadataText}>
                        Kelas: {metadata.class_code}
                      </ThemedText>
                    </View>
                  )}
                  {metadata.subject_name && (
                    <View style={styles.metadataRow}>
                      <Ionicons name="book-outline" size={16} color="#6B7280" />
                      <ThemedText variant="semibold" style={styles.metadataText}>
                        {metadata.subject_name}
                      </ThemedText>
                    </View>
                  )}
                  {metadata.lecturer_name && (
                    <View style={styles.metadataRow}>
                      <Ionicons name="person-outline" size={16} color="#6B7280" />
                      <ThemedText variant="semibold" style={styles.metadataText}>
                        Dosen: {metadata.lecturer_name}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Action Button */}
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: iconConfig.color }]} onPress={onClose} activeOpacity={0.8}>
              <ThemedText variant="semibold" style={styles.modalButtonText}>
                Tutup
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ visible, onClose, onConfirm, title, message, confirmText = "Ya", cancelText = "Batal" }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.modalContent}>
            {/* Icon Header */}
            <View style={[styles.iconHeader, { backgroundColor: "rgba(14, 165, 233, 0.1)" }]}>
              <Ionicons name="help-circle" size={48} color="#0EA5E9" />
            </View>

            {/* Title */}
            <ThemedText variant="bold" style={styles.modalTitle}>
              {title}
            </ThemedText>

            {/* Message */}
            <ThemedText style={styles.modalMessage}>{message}</ThemedText>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.halfButton, styles.cancelButton]} onPress={onClose} activeOpacity={0.8}>
                <ThemedText variant="semibold" style={styles.cancelButtonText}>
                  {cancelText}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.halfButton, styles.confirmButton]}
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <ThemedText variant="semibold" style={styles.confirmButtonText}>
                  {confirmText}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default function NotificationScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const echoChannelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const processedNotificationIds = useRef<Set<number>>(new Set());
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info" | "announcement",
    metadata: undefined as NotificationMetadata | undefined,
  });

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const params: any = {};
      if (filterType !== "all") params.type = filterType;
      if (filterStatus !== "all") params.status = filterStatus;

      const response = await api.get("/notifications", { params });

      if (response.data.status === "success") {
        const data: NotificationResponse = response.data.data;
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (error: any) {
      console.error("Gagal memuat notifikasi:", error);
      setModalConfig({
        title: "Terjadi Kesalahan",
        message: "Gagal memuat notifikasi. Silakan coba lagi.",
        type: "error",
        metadata: undefined,
      });
      setModalVisible(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filterType, filterStatus]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchNotifications();
    }, [fetchNotifications])
  );

  // Setup Echo listener untuk real-time notifications
  useEffect(() => {
    if (!user?.id_user_si) {
      console.warn("⚠️ Cannot setup Echo: missing user ID");
      return;
    }

    // Prevent double subscription
    if (isSubscribedRef.current) {
      console.log("⚠️ Already subscribed to notification channel");
      return;
    }

    const channelName = `user.${user.id_user_si}`;

    try {
      console.log(`🔔 Subscribing to notification channel: private-${channelName}`);

      const channel = echo.private(channelName);
      echoChannelRef.current = channel;
      isSubscribedRef.current = true;

      // Listen for new notifications
      channel.listen(".NewNotification", async (event: { notification: NotificationItem }) => {
        console.log("🔔 New notification received:", event.notification);

        const newNotification = event.notification;
        const notifId = newNotification.id_notification;

        // Check if notification already processed
        if (processedNotificationIds.current.has(notifId)) {
          console.log(`⚠️ Notification ${notifId} already processed, skipping...`);
          return;
        }

        // Mark as processed
        processedNotificationIds.current.add(notifId);

        // Add to state (prepend - newest first)
        setNotifications((prev) => {
          // Check for duplicates in current state
          const isDuplicate = prev.some((n) => n.id_notification === notifId);
          if (isDuplicate) {
            console.log(`⚠️ Duplicate notification ${notifId} found in state`);
            return prev;
          }

          console.log(`✅ Adding new notification ${notifId} to state`);
          return [newNotification, ...prev];
        });

        // Update unread count
        if (!newNotification.is_read) {
          setUnreadCount((prev) => prev + 1);
        }

        // Show popup notification
        try {
          await notificationService.showLocalNotification({
            type: newNotification.type,
            title: newNotification.title,
            message: newNotification.message,
            sender: newNotification.sender,
            id_conversation: newNotification.metadata?.id_conversation,
            id_message: newNotification.metadata?.id_message,
            id_announcement: newNotification.metadata?.id_announcement,
          });
          console.log("📬 Popup notification displayed");
        } catch (error) {
          console.error("❌ Error showing popup notification:", error);
        }
      });

      // Handle subscription errors
      channel.error((error: any) => {
        console.error("❌ Notification channel error:", error);
        isSubscribedRef.current = false;
      });

      console.log(`✅ Successfully subscribed to notification channel`);
    } catch (error) {
      console.error("❌ Error setting up notification Echo:", error);
      isSubscribedRef.current = false;
    }

    // Cleanup
    return () => {
      if (echoChannelRef.current && isSubscribedRef.current) {
        try {
          const channelName = `user.${user.id_user_si}`;
          echo.leave(channelName);
          console.log(`✅ Left notification channel: private-${channelName}`);
          isSubscribedRef.current = false;
        } catch (error) {
          console.error("❌ Error leaving notification channel:", error);
        }
        echoChannelRef.current = null;
      }
      processedNotificationIds.current.clear();
    };
  }, [user?.id_user_si]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const response = await api.put("/notifications/read-all");

      if (response.data.status === "success") {
        setModalConfig({
          title: "Berhasil!",
          message: "Semua notifikasi telah ditandai sebagai dibaca",
          type: "success",
          metadata: undefined,
        });
        setModalVisible(true);
        fetchNotifications();
      }
    } catch (error: any) {
      console.error("Gagal menandai notifikasi:", error);
      setModalConfig({
        title: "Terjadi Kesalahan",
        message: "Gagal menandai notifikasi sebagai dibaca. Silakan coba lagi.",
        type: "error",
        metadata: undefined,
      });
      setModalVisible(true);
    }
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);

      if (response.data.status === "success") {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id_notification === notificationId
              ? { ...n, is_read: true, read_at: response.data.data.read_at }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setActionMenuVisible(false);
        
        setModalConfig({
          title: "Berhasil!",
          message: "Notifikasi telah ditandai sebagai dibaca",
          type: "success",
          metadata: undefined,
        });
        setModalVisible(true);
      }
    } catch (error: any) {
      console.error("Gagal menandai notifikasi:", error);
      setModalConfig({
        title: "Terjadi Kesalahan",
        message: "Gagal menandai notifikasi. Silakan coba lagi.",
        type: "error",
        metadata: undefined,
      });
      setModalVisible(true);
    }
  }, []);

  const handleDeleteNotification = useCallback(async (notificationId: number) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);

      if (response.data.status === "success") {
        // Remove from local state
        setNotifications((prev) => {
          const deletedNotif = prev.find((n) => n.id_notification === notificationId);
          if (deletedNotif && !deletedNotif.is_read) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.filter((n) => n.id_notification !== notificationId);
        });
        
        setDeleteConfirmVisible(false);
        setActionMenuVisible(false);
        
        setModalConfig({
          title: "Berhasil!",
          message: "Notifikasi telah dihapus",
          type: "success",
          metadata: undefined,
        });
        setModalVisible(true);
      }
    } catch (error: any) {
      console.error("Gagal menghapus notifikasi:", error);
      setModalConfig({
        title: "Terjadi Kesalahan",
        message: "Gagal menghapus notifikasi. Silakan coba lagi.",
        type: "error",
        metadata: undefined,
      });
      setModalVisible(true);
    }
  }, []);

  const showMarkAllConfirmation = () => {
    setConfirmModalVisible(true);
  };

  const handleNotificationPress = useCallback((item: NotificationItem) => {
    if (item.type === "chat" && item.metadata.id_conversation) {
      router.push(`/chat/${item.metadata.id_conversation}`);
    } else if (item.type === "announcement") {
      setModalConfig({
        title: item.title,
        message: item.message,
        type: "announcement",
        metadata: item.metadata,
      });
      setModalVisible(true);
    }
  }, []);

  const handleNotificationLongPress = useCallback((item: NotificationItem) => {
    setSelectedNotification(item);
    setActionMenuVisible(true);
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity 
      onPress={() => handleNotificationPress(item)} 
      onLongPress={() => handleNotificationLongPress(item)}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      <View style={[styles.notificationCard, !item.is_read && styles.unreadCard]}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, item.type === "chat" ? styles.chatIcon : styles.announcementIcon]}>
            <Ionicons name={item.type === "chat" ? "chatbubble" : "megaphone"} size={20} color="#fff" />
          </View>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.contentContainer}>
          <ThemedText variant="bold" style={styles.notificationTitle} numberOfLines={1}>
            {item.title}
          </ThemedText>

          <ThemedText style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </ThemedText>

          {item.type === "announcement" && item.metadata.class_code && (
            <View style={styles.classChip}>
              <Ionicons name="school-outline" size={12} color="#015023" />
              <ThemedText variant="semibold" style={styles.classChipText}>
                {item.metadata.class_code}
              </ThemedText>
            </View>
          )}

          <View style={styles.metaRow}>
            <ThemedText variant="semibold" style={styles.timeText}>
              {formatTime(item.sent_at)}
            </ThemedText>
            {item.sender !== "System" && (
              <>
                <ThemedText style={styles.separator}>•</ThemedText>
                <ThemedText variant="semibold" style={styles.senderText}>
                  {item.sender}
                </ThemedText>
              </>
            )}
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color="#015023" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <ThemedText variant="bold" style={styles.headerTitle}>
            Notifikasi
          </ThemedText>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={showMarkAllConfirmation} style={styles.markAllButton}>
              <Ionicons name="checkmark-done" size={20} color="#DABC4E" />
            </TouchableOpacity>
          )}
          {unreadCount === 0 && <View style={styles.headerSpacer} />}
        </View>

        {/* Badge Unread Count */}
        {unreadCount > 0 && (
          <View style={styles.unreadBadgeContainer}>
            <View style={styles.unreadBadge}>
              <Ionicons name="notifications" size={16} color="#fff" />
              <ThemedText variant="semibold" style={styles.unreadBadgeText}>
                {unreadCount} notifikasi belum dibaca
              </ThemedText>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <TouchableOpacity style={[styles.filterTab, filterType === "all" && styles.activeFilterTab]} onPress={() => setFilterType("all")}>
              <ThemedText variant="semibold" style={[styles.filterTabText, filterType === "all" && styles.activeFilterTabText]}>
                Semua
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.filterTab, filterType === "chat" && styles.activeFilterTab]} onPress={() => setFilterType("chat")}>
              <Ionicons name="chatbubble" size={14} color={filterType === "chat" ? "#015023" : "#F5EFD3"} />
              <ThemedText variant="semibold" style={[styles.filterTabText, filterType === "chat" && styles.activeFilterTabText]}>
                Chat
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.filterTab, filterType === "announcement" && styles.activeFilterTab]} onPress={() => setFilterType("announcement")}>
              <Ionicons name="megaphone" size={14} color={filterType === "announcement" ? "#015023" : "#F5EFD3"} />
              <ThemedText variant="semibold" style={[styles.filterTabText, filterType === "announcement" && styles.activeFilterTabText]}>
                Pengumuman
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Status Filter */}
          <View style={styles.statusFilterRow}>
            <TouchableOpacity style={[styles.statusFilterChip, filterStatus === "all" && styles.activeStatusChip]} onPress={() => setFilterStatus("all")}>
              <ThemedText variant="semibold" style={[styles.statusFilterText, filterStatus === "all" && styles.activeStatusText]}>
                Semua
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.statusFilterChip, filterStatus === "unread" && styles.activeStatusChip]} onPress={() => setFilterStatus("unread")}>
              <ThemedText variant="semibold" style={[styles.statusFilterText, filterStatus === "unread" && styles.activeStatusText]}>
                Belum Dibaca
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.statusFilterChip, filterStatus === "read" && styles.activeStatusChip]} onPress={() => setFilterStatus("read")}>
              <ThemedText variant="semibold" style={[styles.statusFilterText, filterStatus === "read" && styles.activeStatusText]}>
                Sudah Dibaca
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DABC4E" />
            <ThemedText variant="semibold" style={styles.loadingText}>
              Memuat notifikasi...
            </ThemedText>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="rgba(255,255,255,0.5)" />
            <ThemedText variant="semibold" style={styles.emptyText}>
              Tidak ada notifikasi
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>{filterType === "all" && filterStatus === "all" ? "Anda belum memiliki notifikasi" : "Tidak ada notifikasi yang sesuai filter"}</ThemedText>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id_notification.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#DABC4E" colors={["#DABC4E"]} />}
          />
        )}

        {/* Custom Modals */}
        <CustomModal visible={modalVisible} onClose={() => setModalVisible(false)} title={modalConfig.title} message={modalConfig.message} type={modalConfig.type} metadata={modalConfig.metadata} />

        <ConfirmModal
          visible={confirmModalVisible}
          onClose={() => setConfirmModalVisible(false)}
          onConfirm={handleMarkAllAsRead}
          title="Tandai Semua Sebagai Dibaca?"
          message="Semua notifikasi akan ditandai sebagai sudah dibaca. Apakah Anda yakin?"
          confirmText="Ya, Tandai"
          cancelText="Batal"
        />

        {/* Action Menu Modal */}
        <Modal transparent visible={actionMenuVisible} onRequestClose={() => setActionMenuVisible(false)} animationType="fade">
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActionMenuVisible(false)} />
            
            <View style={styles.actionMenuContainer}>
              <View style={styles.actionMenuContent}>
                <ThemedText variant="bold" style={styles.actionMenuTitle}>
                  Pilih Aksi
                </ThemedText>

                {selectedNotification && !selectedNotification.is_read && (
                  <TouchableOpacity
                    style={styles.actionMenuItem}
                    onPress={() => handleMarkAsRead(selectedNotification.id_notification)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark-circle-outline" size={22} color="#10B981" />
                    <ThemedText style={styles.actionMenuItemText}>Tandai Dibaca</ThemedText>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionMenuItem, styles.deleteMenuItem]}
                  onPress={() => {
                    setActionMenuVisible(false);
                    setDeleteConfirmVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  <ThemedText style={[styles.actionMenuItemText, styles.deleteMenuItemText]}>Hapus Notifikasi</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionMenuItem, styles.cancelMenuItem]}
                  onPress={() => setActionMenuVisible(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle-outline" size={22} color="#6B7280" />
                  <ThemedText style={styles.actionMenuItemText}>Batal</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          visible={deleteConfirmVisible}
          onClose={() => setDeleteConfirmVisible(false)}
          onConfirm={() => selectedNotification && handleDeleteNotification(selectedNotification.id_notification)}
          title="Hapus Notifikasi?"
          message="Notifikasi ini akan dihapus secara permanen. Apakah Anda yakin?"
          confirmText="Ya, Hapus"
          cancelText="Batal"
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
        

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  markAllButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  headerSpacer: {
    width: 40,
  },
  unreadBadgeContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  unreadBadge: {
    backgroundColor: "rgba(218, 188, 78, 0.2)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(218, 188, 78, 0.3)",
  },
  unreadBadgeText: {
    fontSize: 13,
    color: "#DABC4E",
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterTab: {
    flex: 1,
    backgroundColor: "rgba(245, 239, 211, 0.15)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(245, 239, 211, 0.3)",
  },
  activeFilterTab: {
    backgroundColor: "#DABC4E",
    borderColor: "#DABC4E",
  },
  filterTabText: {
    fontSize: 13,
    color: "#F5EFD3",
  },
  activeFilterTabText: {
    color: "#015023",
  },
  statusFilterRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusFilterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(245, 239, 211, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 239, 211, 0.2)",
  },
  activeStatusChip: {
    backgroundColor: "rgba(245, 239, 211, 0.25)",
    borderColor: "#F5EFD3",
  },
  statusFilterText: {
    fontSize: 12,
    color: "rgba(245, 239, 211, 0.7)",
  },
  activeStatusText: {
    color: "#F5EFD3",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  notificationCard: {
    backgroundColor: "#F5EFD3",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: "#fff",
    borderColor: "#DABC4E",
    borderWidth: 2,
  },
  iconContainer: {
    position: "relative",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  chatIcon: {
    backgroundColor: "#0EA5E9",
  },
  announcementIcon: {
    backgroundColor: "#F59E0B",
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#F5EFD3",
  },
  contentContainer: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    fontSize: 15,
    color: "#015023",
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
    marginBottom: 6,
  },
  classChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(1, 80, 35, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  classChipText: {
    fontSize: 11,
    color: "#015023",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  separator: {
    fontSize: 11,
    color: "#D1D5DB",
  },
  senderText: {
    fontSize: 11,
    color: "#6B7280",
  },
  arrowContainer: {
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 6,
    textAlign: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width - 48,
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconHeader: {
    width: 40,
    height: 40,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  messageScrollView: {
    maxHeight: 350,
    width: "100%",
    marginBottom: 20,
  },
  modalMessage: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "justify",
    lineHeight: 22,
  },
  metadataContainer: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metadataText: {
    fontSize: 13,
    color: "#6B7280",
  },
  modalButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  halfButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    fontSize: 15,
    color: "#6B7280",
  },
  confirmButton: {
    backgroundColor: "#0EA5E9",
  },
  confirmButtonText: {
    fontSize: 15,
    color: "#FFFFFF",
  },
  actionMenuContainer: {
    justifyContent: "flex-end",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  actionMenuContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  actionMenuTitle: {
    fontSize: 16,
    color: "#1F2937",
    textAlign: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 4,
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 2,
  },
  deleteMenuItem: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  cancelMenuItem: {
    backgroundColor: "rgba(107, 114, 128, 0.05)",
    marginTop: 4,
  },
  actionMenuItemText: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
  },
  deleteMenuItemText: {
    color: "#EF4444",
  },
});
