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
  const [isAssigning, setIsAssigning] = useState<number | null>(null);

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

  const handleAssign = async (userId: number) => {
    setIsAssigning(userId);
    const endpoint = role === "dosen" ? "lecturers" : "students";
    try {
      await api.post(`/manager/classes/${classId}/${endpoint}`, { user_si_id: userId }, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert("Sukses", `${role === "dosen" ? "Dosen" : "Mahasiswa"} berhasil ditambahkan.`);
      router.back();
    } catch (error) {
      const message = `Gagal menambahkan ${role}.`;
      Alert.alert("Gagal", message);
    } finally {
      setIsAssigning(null);
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => handleAssign(item.id)} disabled={!!isAssigning}>
      <View>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      {isAssigning === item.id ? <ActivityIndicator color="#015023" /> : <Ionicons name="add-circle-outline" size={24} color="#015023" />}
    </TouchableOpacity>
  );

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
        <View style={{ flex: 1, backgroundColor: "#015023" }}>
          <FlatList
            data={users}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.container}
            ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada {role} yang tersedia untuk ditambahkan.</Text>}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#015023" },
  container: { 
    paddingVertical: 10,
    flexGrow: 1,
    backgroundColor: "#015023"  // ← PENTING: background hijau di contentContainer
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
  userName: { fontSize: 16, fontWeight: "bold" },
  userEmail: { fontSize: 14, color: "#666" },
  emptyText: { 
    textAlign: "center", 
    marginTop: 50, 
    color: "#fff",  // ← UBAH: dari #999 ke #fff agar terlihat di background hijau
    fontSize: 16 
  },
});