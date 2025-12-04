import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
            <Text style={styles.modalTitle}>{title}</Text>

            {/* Message */}
            <ScrollView style={styles.messageScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalMessage}>{message}</Text>

              {/* Metadata Info */}
              {metadata && (
                <View style={styles.metadataContainer}>
                  {metadata.class_code && (
                    <View style={styles.metadataRow}>
                      <Ionicons name="school-outline" size={16} color="#6B7280" />
                      <Text style={styles.metadataText}>Kelas: {metadata.class_code}</Text>
                    </View>
                  )}
                  {metadata.subject_name && (
                    <View style={styles.metadataRow}>
                      <Ionicons name="book-outline" size={16} color="#6B7280" />
                      <Text style={styles.metadataText}>{metadata.subject_name}</Text>
                    </View>
                  )}
                  {metadata.lecturer_name && (
                    <View style={styles.metadataRow}>
                      <Ionicons name="person-outline" size={16} color="#6B7280" />
                      <Text style={styles.metadataText}>Dosen: {metadata.lecturer_name}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Action Button */}
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: iconConfig.color }]} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.modalButtonText}>Tutup</Text>
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
            <Text style={styles.modalTitle}>{title}</Text>

            {/* Message */}
            <Text style={styles.modalMessage}>{message}</Text>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.halfButton, styles.cancelButton]} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.halfButton, styles.confirmButton]}
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

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
    <TouchableOpacity onPress={() => handleNotificationPress(item)} activeOpacity={0.7}>
      <View style={[styles.notificationCard, !item.is_read && styles.unreadCard]}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, item.type === "chat" ? styles.chatIcon : styles.announcementIcon]}>
            <Ionicons name={item.type === "chat" ? "chatbubble" : "megaphone"} size={20} color="#fff" />
          </View>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>

          {item.type === "announcement" && item.metadata.class_code && (
            <View style={styles.classChip}>
              <Ionicons name="school-outline" size={12} color="#015023" />
              <Text style={styles.classChipText}>{item.metadata.class_code}</Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.timeText}>{formatTime(item.sent_at)}</Text>
            {item.sender !== "System" && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.senderText}>{item.sender}</Text>
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
          <Text style={styles.headerTitle}>Notifikasi</Text>
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
              <Text style={styles.unreadBadgeText}>{unreadCount} notifikasi belum dibaca</Text>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <TouchableOpacity style={[styles.filterTab, filterType === "all" && styles.activeFilterTab]} onPress={() => setFilterType("all")}>
              <Text style={[styles.filterTabText, filterType === "all" && styles.activeFilterTabText]}>Semua</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.filterTab, filterType === "chat" && styles.activeFilterTab]} onPress={() => setFilterType("chat")}>
              <Ionicons name="chatbubble" size={14} color={filterType === "chat" ? "#015023" : "#F5EFD3"} />
              <Text style={[styles.filterTabText, filterType === "chat" && styles.activeFilterTabText]}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.filterTab, filterType === "announcement" && styles.activeFilterTab]} onPress={() => setFilterType("announcement")}>
              <Ionicons name="megaphone" size={14} color={filterType === "announcement" ? "#015023" : "#F5EFD3"} />
              <Text style={[styles.filterTabText, filterType === "announcement" && styles.activeFilterTabText]}>Pengumuman</Text>
            </TouchableOpacity>
          </View>

          {/* Status Filter */}
          <View style={styles.statusFilterRow}>
            <TouchableOpacity style={[styles.statusFilterChip, filterStatus === "all" && styles.activeStatusChip]} onPress={() => setFilterStatus("all")}>
              <Text style={[styles.statusFilterText, filterStatus === "all" && styles.activeStatusText]}>Semua</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.statusFilterChip, filterStatus === "unread" && styles.activeStatusChip]} onPress={() => setFilterStatus("unread")}>
              <Text style={[styles.statusFilterText, filterStatus === "unread" && styles.activeStatusText]}>Belum Dibaca</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.statusFilterChip, filterStatus === "read" && styles.activeStatusChip]} onPress={() => setFilterStatus("read")}>
              <Text style={[styles.statusFilterText, filterStatus === "read" && styles.activeStatusText]}>Sudah Dibaca</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DABC4E" />
            <Text style={styles.loadingText}>Memuat notifikasi...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyText}>Tidak ada notifikasi</Text>
            <Text style={styles.emptySubtext}>{filterType === "all" && filterStatus === "all" ? "Anda belum memiliki notifikasi" : "Tidak ada notifikasi yang sesuai filter"}</Text>
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
    fontWeight: "700",
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
    fontWeight: "600",
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
    fontWeight: "600",
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
    fontWeight: "500",
    color: "rgba(245, 239, 211, 0.7)",
  },
  activeStatusText: {
    color: "#F5EFD3",
    fontWeight: "600",
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
    fontWeight: "700",
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
    fontWeight: "600",
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
    fontWeight: "500",
  },
  separator: {
    fontSize: 11,
    color: "#D1D5DB",
  },
  senderText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
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
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
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
    fontWeight: "700",
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
    fontWeight: "500",
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
    fontWeight: "600",
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
    fontWeight: "600",
    color: "#6B7280",
  },
  confirmButton: {
    backgroundColor: "#0EA5E9",
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
