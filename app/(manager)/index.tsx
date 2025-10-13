import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

// Definisikan IP dan URL API Anda
const IP_ADDRESS = "192.168.0.159"; // Ganti dengan IP Address laptop Anda
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

// --- Perbaikan Interface agar sesuai dengan data dari Laravel ---
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

export default function ManagerDashboardScreen() {
  const { token, logout } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/manager/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setClasses(response.data.data);
    } catch (error) {
      // --- INI BAGIAN PERBAIKANNYA: Penanganan Error yang Lebih Detail ---

      console.error("================ GAGAL MEMUAT KELAS ================");

      let alertMessage = "Terjadi kesalahan yang tidak diketahui.";

      if (axios.isAxiosError(error)) {
        // Jika ini adalah error dari Axios, kita bisa dapat info lebih

        if (error.response) {
          // Server merespons dengan status error (4xx atau 5xx)

          console.error("Status Kode:", error.response.status);

          console.error("Pesan dari Server:", JSON.stringify(error.response.data, null, 2));

          alertMessage = `Gagal memuat daftar kelas. Server merespons dengan error ${error.response.status}.`;
        } else if (error.request) {
          // Request terkirim tapi tidak ada respons (masalah jaringan)

          console.error("Tidak ada respons dari server. Cek koneksi, alamat IP, dan pastikan server Laravel berjalan.");

          alertMessage = "Tidak dapat terhubung ke server. Pastikan Anda berada di jaringan yang sama dan server backend berjalan.";
        } else {
          // Error lain saat menyiapkan request

          console.error("Error Axios:", error.message);

          alertMessage = "Terjadi masalah saat menyiapkan permintaan.";
        }
      } else {
        // Error JavaScript biasa

        console.error("Error tidak terduga:", error);
      }

      alert(alertMessage);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, [fetchClasses])
  );

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // --- KODE BARU: Fungsi untuk menghapus kelas ---
  const handleDeleteClass = (classId: number, className: string) => {
    // Tampilkan dialog konfirmasi untuk mencegah kesalahan
    Alert.alert("Konfirmasi Hapus", `Apakah Anda yakin ingin menghapus kelas "${className}"? Tindakan ini tidak dapat dibatalkan.`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            // Kirim permintaan DELETE ke backend
            await axios.delete(`${API_BASE_URL}/manager/classes/${classId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert("Sukses", "Kelas berhasil dihapus.");
            fetchClasses(); // Muat ulang daftar kelas setelah berhasil
          } catch (error) {
            if (axios.isAxiosError(error)) console.error("Gagal menghapus kelas:", error.response?.data);
            Alert.alert("Gagal", "Gagal menghapus kelas.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ClassItem }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => router.push(`/(manager)/${item.id_class}`)}>
        <View style={styles.cardHeader}>
          {/* Bagian kiri header untuk judul */}
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{`${item.subject.name_subject} - Kelas ${item.code_class}`}</Text>
            <Text style={styles.cardPeriod}>{item.academic_period.name}</Text>
          </View>
          {/* --- KODE BARU: Tombol hapus di kanan header --- */}
          <TouchableOpacity onPress={() => handleDeleteClass(item.id_class, `${item.subject.name_subject} - Kelas ${item.code_class}`)} style={styles.deleteIcon}>
            <Ionicons name="trash-bin-outline" size={24} color="#B00020" />
          </TouchableOpacity>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.cardInfo}>
              Kapasitas: {item.students.length} / {item.member_class}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.cardInfo}>{item.schedule}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>Lihat Detail</Text>
        <Ionicons name="chevron-forward-outline" size={16} color="#015023" />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Dashboard Manajer" }} />
      <View style={styles.container}>
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.button} onPress={() => router.push("/(manager)/CreateSubjects")}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Tambah Mata Kuliah</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push("/(manager)/CreateClasses")}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Buat Kelas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push("/(manager)/CreateLecturer")}>
            <Ionicons name="person-add-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Tambah Dosen</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#015023" style={{ flex: 1 }} />
        ) : (
          <FlatList
            data={classes}
            renderItem={renderItem}
            keyExtractor={(item) => item.id_class.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada kelas yang dibuat.</Text>}
            contentContainerStyle={{ paddingTop: 10 }}
            style={{ width: "100%" }}
          />
        )}

        {/* Tombol Logout di bagian bawah */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f4f7" },
  container: { flex: 1, padding: 20 },
  actionContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 20,
    height: 150,
    gap: 10,
  },
  button: {
    backgroundColor: "#015023",
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: "#B00020",
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    // Penambahan style untuk menampung tombol hapus
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteIcon: {
    padding: 5, // Area tekan yang lebih besar
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flexShrink: 1, // Agar teks tidak mendorong ikon
  },
  cardPeriod: {
    fontSize: 14,
    color: "#015023",
    fontWeight: "600",
    marginTop: 4,
  },
  cardBody: {
    padding: 15,
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardInfo: {
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  footerText: {
    color: "#015023",
    fontWeight: "bold",
    marginRight: 4,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 50,
    fontSize: 16,
  },
});
