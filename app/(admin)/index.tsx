import axios from "axios";
import { Stack, router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

// Definisikan IP dan URL API Anda
const IP_ADDRESS = "192.168.0.159"; // Ganti dengan IP Address laptop Anda
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

// Tipe data untuk objek manajer yang diterima dari API
interface Manager {
  id: number;
  name: string;
  email: string;
}

export default function AdminDashboardScreen() {
  const { logout, token } = useAuth(); // Ambil token untuk otentikasi
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk mengambil data manajer dari server
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
      //   alert("Gagal memuat data manajer.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Gunakan useFocusEffect untuk mengambil data setiap kali layar ini dibuka/kembali
  // Ini memastikan daftar akan diperbarui setelah Anda menambah manajer baru
  useFocusEffect(
    useCallback(() => {
      fetchManagers();
    }, [fetchManagers])
  );

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Komponen untuk merender setiap item manajer di dalam daftar
  const renderManagerItem = ({ item }: { item: Manager }) => (
    <View style={styles.managerCard}>
      <View>
        <Text style={styles.managerName}>{item.name}</Text>
        <Text style={styles.managerEmail}>{item.email}</Text>
      </View>
      {/* Di sini Anda bisa menambahkan tombol Edit/Delete nanti */}
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
        }}
      />

      <View style={styles.container}>
        {/* Bagian Atas: Tombol Aksi */}
        <Text style={styles.title}>Selamat Datang, Admin!</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push("./AddManager")}>
          <Text style={styles.buttonText}>Tambah Akun Manajer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonLogout} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>

        {/* Bagian Bawah: Daftar Manajer */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Daftar Manajer</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#015023" style={{ marginTop: 20 }} />
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
    backgroundColor: "#f0f4f7",
  },
  container: {
    flex: 1,
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
  buttonLogout: {
    backgroundColor: "#B00020",
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
    elevation: 3,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  // Style baru untuk daftar manajer
  listContainer: {
    flex: 1,
    width: "100%",
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
  },
  managerCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
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
    color: "#666",
    fontSize: 16,
  },
});
