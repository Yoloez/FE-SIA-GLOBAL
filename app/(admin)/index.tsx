import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

const IP_ADDRESS = "192.168.0.159";
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

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
  const { logout, token } = useAuth();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const response = await axios.get(`${API_BASE_URL}/admin/managers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setManagers(response.data.data);
    } catch (error) {
      console.error("Gagal mengambil data manajer:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchManagers();
    }, [fetchManagers])
  );

  const handleDeleteManager = (managerId: number, managerName: string) => {
    Alert.alert("Konfirmasi Hapus", `Apakah Anda yakin ingin menghapus manajer "${managerName}"? Tindakan ini tidak dapat dibatalkan.`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/admin/managers/${managerId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert("Sukses", "Manajer berhasil dihapus.");
            fetchManagers();
          } catch (error) {
            if (axios.isAxiosError(error)) console.error("Gagal menghapus manajer:", error.response?.data);
            Alert.alert("Gagal", "Gagal menghapus manajer.");
          }
        },
      },
    ]);
  };

  const renderManagerItem = ({ item }: { item: Manager }) => (
    <View style={styles.managerCard}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Image source={require("../../assets/images/kairi.png")} style={styles.avatar} />
        <View>
          <Text style={styles.managerName}>{item.name}</Text>
          <Text style={styles.managerEmail}>{item.email}</Text>
          <Text style={styles.managerEmail}>{item.staff_profile?.employee_id_number || "NIP: Belum diatur"}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="create-outline" size={22} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteManager(item.id, item.name)}>
          <Ionicons name="trash-outline" size={22} />
        </TouchableOpacity>
      </View>
    </View>
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
        {/* Bagian Atas: Tombol Aksi */}

        {/* Bagian Bawah: Daftar Manajer */}
        <View style={styles.listContainer}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "white" }}>
            <Text style={styles.listTitle}>Daftar Manajer</Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/AddManager")}>
              <Ionicons name="add-circle-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 20 }} />
          ) : (
            <FlatList data={managers} renderItem={renderManagerItem} keyExtractor={(item) => item.id.toString()} ListEmptyComponent={<Text style={styles.emptyText}>Belum ada manajer yang ditambahkan.</Text>} />
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
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#015023",
    paddingVertical: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
    elevation: 3,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  listContainer: {
    flex: 1,
    width: "100%",
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 15,
  },
  managerCard: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5EFD3",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  managerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  managerEmail: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#ffffff",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "300",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 16,
  },
});
