import api from "@/api/axios";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ListSubjectsProps {
  viewMode: "admin" | "manager";
  onAddSubject?: () => void;
  onEditSubject?: (subjectData: { id: number; name: string; code: string; sks: number }) => void;
  onBack?: () => void;
}

interface Subject {
  id_subject: number;
  name_subject: string;
  code_subject: string;
  sks: number;
}

export default function SubjectListScreen({ viewMode, onAddSubject, onEditSubject, onBack }: ListSubjectsProps) {
  const { token, user } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const isMountedRef = React.useRef(true);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const isFetchingRef = React.useRef(false);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      console.log("[ListSubjects] Cleanup - unmounting");
      isMountedRef.current = false;
      isFetchingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Fetch subjects list - STABLE reference with empty deps
  const fetchSubjects = useCallback(async () => {
    console.log("[ListSubjects] fetchSubjects called");

    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log("[ListSubjects] Fetch already in progress, skipping");
      return;
    }

    if (!isMountedRef.current) {
      console.log("[ListSubjects] Component unmounted, skipping fetch");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (typeof AbortController !== "undefined") {
      abortControllerRef.current = new AbortController();
    }

    isFetchingRef.current = true;

    try {
      if (isMountedRef.current) {
        setIsLoadingList(true);
      }

      const response = await api.get("/manager/subjects", {
        signal: abortControllerRef.current?.signal,
      });

      if (isMountedRef.current) {
        setSubjects(response.data.data);
      }
    } catch (error: any) {
      if (error.name === "AbortError" || error.name === "CanceledError") {
        console.log("[ListSubjects] Fetch aborted");
        return;
      }

      console.error("[ListSubjects] Fetch error:", error);
      if (isMountedRef.current) {
        Alert.alert("Error", "Gagal mengambil data mata kuliah");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingList(false);
      }
      isFetchingRef.current = false;
      console.log("[ListSubjects] Fetch completed");
    }
  }, []); // EMPTY deps - stable reference!

  // FIXED: useFocusEffect with EMPTY deps to prevent infinite loop
  useFocusEffect(
    useCallback(() => {
      console.log("[ListSubjects] useFocusEffect triggered");
      if (isMountedRef.current && !isFetchingRef.current) {
        fetchSubjects();
      }
      // fetchSubjects has STABLE reference, so this callback is also stable
    }, []) // EMPTY deps - no re-creation!
  );

  const handleDeleteSubject = useCallback(
    (subjectId: number, subjectName: string) => {
      if (!isMountedRef.current) {
        console.warn("[ListSubjects] Component unmounted, delete cancelled");
        return;
      }

      Alert.alert("Konfirmasi Hapus", `Apakah Anda yakin ingin menghapus mata kuliah "${subjectName}"? Tindakan ini tidak dapat dibatalkan.`, [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            if (!isMountedRef.current) {
              console.warn("[ListSubjects] Component unmounted during delete");
              return;
            }

            try {
              await api.delete(`/manager/subjects/${subjectId}`);

              if (!isMountedRef.current) return;

              Alert.alert("Sukses", "Mata kuliah berhasil dihapus.");
              fetchSubjects();
            } catch (error) {
              if (axios.isAxiosError(error)) console.error("Gagal menghapus mata kuliah:", error.response?.data);

              if (isMountedRef.current) {
                Alert.alert("Gagal", "Gagal menghapus mata kuliah.");
              }
            }
          },
        },
      ]);
    },
    [fetchSubjects]
  );

  // Filter subjects
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const query = searchQuery.toLowerCase();
    return subjects.filter((subject) => subject.name_subject.toLowerCase().includes(query) || subject.code_subject.toLowerCase().includes(query));
  }, [subjects, searchQuery]);

  const clearSearch = useCallback(() => setSearchQuery(""), []);

  const renderSubjectItem = useCallback(
    ({ item }: { item: Subject }) => (
      <View style={styles.subjectCard}>
        <View style={{ flex: 1 }}>
          <ThemedText variant="bold" style={styles.subjectName} numberOfLines={1}>
            {item.name_subject}
          </ThemedText>
          <ThemedText style={styles.subjectCode}>Kode: {item.code_subject}</ThemedText>
          <ThemedText style={styles.subjectSks}>SKS: {item.sks}</ThemedText>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={(e) => {
              e.stopPropagation();
              if (onEditSubject) {
                onEditSubject({
                  id: item.id_subject,
                  name: item.name_subject,
                  code: item.code_subject,
                  sks: item.sks,
                });
              }
            }}
          >
            <Ionicons name="create-outline" size={24} color="#DABC4E" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteSubject(item.id_subject, item.name_subject)}>
            <Ionicons name="trash-outline" size={22} color="#B00020" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleDeleteSubject]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput style={styles.searchInput} placeholder="Cari mata kuliah (nama, kode)..." placeholderTextColor="#999" value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" autoCorrect={false} />
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
            <ThemedText variant="bold" style={styles.listTitle}>
              Daftar Mata Kuliah
            </ThemedText>
            {searchQuery.length > 0 && <ThemedText style={styles.resultCount}>{filteredSubjects.length} hasil ditemukan</ThemedText>}
          </View>

          <TouchableOpacity onPress={() => onAddSubject?.()} style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* List Mata Kuliah */}
        <View style={styles.listContainer}>
          {isLoadingList ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <ThemedText style={styles.loadingText}>Memuat data...</ThemedText>
            </View>
          ) : (
            <FlatList
              data={filteredSubjects}
              renderItem={renderSubjectItem}
              keyExtractor={(item) => `subject-${item.id_subject}`}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name={searchQuery ? "search-outline" : "book-outline"} size={64} color="rgba(255,255,255,0.6)" />
                  <ThemedText style={styles.emptyText}>{searchQuery ? `Tidak ada mata kuliah yang cocok dengan "${searchQuery}"` : "Belum ada mata kuliah yang ditambahkan."}</ThemedText>
                  {searchQuery && (
                    <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                      <ThemedText style={styles.clearSearchText}>Hapus Pencarian</ThemedText>
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
    paddingTop: 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#015023",
    padding: 20,
    marginTop: -50, // dorong naik
  },
  searchContainer: {
    marginBottom: 10,
    paddingTop: 0,
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
  editButton: { padding: 8 },
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
