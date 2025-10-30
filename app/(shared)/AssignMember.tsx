import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

interface User {
  id: number;
  name: string;
  email: string;
}

export default function AssignMemberScreen() {
  const { classId, role } = useLocalSearchParams<{ classId: string; role: "dosen" | "student" }>();
  const { token } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token || !role) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/manager/users-by-role?role=${role}`);
        setUsers(response.data.data);
      } catch (error) {
        console.error("Fetch Users Error:", error);
        Alert.alert("Error", "Gagal memuat daftar pengguna.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [role]);

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

  const handleAssignSelected = async () => {
    if (selectedUsers.size === 0) {
      Alert.alert("Perhatian", "Pilih minimal satu pengguna untuk ditambahkan.");
      return;
    }

    setIsAssigning(true);
    const endpoint = role === "dosen" ? "lecturers" : "students";
    let successCount = 0;
    let failCount = 0;

    try {
      for (const userId of selectedUsers) {
        try {
          await api.post(
            `/manager/classes/${classId}/${endpoint}`,
            { user_si_id: userId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to assign user ${userId}:`, error);
        }
      }

      if (successCount > 0) {
        Alert.alert(
          "Selesai",
          `Berhasil menambahkan ${successCount} ${role === "dosen" ? "dosen" : "mahasiswa"}.${
            failCount > 0 ? ` Gagal menambahkan ${failCount} pengguna.` : ""
          }`
        );
        router.back();
      } else {
        Alert.alert("Gagal", `Tidak ada ${role} yang berhasil ditambahkan.`);
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const renderItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.has(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.userCard, isSelected && styles.userCardSelected]}
        onPress={() => toggleUserSelection(item.id)}
        disabled={isAssigning}
      >
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
        <ActivityIndicator size="large" color="#fff" style={{ flex: 1, justifyContent: "center" }} />
      ) : (
        <View style={styles.mainContainer}>
          <FlatList
            data={users}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.container}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Tidak ada {role} yang tersedia untuk ditambahkan.
              </Text>
            }
          />
          
          {selectedUsers.size > 0 && (
            <View style={styles.bottomBar}>
              <Text style={styles.selectedCount}>
                {selectedUsers.size} dipilih
              </Text>
              <TouchableOpacity
                style={styles.assignButton}
                onPress={handleAssignSelected}
                disabled={isAssigning}
              >
                {isAssigning ? (
                  <ActivityIndicator color="#fff" />
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
  container: {
    paddingVertical: 10,
    paddingBottom: 100,
    flexGrow: 1,
    backgroundColor: "#015023",
  },
  userCard: {
    backgroundColor: "#F5EFD3",
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
  userCardSelected: {
    borderColor: "#015023",
    borderWidth: 2,
    backgroundColor: "#FFF9E6",
  },
  userInfo: {
    flex: 1,
  },
  userName: { fontSize: 16, fontWeight: "bold" },
  userEmail: { fontSize: 14, color: "#666" },
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
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#fff",
    fontSize: 16,
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
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#015023",
  },
  assignButton: {
    backgroundColor: "#015023",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assignButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});