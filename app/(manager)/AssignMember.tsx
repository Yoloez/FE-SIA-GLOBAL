import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

const IP_ADDRESS = "192.168.0.159";
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

// Interface untuk mendefinisikan bentuk objek User
interface User {
  id: number;
  name: string;
  email: string;
}

export default function AssignMemberScreen() {
  // Mengambil parameter dari URL dengan tipe data yang jelas
  const { classId, role } = useLocalSearchParams<{ classId: string; role: "dosen" | "student" }>();
  const { token } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState<number | null>(null);

  // Mengambil daftar pengguna (dosen/mahasiswa) dari API saat halaman dimuat
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token || !role) return;
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/manager/users-by-role?role=${role}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data.data);
      } catch (error) {
        console.error("Fetch Users Error:", error);
        Alert.alert("Error", "Gagal memuat daftar pengguna.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [token, role]);

  // Fungsi untuk menangani saat seorang pengguna dipilih untuk ditambahkan
  const handleAssign = async (userId: number) => {
    setIsAssigning(userId);
    const endpoint = role === "dosen" ? "lecturers" : "students";
    try {
      await axios.post(`${API_BASE_URL}/manager/classes/${classId}/${endpoint}`, { user_si_id: userId }, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert("Sukses", `${role === "dosen" ? "Dosen" : "Mahasiswa"} berhasil ditambahkan.`);
      router.back(); // Kembali ke halaman detail setelah berhasil
    } catch (error) {
      // <-- PERBAIKAN: Menambahkan kurung kurawal
      const message = `Gagal menambahkan ${role}.`;
      Alert.alert("Gagal", message);
    } finally {
      // <-- PERBAIKAN: Menambahkan kurung kurawal
      setIsAssigning(null);
    }
  };

  // Komponen untuk merender setiap item pengguna
  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => handleAssign(item.id)} disabled={!!isAssigning}>
      <View>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      {/* Tampilkan loading indicator spesifik untuk item yang sedang diproses */}
      {isAssigning === item.id ? <ActivityIndicator color="#015023" /> : <Ionicons name="add-circle-outline" size={24} color="#015023" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: `Pilih ${role === "dosen" ? "Dosen" : "Mahasiswa"}` }} />
      {isLoading ? (
        <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.container}
          ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada {role} yang tersedia untuk ditambahkan.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9f9f9" },
  container: { paddingVertical: 10 },
  userCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    marginHorizontal: 10,
    elevation: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  userName: { fontSize: 16, fontWeight: "bold" },
  userEmail: { fontSize: 14, color: "#666" },
  emptyText: { textAlign: "center", marginTop: 50, color: "#999", fontSize: 16 },
});
