import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, FlatList, ImageBackground, Modal, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import CustomAlert from "../../components/CustomAlert";
import { ThemedText } from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";
import { handleApiError, isAbortError } from "../../utils/errorHandler";

const { width } = Dimensions.get("window");

interface ClassItem {
  id_class: number;
  code_class: string;
  name_subject: string;
  code_subject: string;
  academic_period_name: string;
  member_class: number;
  total_students: number;
  schedule: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: "1", title: "Tambah Mata Kuliah", icon: "book-outline", route: "/subjects" },
  { id: "2", title: "Tambah Kelas", icon: "school-outline", route: "/classes" },
  { id: "3", title: "Tambah Dosen", icon: "person-add-outline", route: "/lecturers" },
  { id: "4", title: "Tambah Mahasiswa", icon: "people-outline", route: "/students" },
  { id: "5", title: "Buat Pengumuman", icon: "notifications-outline", route: "/Notification" },
  { id: "6", title: "Profil Saya", icon: "person-outline", route: "/Profil" },
];

// Optimalisasi: Konstanta untuk RecyclerView-like behavior
const ITEM_HEIGHT = 205;
const VIEWPORT_ITEMS = 5; // Jumlah item yang terlihat di layar

// Memoized Card Component - seperti ViewHolder di RecyclerView
const ClassCard = React.memo<{
  item: ClassItem;
  onToggleActive: (id: number, status: boolean, name: string) => void;
}>(
  ({ item, onToggleActive }) => {
    const handlePress = useCallback(() => {
      router.push(`/classes/${item.id_class}`);
    }, [item.id_class]);

    const handleToggle = useCallback(
      (e: any) => {
        e.stopPropagation();
        onToggleActive(item.id_class, item.is_active || false, `${item.name_subject} - ${item.code_class}`);
      },
      [item.id_class, item.is_active, item.name_subject, item.code_class, onToggleActive]
    );

    return (
      <ImageBackground source={require("../../assets/images/batik.png")} style={[styles.card, { height: ITEM_HEIGHT }]} imageStyle={styles.cardImage} resizeMode="cover">
        <TouchableOpacity style={styles.cardContent} onPress={handlePress} activeOpacity={0.9}>
          <View style={styles.cardTop}>
            <View style={styles.badge}>
              <ThemedText variant="semibold" style={styles.badgeText}>
                Kelas
              </ThemedText>
            </View>

            <View style={styles.actionButtons}>
              <View style={[styles.statusBadge, { backgroundColor: item.is_active ? "#d1fae5" : "#fee2e2" }]}>
                <ThemedText variant="medium" style={[styles.statusText, { color: item.is_active ? "#065f46" : "#991b1b" }]}>
                  {item.is_active ? "Aktif" : "Nonaktif"}
                </ThemedText>
              </View>

              <TouchableOpacity onPress={handleToggle} style={[styles.toggleBtn, { backgroundColor: item.is_active ? "#10b981" : "#6b7280" }]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={item.is_active ? "checkmark-circle" : "close-circle"} size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardInfo}>
            <ThemedText variant="medium" style={styles.memberText}>
              Kapasitas: {item.total_students || 0}/{item.member_class} mahasiswa
            </ThemedText>
            <ThemedText variant="bold" style={styles.cardTitle} numberOfLines={2}>
              {item.name_subject || "Mata Kuliah"}
            </ThemedText>
            <ThemedText style={styles.cardSubtitle}>Kelas {item.code_class}</ThemedText>
            {item.schedule && (
              <ThemedText variant="semibold" style={styles.cardSchedule}>
                {item.schedule}
              </ThemedText>
            )}
            <ThemedText variant="medium" style={styles.cardPeriod}>
              {item.academic_period_name}
            </ThemedText>
          </View>
        </TouchableOpacity>
      </ImageBackground>
    );
  },
  (prev, next) => {
    // Custom comparison untuk menghindari re-render yang tidak perlu
    return prev.item.id_class === next.item.id_class && prev.item.is_active === next.item.is_active && prev.item.total_students === next.item.total_students;
  }
);

ClassCard.displayName = "ClassCard";

