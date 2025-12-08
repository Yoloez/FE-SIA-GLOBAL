import api from "@/api/axios";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AssignMemberProps {
  viewMode: "admin" | "manager";
  classId: string;
  role: "dosen" | "mahasiswa";
  onBack?: () => void;
  onSuccess?: () => void;
}

interface User {
  id_user_si: number;
  name: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
  program_name: string | null;
}

export default function AssignMemberScreen({ viewMode, classId, role, onBack, onSuccess }: AssignMemberProps) {
  const { token } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [existingMemberIds, setExistingMemberIds] = useState<Set<number>>(new Set());

  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !role || !classId) return;

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      if (isMounted.current) setIsLoading(true);

      try {
        // Fetch class details and users in parallel
        const [classResponse, usersResponse] = await Promise.all([
          api.get(`/manager/classes/${classId}`, {
            signal: abortControllerRef.current.signal,
          }),
          api.get(`/manager/users-by-role?role=${role}`, {
            signal: abortControllerRef.current.signal,
          }),
        ]);

        if (isMounted.current) {
          // Get existing member IDs
          const classData = classResponse.data.data;
          const existingMembers = role === "dosen" ? classData.lecturers || [] : classData.students || [];
          const memberIds = new Set(existingMembers.map((member: any) => member.id_user_si || member.id));
          setExistingMemberIds(memberIds);

          // Set users
          if (usersResponse.data.status === "success" && usersResponse.data.data) {
            setUsers(usersResponse.data.data);
          } else {
            setUsers([]);
          }
        }
      } catch (error: any) {
        // Ignore abort errors
        if (error.name === "AbortError" || error.name === "CanceledError") {
          return;
        }

        if (isMounted.current) {
          console.error("Fetch Data Error:", error);
          Alert.alert("Error", error.response?.data?.message || "Gagal memuat data.");
          setUsers([]);
        }
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };
    fetchData();
  }, [role, token, classId]);

  // Filter users based on search query and exclude existing members
  const filteredUsers = useMemo(() => {
    // First filter out users who are already assigned
    const availableUsers = users.filter((user) => !existingMemberIds.has(user.id_user_si));

    if (!searchQuery.trim()) return availableUsers;

    const query = searchQuery.toLowerCase().trim();
    return availableUsers.filter(
      (user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.username.toLowerCase().includes(query) || (user.program_name && user.program_name.toLowerCase().includes(query))
    );
  }, [users, searchQuery, existingMemberIds]);

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      // Deselect all
      setSelectedUsers(new Set());
    } else {
      // Select all filtered users
      const allIds = new Set(filteredUsers.map((user) => user.id_user_si));
      setSelectedUsers(allIds);
    }
  };

  const handleAssignSelected = async () => {
    if (selectedUsers.size === 0) {
      Alert.alert("Perhatian", "Pilih minimal satu pengguna untuk ditambahkan.");
      return;
    }

    if (!isMounted.current) return;

    setIsAssigning(true);
    const endpoint = role === "dosen" ? "lecturers" : "students";
    let successCount = 0;
    let failCount = 0;

    try {
      for (const userId of selectedUsers) {
        if (!isMounted.current) break;

        try {
          await api.post(`/manager/classes/${classId}/${endpoint}`, {
            id_user_si: userId,
          });
          successCount++;
        } catch (error: any) {
          failCount++;
          console.error(`Failed to assign user ${userId}:`, error.response?.data || error.message);
        }
      }

      if (!isMounted.current) return;

      if (successCount > 0) {
        Alert.alert("Selesai", `Berhasil menambahkan ${successCount} ${role === "dosen" ? "dosen" : "mahasiswa"}.${failCount > 0 ? ` Gagal menambahkan ${failCount} pengguna.` : ""}`, [
          {
            text: "OK",
            onPress: () => {
              if (isMounted.current) onSuccess?.();
            },
          },
        ]);
      } else {
        Alert.alert("Gagal", `Tidak ada ${role} yang berhasil ditambahkan.`);
      }
    } finally {
      if (isMounted.current) setIsAssigning(false);
    }
  };

  const renderItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.has(item.id_user_si);

    return (
      <TouchableOpacity style={[styles.userCard, isSelected && styles.userCardSelected]} onPress={() => toggleUserSelection(item.id_user_si)} disabled={isAssigning} activeOpacity={0.7}>
        <View style={styles.userInfo}>
          <ThemedText variant="bold" style={styles.userName} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.userEmail} numberOfLines={1}>
            {item.email}
          </ThemedText>
          {item.program_name && (
            <ThemedText style={styles.userProgram} numberOfLines={1}>
              {item.program_name}
            </ThemedText>
          )}
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>{isSelected && <Ionicons name="checkmark" size={20} color="#fff" />}</View>
      </TouchableOpacity>
    );
  };

  const ListHeaderComponent = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Cari ${role === "dosen" ? "dosen" : "mahasiswa"}...`}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          editable={!isLoading && !isAssigning}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              Keyboard.dismiss();
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Info Bar */}
      <View style={styles.infoBar}>
        <ThemedText variant="medium" style={styles.infoText}>
          {filteredUsers.length} {role === "dosen" ? "dosen" : "mahasiswa"} tersedia
        </ThemedText>
        {filteredUsers.length > 0 && (
          <TouchableOpacity onPress={handleSelectAll} disabled={isAssigning} style={styles.selectAllButton}>
            <ThemedText variant="semibold" style={styles.selectAllText}>
              {selectedUsers.size === filteredUsers.length ? "Batal Pilih Semua" : "Pilih Semua"}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
      <ThemedText variant="semibold" style={styles.emptyText}>
        {searchQuery ? `Tidak ada ${role === "dosen" ? "dosen" : "mahasiswa"} yang sesuai pencarian` : `Semua ${role === "dosen" ? "dosen" : "mahasiswa"} sudah ditambahkan atau tidak ada yang tersedia.`}
      </ThemedText>
      {searchQuery && (
        <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchButton}>
          <ThemedText variant="semibold" style={styles.clearSearchText}>
            Hapus Pencarian
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onBack?.()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <ThemedText variant="bold" style={styles.headerTitle}>
            Pilih {role === "dosen" ? "Dosen" : "Mahasiswa"}
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DABC4E" />
            <ThemedText variant="medium" style={styles.loadingText}>
              Memuat data...
            </ThemedText>
          </View>
        ) : (
          <View style={styles.mainContainer}>
            <FlatList
              data={filteredUsers}
              renderItem={renderItem}
              keyExtractor={(item) => item.id_user_si.toString()}
              contentContainerStyle={styles.container}
              ListHeaderComponent={ListHeaderComponent}
              ListEmptyComponent={ListEmptyComponent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />

            {selectedUsers.size > 0 && (
              <View style={styles.bottomBar}>
                <ThemedText variant="bold" style={styles.selectedCount}>
                  {selectedUsers.size} dipilih
                </ThemedText>
                <TouchableOpacity style={[styles.assignButton, isAssigning && styles.assignButtonDisabled]} onPress={handleAssignSelected} disabled={isAssigning} activeOpacity={0.8}>
                  {isAssigning ? (
                    <ActivityIndicator color="#015023" size="small" />
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={20} color="#015023" />
                      <ThemedText variant="bold" style={styles.assignButtonText}>
                        Tambahkan
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    color: "#FFFFFF",
  },
  headerSpacer: {
    width: 40,
  },
  mainContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#FFFFFF",
  },
  container: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  headerContainer: {
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5EFD3",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
    fontFamily: "Urbanist",
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  infoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#F5EFD3",
  },
  selectAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(245, 239, 211, 0.2)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F5EFD3",
  },
  selectAllText: {
    fontSize: 13,
    color: "#F5EFD3",
  },
  userCard: {
    backgroundColor: "#F5EFD3",
    padding: 15,
    borderRadius: 12,
    marginVertical: 5,
    marginHorizontal: 10,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userCardSelected: {
    borderColor: "#015023",
    backgroundColor: "#FFF9E6",
    elevation: 3,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    color: "#015023",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  userProgram: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
    fontStyle: "italic",
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#015023",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxSelected: {
    backgroundColor: "#015023",
    borderColor: "#015023",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 16,
    color: "#F5EFD3",
    fontSize: 16,
    lineHeight: 24,
  },
  clearSearchButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#F5EFD3",
    borderRadius: 8,
  },
  clearSearchText: {
    color: "#015023",
    fontSize: 14,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1C352D",
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCount: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  assignButton: {
    backgroundColor: "#DABC4E",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  assignButtonDisabled: {
    opacity: 0.7,
  },
  assignButtonText: {
    color: "#015023",
    fontSize: 16,
  },
});
