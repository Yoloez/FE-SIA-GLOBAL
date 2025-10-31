import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, ImageBackground, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

interface Subject {
  id_subject: number;
  name_subject: string;
}
interface AcademicPeriod {
  id: number;
  name: string;
}
interface ClassItem {
  id_class: number;
  code_class: string;
  subject: Subject;
  academic_period: AcademicPeriod;
  member_class: number;
}

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: "1", title: "Tambah Mata Kuliah", icon: "book-outline", route: "/(admin)/CreateSubjects" },
  { id: "2", title: "Buat Kelas", icon: "school-outline", route: "/(admin)/CreateClasses" },
  { id: "3", title: "Tambah Dosen", icon: "person-add-outline", route: "/(admin)/CreateLecturer" },
  { id: "4", title: "Tambah Mahasiswa", icon: "people-outline", route: "/(admin)/CreateStudent" },
  { id: "5", title: "List Manager", icon: "id-card-outline", route: "/(admin)/ListManager" },
];

const ITEM_HEIGHT = 210;
const CARD_STYLE = { height: ITEM_HEIGHT };

export default function ManagerDashboardScreen() {
  const { logout } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");
  const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;
  const isMounted = useRef(true);

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
      slideAnim.stopAnimation();
    };
  }, []);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/manager/classes");
      if (isMounted.current) {
        setClasses(response.data.data || []);
      }
    } catch (error) {
      if (!isMounted.current) return;

      const message = axios.isAxiosError(error) ? (error.response ? `Gagal memuat kelas. Error ${error.response.status}.` : "Tidak dapat terhubung ke server.") : "Terjadi kesalahan.";

      Alert.alert("Error", message);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, [fetchClasses])
  );

  const toggleMenu = useCallback(
    (open: boolean) => {
      setMenuVisible(open);
      Animated.timing(slideAnim, {
        toValue: open ? 0 : -width * 0.75,
        duration: 250,
        useNativeDriver: true,
      }).start();
    },
    [slideAnim]
  );

  const handleMenuNav = useCallback(
    (route: string) => {
      toggleMenu(false);
      setTimeout(() => router.push(route as any), 300);
    },
    [toggleMenu]
  );

  const handleLogout = useCallback(() => {
    Alert.alert("Konfirmasi Logout", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          toggleMenu(false);
          setTimeout(logout, 300);
        },
      },
    ]);
  }, [logout, toggleMenu]);

  const handleDelete = useCallback(
    (id: number, name: string) => {
      Alert.alert("Konfirmasi Hapus", `Hapus kelas "${name}"?`, [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/manager/classes/${id}`);
              Alert.alert("Sukses", "Kelas berhasil dihapus.");
              fetchClasses();
            } catch (error) {
              Alert.alert("Gagal", "Gagal menghapus kelas.");
            }
          },
        },
      ]);
    },
    [fetchClasses]
  );

  const filteredClasses = useMemo(() => {
    if (!search.trim()) return classes;
    const q = search.toLowerCase();
    return classes.filter((c) => c.subject.name_subject.toLowerCase().includes(q) || c.code_class.toLowerCase().includes(q) || c.academic_period.name.toLowerCase().includes(q));
  }, [classes, search]);

  const renderItem = useCallback(
    ({ item }: { item: ClassItem }) => (
      <ImageBackground source={require("../../assets/images/batik.png")} style={[styles.card, CARD_STYLE]} imageStyle={styles.cardImage}>
        <TouchableOpacity style={styles.cardContent} onPress={() => router.push(`/(admin)/${item.id_class}`)} activeOpacity={0.9}>
          <View style={styles.cardTop}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Kelas</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id_class, `${item.subject.name_subject} - ${item.code_class}`)} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="trash-bin-outline" size={20} color="red" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.memberText}>Kapasitas: {item.member_class} mahasiswa</Text>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.subject.name_subject}
            </Text>
            <Text style={styles.cardSubtitle}>Kelas {item.code_class}</Text>
            <Text style={styles.cardPeriod}>{item.academic_period.name}</Text>
          </View>
        </TouchableOpacity>
      </ImageBackground>
    ),
    [handleDelete]
  );

  const keyExtractor = useCallback((item: ClassItem) => `class-${item.id_class}`, []);

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
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
            <TouchableOpacity onPress={() => toggleMenu(true)} style={styles.menuButton}>
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Hamburger Menu */}
      {menuVisible && (
        <Modal visible transparent animationType="none" onRequestClose={() => toggleMenu(false)} statusBarTranslucent>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => toggleMenu(false)} />
            <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuHeaderText}>Menu</Text>
                <TouchableOpacity onPress={() => toggleMenu(false)}>
                  <Ionicons name="close" size={28} color="#015023" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
                {MENU_ITEMS.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleMenuNav(item.route)}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon} size={24} color="#015023" />
                    </View>
                    <Text style={styles.menuItemText}>{item.title}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#015023" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>

              <View style={styles.menuFooter}>
                <Text style={styles.menuFooterText}>Dashboard Manajer SIA UGN</Text>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Main Content */}
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
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            ListHeaderComponent={
              <View style={styles.searchWrapper}>
                <TextInput style={styles.searchInput} placeholder="Cari mata kuliah..." placeholderTextColor="#aaa" value={search} onChangeText={setSearch} />
                <Ionicons name="search" size={20} color="#015023" style={styles.searchIcon} />
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="school-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Belum ada kelas yang dibuat.</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            removeClippedSubviews
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={10}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#015023" },
  container: { flex: 1, backgroundColor: "#015023", paddingHorizontal: 20 },
  menuButton: { paddingLeft: 15, paddingRight: 10 },
  modalContainer: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" },
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
  menuHeaderText: { fontSize: 24, fontWeight: "bold", color: "#015023" },
  menuList: { flex: 1 },
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
  menuItemText: { flex: 1, fontSize: 16, color: "#333", fontWeight: "500" },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "center",
  },
  menuFooterText: { fontSize: 12, color: "#999" },
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
  },
  logoutButtonText: { color: "#015023", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  card: {
    borderRadius: 20,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 3,
  },
  cardImage: { borderRadius: 20, opacity: 1 },
  cardContent: { flex: 1, padding: 20 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  badge: { backgroundColor: "#D4AF37", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  badgeText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  deleteBtn: { backgroundColor: "white", padding: 8, borderRadius: 20 },
  cardInfo: {
    flex: 1,
    justifyContent: "flex-start",
    marginTop: 10,
  },
  memberText: { fontSize: 15, fontWeight: "500", marginBottom: 8, color: "#2C3E50" },
  cardTitle: { fontSize: 20, fontWeight: "bold", color: "#2C3E50", marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: "#555", marginBottom: 8 },
  cardPeriod: { fontSize: 13, color: "#666", fontWeight: "500" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 10, color: "#fff", fontSize: 14 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { textAlign: "center", color: "#fff", marginTop: 16, fontSize: 16, fontWeight: "500" },
  searchWrapper: { marginBottom: 12, position: "relative" },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  searchIcon: { position: "absolute", left: 12, top: 11 },
  listContent: { paddingTop: 20, paddingBottom: 2 },
});
