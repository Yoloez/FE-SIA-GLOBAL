import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

const IP_ADDRESS = "192.168.0.159"; // Ganti dengan IP Anda
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

// --- Tipe data yang lengkap untuk type safety ---
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
interface ClassDetails {
  id_class: number;
  code_class: string;
  member_class: number;
  schedule: string;
  subject: Subject;
  academic_period: AcademicPeriod;
  lecturers: User[];
  students: User[];
}

export default function ClassDetailScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const { token } = useAuth();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClassDetails = useCallback(async () => {
    if (!token || !classId) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/manager/classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClassDetails(response.data.data);
    } catch (error) {
      Alert.alert("Error", "Gagal memuat detail kelas.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [token, classId]);

  useFocusEffect(
    useCallback(() => {
      fetchClassDetails();
    }, [fetchClassDetails])
  );

  // --- FUNGSI BARU UNTUK MENGHAPUS ANGGOTA KELAS ---
  const handleRemoveMember = (memberId: number, memberName: string, role: "dosen" | "student") => {
    const endpoint = role === "dosen" ? "lecturers" : "students";
    const roleName = role === "dosen" ? "Dosen" : "Mahasiswa";

    // Tampilkan dialog konfirmasi sebelum menghapus
    Alert.alert(`Keluarkan ${roleName}`, `Apakah Anda yakin ingin mengeluarkan "${memberName}" dari kelas ini?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluarkan",
        style: "destructive",
        onPress: async () => {
          try {
            // Kirim permintaan DELETE ke endpoint yang sesuai
            await axios.delete(`${API_BASE_URL}/manager/classes/${classId}/${endpoint}/${memberId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert("Sukses", `${roleName} berhasil dikeluarkan.`);
            fetchClassDetails(); // Muat ulang detail kelas untuk memperbarui daftar
          } catch (error) {
            if (axios.isAxiosError(error)) console.error(`Gagal mengeluarkan ${role}:`, error.response?.data);
            Alert.alert("Gagal", `Gagal mengeluarkan ${role}.`);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;
  }

  if (!classDetails) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Detail kelas tidak ditemukan.</Text>
      </View>
    );
  }

  // Komponen untuk merender setiap anggota, sekarang dengan tombol hapus
  const renderMemberItem = ({ item, role }: { item: User; role: "dosen" | "student" }) => (
    <View style={styles.memberCard}>
      <View>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemoveMember(item.id, item.name, role)}>
        <Ionicons name="remove-circle-outline" size={24} color="#B00020" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: `Kelas ${classDetails.code_class}` }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{classDetails.subject?.name_subject ?? "Memuat..."}</Text>
          <Text style={styles.subtitle}>Periode: {classDetails.academic_period?.name ?? "Memuat..."}</Text>
        </View>

        {/* Bagian Dosen */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dosen Pengajar</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push(`/(manager)/AssignMember?classId=${classId}&role=dosen`)}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Tambah</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={classDetails.lecturers}
            // Kirim 'role' ke renderItem agar fungsi hapus tahu siapa yang dihapus
            renderItem={({ item }) => renderMemberItem({ item, role: "dosen" })}
            keyExtractor={(item) => `lecturer-${item.id}`}
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada dosen yang ditambahkan.</Text>}
          />
        </View>

        {/* Bagian Mahasiswa */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Mahasiswa ({classDetails.students.length}/{classDetails.member_class})
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push(`/(manager)/AssignMember?classId=${classId}&role=student`)}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Tambah</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={classDetails.students}
            // Kirim 'role' ke renderItem
            renderItem={({ item }) => renderMemberItem({ item, role: "student" })}
            keyExtractor={(item) => `student-${item.id}`}
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada mahasiswa yang ditambahkan.</Text>}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9f9f9" },
  container: { padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerInfo: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
  },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", color: "#333" },
  subtitle: { fontSize: 16, color: "#555", textAlign: "center", marginTop: 5 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  addButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#015023", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  addButtonText: { color: "#fff", fontSize: 14, fontWeight: "bold", marginLeft: 4 },
  memberCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    // Perubahan untuk mengakomodasi tombol hapus
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberName: { fontSize: 16, fontWeight: "600" },
  memberEmail: { fontSize: 12, color: "#777" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 10, padding: 10 },
});
