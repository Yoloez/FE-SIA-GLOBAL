import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

interface User {
  id: number;
  name: string;
  email: string;
  profile_image: string;
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
  const [searchQuery, setSearchQuery] = useState("");

  const fetchClassDetails = useCallback(async () => {
    if (!token || !classId) return;
    setIsLoading(true);
    try {
      const response = await api.get(`/manager/classes/${classId}`);
      setClassDetails(response.data.data);
    } catch (error) {
      Alert.alert("Error", "Gagal memuat detail kelas.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useFocusEffect(
    useCallback(() => {
      fetchClassDetails();
    }, [fetchClassDetails])
  );

  // Filter lecturers dan students berdasarkan search query
  const filteredData = useMemo(() => {
    if (!classDetails) return { lecturers: [], students: [] };

    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return {
        lecturers: classDetails.lecturers,
        students: classDetails.students,
      };
    }

    return {
      lecturers: classDetails.lecturers.filter((lecturer) => lecturer.name.toLowerCase().includes(query) || lecturer.email.toLowerCase().includes(query)),
      students: classDetails.students.filter((student) => student.name.toLowerCase().includes(query) || student.email.toLowerCase().includes(query)),
    };
  }, [classDetails, searchQuery]);

  const handleRemoveMember = (memberId: number, memberName: string, role: "dosen" | "student") => {
    const endpoint = role === "dosen" ? "lecturers" : "students";
    const roleName = role === "dosen" ? "Dosen" : "Mahasiswa";

    Alert.alert(`Keluarkan ${roleName}`, `Apakah Anda yakin ingin mengeluarkan "${memberName}" dari kelas ini?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluarkan",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/manager/classes/${classId}/${endpoint}/${memberId}`);
            Alert.alert("Sukses", `${roleName} berhasil dikeluarkan.`);
            fetchClassDetails();
          } catch (error) {
            if (axios.isAxiosError(error)) console.error(`Gagal mengeluarkan ${role}:`, error.response?.data);
            Alert.alert("Gagal", `Gagal mengeluarkan ${role}.`);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#015023" />
          <Text style={styles.loadingText}>Memuat detail kelas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!classDetails) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Detail kelas tidak ditemukan.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderMemberItem = ({ item, role }: { item: User; role: "dosen" | "student" }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        <Image source={{ uri: item.profile_image }} />
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemoveMember(item.id, item.name, role)} style={styles.removeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close-circle" size={24} color="#B00020" />
      </TouchableOpacity>
    </View>
  );

  // Gabungkan semua data menjadi satu array dengan type identifier
  const sections = [
    { type: "header" },
    { type: "stats" },
    { type: "search" },
    { type: "lecturers-header" },
    ...filteredData.lecturers.map((lecturer) => ({ type: "lecturer", data: lecturer })),
    { type: "lecturers-empty", show: filteredData.lecturers.length === 0 },
    { type: "students-header" },
    ...filteredData.students.map((student) => ({ type: "student", data: student })),
    { type: "students-empty", show: filteredData.students.length === 0 },
  ];

  const renderItem = ({ item }: any) => {
    switch (item.type) {
      case "header":
        return (
          <View style={styles.headerCard}>
            <View style={styles.headerTop}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{classDetails.code_class}</Text>
              </View>
            </View>
            <Text style={styles.title}>{classDetails.subject?.name_subject ?? "Memuat..."}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{classDetails.academic_period?.name ?? "Memuat..."}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{classDetails.schedule}</Text>
            </View>
          </View>
        );

      case "stats":
        return (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Ionicons name="people" size={32} color="#015023" />
              <Text style={styles.statNumber}>
                {classDetails.students.length}/{classDetails.member_class}
              </Text>
              <Text style={styles.statLabel}>Mahasiswa</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Ionicons name="person" size={32} color="#015023" />
              <Text style={styles.statNumber}>{classDetails.lecturers.length}</Text>
              <Text style={styles.statLabel}>Dosen</Text>
            </View>
          </View>
        );

      case "search":
        return (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput style={styles.searchInput} placeholder="Cari dosen atau mahasiswa..." placeholderTextColor="#999" value={searchQuery} onChangeText={setSearchQuery} />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        );

      case "lecturers-header":
        return (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="briefcase-outline" size={24} color="white" />
              <Text style={styles.sectionTitle}>Dosen Pengajar</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push(`/(manager)/AssignMember?classId=${classId}&role=dosen`)} activeOpacity={0.7}>
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      case "lecturer":
        return renderMemberItem({ item: item.data, role: "dosen" });

      case "lecturers-empty":
        return item.show ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>{searchQuery ? "Tidak ada dosen yang sesuai pencarian" : "Belum ada dosen yang ditambahkan"}</Text>
          </View>
        ) : null;

      case "students-header":
        return (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="people-outline" size={24} color="white" />
              <Text style={styles.sectionTitle}>Daftar Mahasiswa</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push(`/(manager)/AssignMember?classId=${classId}&role=student`)} activeOpacity={0.7}>
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      case "student":
        return renderMemberItem({ item: item.data, role: "student" });

      case "students-empty":
        return item.show ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>{searchQuery ? "Tidak ada mahasiswa yang sesuai pencarian" : "Belum ada mahasiswa yang ditambahkan"}</Text>
          </View>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          title: `Detail Kelas`,
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />
      <FlatList data={sections} renderItem={renderItem} keyExtractor={(item, index) => `${item.type}-${index}`} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#015023",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  headerCard: {
    backgroundColor: "#F5EFD3",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  codeBadge: {
    backgroundColor: "#015023",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  codeText: {
    color: "#DABC4E",
    fontSize: 14,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: "#666",
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5EFD3",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#F5EFD3",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#015023",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  addButton: {
    backgroundColor: "transparent",
    width: 40,
    height: 40,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
    borderWidth: 1,
  },
  memberCard: {
    backgroundColor: "#F5EFD3",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f8f4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 13,
    color: "#777",
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 15,
    marginTop: 12,
  },
});
