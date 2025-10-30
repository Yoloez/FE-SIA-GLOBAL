import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

interface User {
  id: number;
  name: string;
  email: string;
}
interface Subject {
  id_subject: number;
  name_subject: string;
}
interface AcademicPeriod {
  id: number;
  name: string;
}
export interface ClassItem {
  id_class: number;
  code_class: string;
  subject: Subject;
  academic_period: AcademicPeriod;
  students: User[];
  lecturers: User[];
  member_class: number;
  schedule: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const menuItems: MenuItem[] = [
  { id: "1", title: "Tambah Mata Kuliah", icon: "book-outline", route: "/(manager)/CreateSubjects" },
  { id: "2", title: "Buat Kelas", icon: "school-outline", route: "/(manager)/CreateClasses" },
  { id: "3", title: "Tambah Dosen", icon: "person-add-outline", route: "/(manager)/CreateLecturer" },
  { id: "4", title: "Tambah Mahasiswa", icon: "people-outline", route: "/(manager)/CreateStudent" },
];

export default function ManagerDashboardScreen() {
  const { token, logout } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;
  const [search, setSearch] = useState("");
  const isAnimating = useRef(false);
  const isMounted = useRef(true); // Track component mount status
  const searchTimeoutRef = useRef<number | null>(null);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
      // Cleanup animation
      slideAnim.stopAnimation();
      // Clear search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [slideAnim]);

  const fetchClasses = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.get("/manager/classes");

      if (isMounted.current && response.data && response.data.data) {
        setClasses(response.data.data);
      }
    } catch (error) {
      if (!isMounted.current) return;

      let alertMessage = "Terjadi kesalahan yang tidak diketahui.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Status Kode:", error.response.status);
          console.error("Pesan dari Server:", JSON.stringify(error.response.data, null, 2));
          alertMessage = `Gagal memuat daftar kelas. Server merespons dengan error ${error.response.status}.`;
        } else if (error.request) {
          console.error("Tidak ada respons dari server.");
          alertMessage = "Tidak dapat terhubung ke server. Pastikan Anda berada di jaringan yang sama dan server backend berjalan.";
        } else {
          console.error("Error Axios:", error.message);
          alertMessage = "Terjadi masalah saat menyiapkan permintaan.";
        }
      } else {
        console.error("Error tidak terduga:", error);
      }

      Alert.alert("Error", alertMessage);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, [fetchClasses])
  );

  const openMenu = useCallback(() => {
    if (isAnimating.current) return;

    isAnimating.current = true;
    setMenuVisible(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (isMounted.current) {
        isAnimating.current = false;
      }
    });
  }, [slideAnim]);

  const closeMenu = useCallback(() => {
    if (isAnimating.current) return;

    isAnimating.current = true;

    Animated.timing(slideAnim, {
      toValue: -width * 0.75,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (isMounted.current) {
        setMenuVisible(false);
        isAnimating.current = false;
      }
    });
  }, [slideAnim]);

  const handleMenuItemPress = useCallback(
    (route: string) => {
      if (isAnimating.current) return;

      closeMenu();
      setTimeout(() => {
        if (isMounted.current) {
          try {
            router.push(route as any);
          } catch (error) {
            console.error("Navigation error:", error);
            Alert.alert("Error", "Gagal membuka halaman. Silakan coba lagi.");
          }
        }
      }, 300);
    },
    [closeMenu]
  );

  const handleLogout = useCallback(() => {
    Alert.alert("Konfirmasi Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          closeMenu();
          setTimeout(() => {
            if (isMounted.current) {
              logout();
            }
          }, 300);
        },
      },
    ]);
  }, [logout, closeMenu]);

  const filteredClasses = useMemo(() => {
    if (!search.trim()) return classes;
    const q = search.toLowerCase();
    return classes.filter((c) => c.subject.name_subject.toLowerCase().includes(q) || c.code_class.toLowerCase().includes(q) || c.academic_period.name.toLowerCase().includes(q));
  }, [classes, search]);

  const handleDeleteClass = useCallback(
    (classId: number, className: string) => {
      Alert.alert("Konfirmasi Hapus", `Apakah Anda yakin ingin menghapus kelas "${className}"? Tindakan ini tidak dapat dibatalkan.`, [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/manager/classes/${classId}`);
              if (isMounted.current) {
                Alert.alert("Sukses", "Kelas berhasil dihapus.");
                fetchClasses();
              }
            } catch (error) {
              if (axios.isAxiosError(error)) {
                console.error("Gagal menghapus kelas:", error.response?.data);
              }
              if (isMounted.current) {
                Alert.alert("Gagal", "Gagal menghapus kelas.");
              }
            }
          },
        },
      ]);
    },
    [fetchClasses]
  );

  const renderItem = useCallback(
    ({ item }: { item: ClassItem }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          try {
            router.push(`/(manager)/${item.id_class}`);
          } catch (error) {
            console.error("Navigation error:", error);
            Alert.alert("Error", "Gagal membuka detail kelas. Silakan coba lagi.");
          }
        }}
        activeOpacity={0.9}
      >
        <View style={styles.cardPattern}>
          {/* Simplified pattern - reduced from 24 to 12 circles */}
          {[...Array(12)].map((_, i) => {
            const row = Math.floor(i / 4);
            const col = i % 4;
            const isEven = (row + col) % 2 === 0;

            return (
              <View
                key={i}
                style={[
                  styles.patternCircleContainer,
                  {
                    left: col * 25 + "%",
                    top: row * 33.33 + "%",
                  } as any,
                ]}
              >
                <View style={[styles.patternCircle, isEven && styles.patternCircleAlt]} />
              </View>
            );
          })}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Kelas</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteClass(item.id_class, `${item.subject.name_subject} - Kelas ${item.code_class}`)} style={styles.deleteIconNew} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="trash-bin-outline" size={20} color="red" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardInfo}>
            <Text style={{ fontSize: 15, fontWeight: "500" }} numberOfLines={2}>
              Jumlah Mahasiswa: {item.member_class}
            </Text>
            <Text style={styles.cardTitleNew} numberOfLines={2}>
              {item.subject.name_subject}
            </Text>
            <Text style={styles.cardSubtitle}>Kelas {item.code_class}</Text>
            <Text style={styles.cardPeriodNew}>{item.academic_period.name}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleDeleteClass]
  );

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari mata kuliah..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={(text) => {
            // Clear existing timeout
            if (searchTimeoutRef.current) {
              clearTimeout(searchTimeoutRef.current);
            }
            // Set new timeout to debounce search
            searchTimeoutRef.current = setTimeout(() => {
              setSearch(text);
            }, 300);
          }}
        />
        <Ionicons name="search" size={20} color="#015023" style={styles.searchIcon} />
      </View>
    ),
    [search]
  );

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons name="school-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Belum ada kelas yang dibuat.</Text>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          title: "Dashboard Manajer",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Hamburger Menu Modal */}
      {menuVisible && (
        <SafeAreaView edges={["top", "left", "right"]}>
          <Modal visible={menuVisible} transparent animationType="none" onRequestClose={closeMenu} statusBarTranslucent>
            <View style={styles.modalContainer}>
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeMenu} />
              <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.menuHeader}>
                  <Text style={styles.menuHeaderText}>Menu</Text>
                  <TouchableOpacity onPress={closeMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={28} color="#015023" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
                  {menuItems.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleMenuItemPress(item.route)} activeOpacity={0.7}>
                      <View style={styles.menuIconContainer}>
                        <Ionicons name={item.icon} size={24} color="#015023" />
                      </View>
                      <Text style={styles.menuItemText}>{item.title}</Text>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                  <Ionicons name="log-out-outline" size={20} color="#015023" />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>

                <View style={styles.menuFooter}>
                  <Text style={styles.menuFooterText}>Dashboard Manajer SIA UGN</Text>
                </View>
              </Animated.View>
            </View>
          </Modal>
        </SafeAreaView>
      )}

      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredClasses}
            renderItem={renderItem}
            keyExtractor={(item) => `class-${item.id_class}`}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={100}
            initialNumToRender={5}
            windowSize={5}
            getItemLayout={(data, index) => ({
              length: 200,
              offset: 200 * index,
              index,
            })}
          />
        )}
      </View>
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
    backgroundColor: "#015023",
    paddingHorizontal: 20,
  },
  menuButton: {
    paddingLeft: 15,
    paddingRight: 10,
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
    fontWeight: "bold",
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
    fontWeight: "500",
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
  logoutButton: {
    backgroundColor: "#FFD43B",
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
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  logoutButtonText: {
    color: "#015023",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  card: {
    borderRadius: 20,
    marginBottom: 20,
    height: 180,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    overflow: "hidden",
    position: "relative",
  },
  cardPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#E8D9B8",
    overflow: "hidden",
  },
  patternCircleContainer: {
    position: "absolute",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  patternCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(169, 191, 167, 0.3)",
    borderWidth: 15,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  patternCircleAlt: {
    backgroundColor: "rgba(169, 191, 167, 0.4)",
    borderColor: "rgba(169, 191, 167, 0.2)",
  },
  cardContent: {
    flex: 1,
    padding: 20,
    position: "relative",
    zIndex: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteIconNew: {
    backgroundColor: "white",
    padding: 8,
    borderRadius: 20,
  },
  cardInfo: {
    flex: 1,
    justifyContent: "flex-end",
  },
  cardTitleNew: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  cardPeriodNew: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
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
    fontWeight: "500",
  },
  searchWrapper: {
    marginHorizontal: 0,
    marginBottom: 12,
    position: "relative",
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: 11,
  },
});