export default function ManagerDashboardScreen() {
  const { logout } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");
  const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [] as { text: string; onPress: () => void; style?: "cancel" | "destructive" }[],
  });

  // Ref untuk tracking animation state
  const isAnimatingRef = useRef(false);
  const navigationTimeoutRef = useRef<number | null>(null);

  // CRITICAL: Interaction manager untuk prevent rapid clicks
  const isInteractingRef = useRef(false);
  const lastInteractionTimeRef = useRef(0);
  const menuStateRef = useRef(false); // Track menu state
  const DEBOUNCE_DELAY = 300; // ms

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
      // Stop animation immediately
      slideAnim.stopAnimation();
      // Clear any pending navigation
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      // Abort any ongoing API calls
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Reset all interaction flags
      isAnimatingRef.current = false;
      isInteractingRef.current = false;
      menuStateRef.current = false;
    };
  }, [slideAnim]);

  // Ref untuk prevent double fetch
  const isFetchingRef = useRef(false);

  const fetchClasses = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (typeof AbortController !== "undefined") {
      abortControllerRef.current = new AbortController();
    }

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const response = await api.get("/manager/classes", {
        signal: abortControllerRef.current?.signal,
      });

      if (isMounted.current) {
        const validClasses = (response.data.data || []).filter((item: ClassItem) => item && item.name_subject && item.code_class && item.academic_period_name);
        setClasses(validClasses);
      }
    } catch (error) {
      if (!isMounted.current || isAbortError(error)) return;

      const apiError = handleApiError(error);
      if (isMounted.current) {
        setAlertConfig({
          visible: true,
          title: "Error",
          message: apiError.message,
          buttons: [{ text: "OK", onPress: () => {} }],
        });
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, []); // EMPTY dependency - stable reference

  const handleToggleActive = useCallback(
    (id: number, currentStatus: boolean, name: string) => {
      // CRITICAL: Debounce check for rapid toggle clicks
      const now = Date.now();
      if (now - lastInteractionTimeRef.current < DEBOUNCE_DELAY) {
        console.log("[MANAGER DASHBOARD] Toggle debounced - ignoring rapid click");
        return;
      }
      lastInteractionTimeRef.current = now;

      if (!isMounted.current) {
        console.warn("[MANAGER DASHBOARD] Component unmounted, toggle cancelled");
        return;
      }

      if (isInteractingRef.current) {
        console.log("[MANAGER DASHBOARD] Interaction in progress, toggle blocked");
        return;
      }

      const newStatus = !currentStatus;
      const statusText = newStatus ? "aktif" : "nonaktif";

      setAlertConfig({
        visible: true,
        title: "Konfirmasi Status",
        message: `Ubah status kelas "${name}" menjadi ${statusText}?`,
        buttons: [
          { text: "Batal", onPress: () => {}, style: "cancel" },
          {
            text: "Ubah",
            onPress: async () => {
              try {
                await api.patch(`/manager/classes/${id}/toggle-status`, {
                  is_active: newStatus,
                });
                if (isMounted.current) {
                  setAlertConfig({
                    visible: true,
                    title: "Sukses",
                    message: `Status kelas berhasil diubah menjadi ${statusText}.`,
                    buttons: [{ text: "OK", onPress: () => {} }],
                  });
                  // Call fetchClasses directly - stable reference
                  fetchClasses();
                }
              } catch (error) {
                if (isMounted.current) {
                  const apiError = handleApiError(error);
                  setAlertConfig({
                    visible: true,
                    title: "Gagal",
                    message: apiError.message,
                    buttons: [{ text: "OK", onPress: () => {} }],
                  });
                }
              }
            },
          },
        ],
      });
    },
    [] // EMPTY dependency - fetchClasses is stable
  );

  // STABLE useFocusEffect - tidak akan trigger re-render loop
  useFocusEffect(
    useCallback(() => {
      if (isMounted.current && !isFetchingRef.current) {
        fetchClasses();
      }
      // fetchClasses has STABLE reference (empty deps), so this callback is also stable
    }, []) // EMPTY dependency - stable callback
  );

  const toggleMenu = useCallback(
    (open: boolean) => {
      // CRITICAL: Debounce check
      const now = Date.now();
      if (now - lastInteractionTimeRef.current < DEBOUNCE_DELAY) {
        console.log("[MANAGER DASHBOARD] Debounced - ignoring rapid toggle");
        return;
      }
      lastInteractionTimeRef.current = now;

      if (!isMounted.current) {
        console.warn("[MANAGER DASHBOARD] Component unmounted, toggle cancelled");
        return;
      }

      // CRITICAL: Check if already in desired state
      if (menuStateRef.current === open) {
        console.log("[MANAGER DASHBOARD] Menu already in state:", open);
        return;
      }

      // CRITICAL: Global interaction lock
      if (isInteractingRef.current || isAnimatingRef.current) {
        console.log("[MANAGER DASHBOARD] Interaction/Animation locked, skipping");
        return;
      }

      console.log("[MANAGER DASHBOARD] Toggle menu:", open);

      // Lock all interactions
      isInteractingRef.current = true;
      isAnimatingRef.current = true;
      menuStateRef.current = open;

      // Set modal visibility BEFORE animation for opening, AFTER for closing
      if (open) {
        setMenuVisible(true);
      }

      Animated.timing(slideAnim, {
        toValue: open ? 0 : -width * 0.75,
        duration: 250,
        useNativeDriver: true,
      }).start(({ finished }) => {
        console.log("[MANAGER DASHBOARD] Animation finished:", finished);

        if (!isMounted.current) {
          console.warn("[MANAGER DASHBOARD] Component unmounted during animation");
          return;
        }

        // Unlock interactions
        isAnimatingRef.current = false;

        // Small delay to prevent immediate re-trigger
        setTimeout(() => {
          if (isMounted.current) {
            isInteractingRef.current = false;
          }
        }, 10);

        // Hide modal after closing animation
        if (!open && finished) {
          setMenuVisible(false);
        }
      });
    },
    [slideAnim]
  );

  const handleMenuNav = useCallback(
    (route: string) => {
      if (!isMounted.current) {
        console.warn("[MANAGER DASHBOARD] Component unmounted, navigation cancelled");
        return;
      }

      console.log("[MANAGER DASHBOARD] Menu navigation to:", route);

      // Clear any existing navigation timeout
      if (navigationTimeoutRef.current) {
        console.log("[MANAGER DASHBOARD] Clearing existing navigation timeout");
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }

      try {
        // Tutup menu dengan animation (will handle locking)
        toggleMenu(false);

        // CRITICAL: Wait for animation (250ms) + buffer (150ms) = 400ms
        navigationTimeoutRef.current = setTimeout(() => {
          if (!isMounted.current) {
            console.warn("[MANAGER DASHBOARD] Component unmounted, navigation cancelled");
            return;
          }

          try {
            console.log("[MANAGER DASHBOARD] Executing navigation to:", route);
            router.push(route as any);
          } catch (navError) {
            console.error("[MANAGER DASHBOARD] Navigation error:", navError);
            if (isMounted.current) {
              setAlertConfig({
                visible: true,
                title: "Error",
                message: "Gagal membuka halaman. Silakan coba lagi.",
                buttons: [{ text: "OK", onPress: () => {} }],
              });
            }
          } finally {
            navigationTimeoutRef.current = null;
          }
        }, 400); // Increased to 400ms for safety
      } catch (error) {
        console.error("[MANAGER DASHBOARD] Menu toggle error:", error);
        if (isMounted.current) {
          setAlertConfig({
            visible: true,
            title: "Error",
            message: "Terjadi kesalahan. Silakan coba lagi.",
            buttons: [{ text: "OK", onPress: () => {} }],
          });
        }
      }
    },
    [toggleMenu]
  );

  const handleLogout = useCallback(() => {
    if (!isMounted.current) return;

    setAlertConfig({
      visible: true,
      title: "Konfirmasi Logout",
      message: "Yakin ingin keluar?",
      buttons: [
        { text: "Batal", onPress: () => {}, style: "cancel" },
        {
          text: "Logout",
          onPress: () => {
            if (!isMounted.current) return;

            // Clear any pending navigation
            if (navigationTimeoutRef.current) {
              clearTimeout(navigationTimeoutRef.current);
              navigationTimeoutRef.current = null;
            }

            // Stop animation
            slideAnim.stopAnimation();

            // Close menu immediately
            setMenuVisible(false);
            slideAnim.setValue(-width * 0.75);

            // Logout dengan slight delay untuk UI cleanup
            setTimeout(() => {
              if (isMounted.current) {
                logout();
              }
            }, 100);
          },
          style: "destructive",
        },
      ],
    });
  }, [logout, slideAnim]);

  // Optimalisasi filtering dengan useMemo
  const filteredClasses = useMemo(() => {
    if (!search.trim()) return classes;
    const q = search.toLowerCase();
    return classes.filter((c) => c.name_subject?.toLowerCase().includes(q) || c.code_class?.toLowerCase().includes(q) || c.academic_period_name?.toLowerCase().includes(q) || c.code_subject?.toLowerCase().includes(q));
  }, [classes, search]);

  // Render item dengan memoized component
  const renderItem = useCallback(({ item }: { item: ClassItem }) => <ClassCard item={item} onToggleActive={handleToggleActive} />, [handleToggleActive]);

  // Key extractor yang stabil
  const keyExtractor = useCallback((item: ClassItem) => `class-${item.id_class}`, []);

  // getItemLayout untuk performa optimal (seperti RecyclerView)
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // Empty component yang di-memoize
  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons name="school-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
        <ThemedText variant="medium" style={styles.emptyText}>
          Belum ada kelas yang dibuat.
        </ThemedText>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#015023" />

      <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => toggleMenu(true)} style={styles.menuButton} activeOpacity={0.7}>
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <ThemedText variant="bold" style={styles.headerTitle}>
            Dashboard Manager
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={20} color="#015023" style={styles.searchIcon} />
            <TextInput style={styles.searchInput} placeholder="Cari mata kuliah..." placeholderTextColor="#999" value={search} onChangeText={setSearch} />
          </View>
        </View>

        {/* Main Content dengan RecyclerView-like optimization */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DABC4E" />
            <ThemedText style={styles.loadingText}>Memuat data...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredClasses}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            // RecyclerView-like optimizations - AGGRESSIVE
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            updateCellsBatchingPeriod={100}
            initialNumToRender={3}
            windowSize={5}
            // Performance optimizations
            onEndReachedThreshold={0.5}
            // Disable maintainVisibleContentPosition - can cause issues
            // Disable scrolling during menu animation
            scrollEnabled={!menuVisible}
          />
        )}
      </LinearGradient>

      {/* Hamburger Menu */}
      {menuVisible && (
        <Modal visible transparent animationType="none" onRequestClose={() => toggleMenu(false)} statusBarTranslucent>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => toggleMenu(false)} />
            <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
              <View style={styles.menuHeader}>
                <ThemedText variant="bold" style={styles.menuHeaderText}>
                  Menu
                </ThemedText>
                <TouchableOpacity onPress={() => toggleMenu(false)} activeOpacity={0.7}>
                  <Ionicons name="close" size={28} color="#015023" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
                {MENU_ITEMS.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleMenuNav(item.route)} activeOpacity={0.7}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon} size={24} color="#015023" />
                    </View>
                    <ThemedText variant="semibold" style={styles.menuItemText}>
                      {item.title}
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={20} color="#015023" />
                <ThemedText variant="semibold" style={styles.logoutButtonText}>
                  Logout
                </ThemedText>
              </TouchableOpacity>

              <View style={styles.menuFooter}>
                <ThemedText style={styles.menuFooterText}>Dashboard Manajer SIA UGN</ThemedText>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} buttons={alertConfig.buttons} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#015023",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 40,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    fontFamily: "Urbanist",
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: "center",
    color: "#fff",
    marginTop: 16,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 20,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardImage: {
    borderRadius: 20,
    opacity: 1,
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "#DABC4E",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: "#015023",
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
  },
  toggleBtn: {
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  cardInfo: {
    flex: 1,
    justifyContent: "flex-start",
  },
  memberText: {
    fontSize: 13,
    marginBottom: 8,
    color: "#2C3E50",
  },
  cardTitle: {
    fontSize: 18,
    color: "#2C3E50",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
  },
  cardSchedule: {
    fontSize: 13,
    color: "#DABC4E",
    marginBottom: 4,
  },
  cardPeriod: {
    fontSize: 13,
    color: "#666",
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.75,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    marginTop: 12,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  menuHeaderText: {
    fontSize: 24,
    color: "#015023",
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f8f4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  logoutButton: {
    backgroundColor: "#DABC4E",
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutButtonText: {
    color: "#015023",
    fontSize: 16,
    marginLeft: 8,
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "center",
  },
  menuFooterText: {
    fontSize: 12,
    color: "#999",
  },
});
