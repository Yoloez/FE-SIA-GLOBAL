import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface Subject {
  id_subject: number;
  name_subject: string;
  code_subject: string;
  sks: number;
}

export default function SubjectListScreen() {
  const { token } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch subjects list
  const fetchSubjects = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const response = await api.get("/manager/subjects");
      setSubjects(response.data.data);
    } catch (error) {
      console.error("Gagal mengambil data mata kuliah:", error);
      Alert.alert("Error", "Gagal mengambil data mata kuliah");
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSubjects();
    }, [fetchSubjects])
  );

  const handleDeleteSubject = useCallback(
    (subjectId: number, subjectName: string) => {
      Alert.alert(
        "Konfirmasi Hapus",
        `Apakah Anda yakin ingin menghapus mata kuliah "${subjectName}"? Tindakan ini tidak dapat dibatalkan.`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: async () => {
              try {
                await api.delete(`/manager/subjects/${subjectId}`);
                Alert.alert("Sukses", "Mata kuliah berhasil dihapus.");
                fetchSubjects();
              } catch (error) {
                if (axios.isAxiosError(error))
                  console.error("Gagal menghapus mata kuliah:", error.response?.data);
                Alert.alert("Gagal", "Gagal menghapus mata kuliah.");
              }
            },
          },
        ]
      );
    },
    [fetchSubjects]
  );

  // Filter subjects
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const query = searchQuery.toLowerCase();
    return subjects.filter(
      (subject) =>
        subject.name_subject.toLowerCase().includes(query) ||
        subject.code_subject.toLowerCase().includes(query)
    );
  }, [subjects, searchQuery]);

  const clearSearch = useCallback(() => setSearchQuery(""), []);

  const renderSubjectItem = useCallback(
    ({ item }: { item: Subject }) => (
      <View style={styles.subjectCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subjectName} numberOfLines={1}>
            {item.name_subject}
          </Text>
          <Text style={styles.subjectCode}>Kode: {item.code_subject}</Text>
          <Text style={styles.subjectSks}>SKS: {item.sks}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create-outline" size={22} color="#015023" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteSubject(item.id_subject, item.name_subject)}
          >
            <Ionicons name="trash-outline" size={22} color="#B00020" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleDeleteSubject]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Daftar Mata Kuliah",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari mata kuliah (nama, kode)..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Header List */}
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>Daftar Mata Kuliah</Text>
            {searchQuery.length > 0 && (
              <Text style={styles.resultCount}>{filteredSubjects.length} hasil ditemukan</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(shared)/AddSubjects")
}
            style={styles.addButton}
          >
            <Ionicons name="add-circle-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* List Mata Kuliah */}
        <View style={styles.listContainer}>
          {isLoadingList ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Memuat data...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredSubjects}
              renderItem={renderSubjectItem}
              keyExtractor={(item) => `subject-${item.id_subject}`}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name={searchQuery ? "search-outline" : "book-outline"}
                    size={64}
                    color="rgba(255,255,255,0.6)"
                  />
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? `Tidak ada mata kuliah yang cocok dengan "${searchQuery}"`
                      : "Belum ada mata kuliah yang ditambahkan."}
                  </Text>
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
  listContainer: {
    flex: 1,
  },
  subjectCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  subjectName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  subjectSks: {
    fontSize: 14,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
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
    lineHeight: 24,
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
