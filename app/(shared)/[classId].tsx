import api from "@/api/axios";
import { ClassHeader } from "@/components/class/ClassHeader";
import { ClassStats } from "@/components/class/ClassStats";
import { SearchBar } from "@/components/class/SearchBar";
import { SectionHeader } from "@/components/class/SectionHeader";
import { ClassDetails, User } from "@/types/class.types";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

export default function ClassDetailScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const { token } = useAuth();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetchClassDetails = useCallback(async () => {
    if (!token || !classId) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    if (isMounted.current) setIsLoading(true);

    try {
      const response = await api.get(`/manager/classes/${classId}`, {
        signal: abortControllerRef.current.signal,
      });
      if (isMounted.current) setClassDetails(response.data.data);
    } catch (error: any) {
      if (error.name === "AbortError" || error.name === "CanceledError") return;

      if (isMounted.current) {
        console.error("Error fetching class details:", error);
        Alert.alert("Error", "Gagal memuat detail kelas.", [{ text: "OK", onPress: () => isMounted.current && router.back() }]);
      }
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [classId, token]);

  useFocusEffect(
    useCallback(() => {
      fetchClassDetails();
      return () => abortControllerRef.current?.abort();
    }, [fetchClassDetails])
  );

  const filteredData = useMemo(() => {
    if (!classDetails) return { lecturers: [], students: [] };

    const query = searchQuery.toLowerCase().trim();
    if (!query) return { lecturers: classDetails.lecturers || [], students: classDetails.students || [] };

    const filterByQuery = (user: User) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);

    return {
      lecturers: (classDetails.lecturers || []).filter(filterByQuery),
      students: (classDetails.students || []).filter(filterByQuery),
    };
  }, [classDetails, searchQuery]);

  const handleRemoveMember = useCallback(
    (memberId: number, memberName: string, role: "dosen" | "mahasiswa") => {
      if (!isMounted.current) return;

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
              if (isMounted.current) {
                Alert.alert("Sukses", `${roleName} berhasil dikeluarkan.`);
                fetchClassDetails();
              }
            } catch (error) {
              if (axios.isAxiosError(error)) console.error(`Gagal mengeluarkan ${role}:`, error.response?.data);
              if (isMounted.current) Alert.alert("Gagal", `Gagal mengeluarkan ${roleName}.`);
            }
          },
        },
      ]);
    },
    [classId, fetchClassDetails]
  );

  const renderMemberItem = useCallback(
    ({ item, role }: { item: User; role: "dosen" | "mahasiswa" }) => {
      const imageUri = item.profile_image?.trim();

      return (
        <View style={styles.memberCard}>
          <View style={styles.memberAvatar}>
            <Image source={{ uri: imageUri }} style={styles.avatarImage} />
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.memberEmail} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleRemoveMember(item.id_user_si, item.name, role)} style={styles.removeButton}>
            <Ionicons name="close-circle" size={24} color="#B00020" />
          </TouchableOpacity>
        </View>
      );
    },
    [handleRemoveMember]
  );

  const sections = useMemo(() => {
    if (!classDetails) return [];

    const createSection = (type: string, key: string, data?: any) => ({ type, key, data });
    const memberSections = (members: User[], type: string, prefix: string) => (members.length > 0 ? members.map((m) => createSection(type, `${prefix}-${m.id_user_si}`, m)) : [createSection(`${prefix}-empty`, `${prefix}-empty`)]);

    return [
      createSection("header", "header"),
      createSection("stats", "stats"),
      createSection("search", "search"),
      createSection("lecturers-header", "lecturers-header"),
      ...memberSections(filteredData.lecturers, "lecturer", "lecturer"),
      createSection("students-header", "students-header"),
      ...memberSections(filteredData.students, "student", "student"),
    ];
  }, [classDetails, filteredData]);

  const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
    <View style={styles.emptyState}>
      <Ionicons name={icon as any} size={48} color="#ccc" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );

  const renderItem = useCallback(
    ({ item }: any) => {
      if (!classDetails) return null;

      const navigateToAssign = (role: string) => router.push(`/(manager)/AssignMember?classId=${classId}&role=${role}`);

      switch (item.type) {
        case "header":
          return <ClassHeader classDetails={classDetails} />;

        case "stats":
          return <ClassStats classDetails={classDetails} />;

        case "search":
          return <SearchBar value={searchQuery} onChangeText={setSearchQuery} onClear={() => setSearchQuery("")} />;

        case "lecturers-header":
          return <SectionHeader icon="briefcase-outline" title="Dosen Pengajar" onAdd={() => navigateToAssign("dosen")} />;

        case "lecturer":
          return renderMemberItem({ item: item.data, role: "dosen" });

        case "lecturer-empty":
          return <EmptyState icon="briefcase-outline" text={searchQuery ? "Tidak ada dosen yang sesuai pencarian" : "Belum ada dosen yang ditambahkan"} />;

        case "students-header":
          return <SectionHeader icon="people-outline" title="Daftar Mahasiswa" onAdd={() => navigateToAssign("mahasiswa")} />;

        case "student":
          return renderMemberItem({ item: item.data, role: "mahasiswa" });

        case "student-empty":
          return <EmptyState icon="people-outline" text={searchQuery ? "Tidak ada mahasiswa yang sesuai pencarian" : "Belum ada mahasiswa yang ditambahkan"} />;

        default:
          return null;
      }
    },
    [classDetails, searchQuery, renderMemberItem, classId]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: "Detail Kelas", headerStyle: { backgroundColor: "#015023" }, headerTintColor: "#fff" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DABC4E" />
          <Text style={styles.loadingText}>Memuat detail kelas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!classDetails) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: "Detail Kelas", headerStyle: { backgroundColor: "#015023" }, headerTintColor: "#fff" }} />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Detail kelas tidak ditemukan.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: "Detail Kelas", headerStyle: { backgroundColor: "#015023" }, headerTintColor: "#fff" }} />
      <FlatList
        data={sections}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#015023" },
  container: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  memberCard: { backgroundColor: "#F5EFD3", flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, marginBottom: 12, elevation: 2 },
  memberAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#f0f8f4", justifyContent: "center", alignItems: "center", marginRight: 12, overflow: "hidden" },
  avatarImage: { width: 50, height: 50, borderRadius: 25 },
  memberInfo: { flex: 1, marginRight: 8 },
  memberName: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
  memberEmail: { fontSize: 13, color: "#777" },
  removeButton: { padding: 4 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 40, paddingHorizontal: 20, backgroundColor: "#F5EFD3", borderRadius: 16, marginBottom: 16 },
  emptyText: { textAlign: "center", color: "#999", fontSize: 15, marginTop: 12 },
});
