import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface StaffProfile {
  employee_id_number: string;
}

interface Manager {
  id: number;
  name: string;
  email: string;
  staff_profile: StaffProfile | null;
}

export default function AdminDashboardScreen() {
  const { logout } = useAuth();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = useCallback(() => {
    Alert.alert("Konfirmasi Logout", "Apakah Anda yakin ingin keluar?", [
      {
        text: "Batal",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  }, [logout]);

  const fetchManagers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/admin/managers");
      setManagers(response.data.data);
    } catch (error) {
      console.error("Gagal mengambil data manajer:", error);
      Alert.alert("Error", "Gagal mengambil data manajer");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchManagers();
    }, [fetchManagers])
  );

  const handleDeleteManager = useCallback(
    (managerId: number, managerName: string) => {
      Alert.alert("Konfirmasi Hapus", `Apakah Anda yakin ingin menghapus manajer "${managerName}"? Tindakan ini tidak dapat dibatalkan.`, [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/managers/${managerId}`);
              Alert.alert("Sukses", "Manajer berhasil dihapus.");
              fetchManagers();
            } catch (error) {
              if (axios.isAxiosError(error)) console.error("Gagal menghapus manajer:", error.response?.data);
              Alert.alert("Gagal", "Gagal menghapus manajer.");
            }
          },
        },
      ]);
    },
    [fetchManagers]
  );

  // Filter managers based on search query
  const filteredManagers = useMemo(() => {
    if (!searchQuery.trim()) {
      return managers;
    }

    const query = searchQuery.toLowerCase();
    return managers.filter((manager) => manager.name.toLowerCase().includes(query) || manager.email.toLowerCase().includes(query) || manager.staff_profile?.employee_id_number?.toLowerCase().includes(query));
  }, [managers, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const renderManagerItem = useCallback(
    ({ item }: { item: Manager }) => (
      <View style={styles.managerCard}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Image source={require("../../assets/images/kairi.png")} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.managerName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.managerEmail} numberOfLines={1}>
              {item.email}
            </Text>
            <Text style={styles.managerEmail}>{item.staff_profile?.employee_id_number || "NIP: Belum diatur"}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create-outline" size={22} color="#015023" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteManager(item.id, item.name)}>
            <Ionicons name="trash-outline" size={22} color="#B00020" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleDeleteManager]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Admin Dashboard",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
              <Ionicons name="log-out-outline" size={26} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput style={styles.searchInput} placeholder="Cari manajer (nama, email, NIP)..." placeholderTextColor="#999" value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" autoCorrect={false} />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Daftar Manajer */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listTitle}>Daftar Manajer</Text>
              {searchQuery.length > 0 && <Text style={styles.resultCount}>{filteredManagers.length} hasil ditemukan</Text>}
            </View>
            <TouchableOpacity onPress={() => router.push("/(admin)/AddManager")} style={styles.addButton}>
              <Ionicons name="add-circle-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Memuat data...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredManagers}
              renderItem={renderManagerItem}
              keyExtractor={(item) => `manager-${item.id}`}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name={searchQuery ? "search-outline" : "people-outline"} size={64} color="#ccc" />
                  <Text style={styles.emptyText}>{searchQuery ? `Tidak ada manajer yang cocok dengan "${searchQuery}"` : "Belum ada manajer yang ditambahkan."}</Text>
                  {searchQuery && (
                    <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                      <Text style={styles.clearSearchText}>Hapus Pencarian</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
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
    padding: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 5,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  resultCount: {
    fontSize: 14,
    color: "#FFD43B",
    marginTop: 4,
  },
  addButton: {
    padding: 5,
  },
  managerCard: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5EFD3",
    borderRadius: 16,
    borderColor: "#333",
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  managerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  managerEmail: {
    fontSize: 13,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 18,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginTop: 16,
    color: "#ffffff",
    fontSize: 16,
    paddingHorizontal: 20,
  },
  clearSearchButton: {
    marginTop: 20,
    backgroundColor: "#FFD43B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearSearchText: {
    color: "#015023",
    fontSize: 14,
    fontWeight: "600",
  },
});
