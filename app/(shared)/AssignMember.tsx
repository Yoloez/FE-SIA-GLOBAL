import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

interface User {
  id_user_si: number;
  name: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
  program_name: string | null;
}

export default function AssignMemberScreen() {
  const { classId, role } = useLocalSearchParams<{
    classId: string;
    role: "dosen" | "mahasiswa";
  }>();
  const { token } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    const fetchUsers = async () => {
      if (!token || !role) return;

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      if (isMounted.current) setIsLoading(true);

      try {
        const response = await api.get(`/manager/users-by-role?role=${role}`, {
          signal: abortControllerRef.current.signal,
        });

        if (isMounted.current) {
          if (response.data.status === "success" && response.data.data) {
            setUsers(response.data.data);
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
          console.error("Fetch Users Error:", error);
          Alert.alert("Error", error.response?.data?.message || "Gagal memuat daftar pengguna.");
          setUsers([]);
        }
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };
    fetchUsers();
  }, [role, token]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase().trim();
    return users.filter((user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.username.toLowerCase().includes(query) || (user.program_name && user.program_name.toLowerCase().includes(query)));
  }, [users, searchQuery]);

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
              if (isMounted.current) router.back();
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
          <Text style={styles.userName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email}
          </Text>
          {item.program_name && (
            <Text style={styles.userProgram} numberOfLines={1}>
              {item.program_name}
            </Text>
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
        <Text style={styles.infoText}>
          {filteredUsers.length} {role === "dosen" ? "dosen" : "mahasiswa"} tersedia
        </Text>
        {filteredUsers.length > 0 && (
          <TouchableOpacity onPress={handleSelectAll} disabled={isAssigning} style={styles.selectAllButton}>
            <Text style={styles.selectAllText}>{selectedUsers.size === filteredUsers.length ? "Batal Pilih Semua" : "Pilih Semua"}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>{searchQuery ? `Tidak ada ${role === "dosen" ? "dosen" : "mahasiswa"} yang sesuai pencarian` : `Tidak ada ${role === "dosen" ? "dosen" : "mahasiswa"} yang tersedia untuk ditambahkan.`}</Text>
      {searchQuery && (
        <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchButton}>
          <Text style={styles.clearSearchText}>Hapus Pencarian</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen
        options={{
          title: `Pilih ${role === "dosen" ? "Dosen" : "Mahasiswa"}`,
          headerStyle: {
            backgroundColor: "#015023",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DABC4E" />
          <Text style={styles.loadingText}>Memuat data...</Text>
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
              <Text style={styles.selectedCount}>{selectedUsers.size} dipilih</Text>
              <TouchableOpacity style={[styles.assignButton, isAssigning && styles.assignButtonDisabled]} onPress={handleAssignSelected} disabled={isAssigning} activeOpacity={0.8}>
                {isAssigning ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.assignButtonText}>Tambahkan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#015023" },
  mainContainer: {
    flex: 1,
    backgroundColor: "#015023",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#015023",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#fff",
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
    fontWeight: "500",
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
    fontWeight: "600",
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
    fontWeight: "bold",
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
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F5EFD3",
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#015023",
  },
  assignButton: {
    backgroundColor: "#015023",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
