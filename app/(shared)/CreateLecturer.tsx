import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

interface Lecturer {
  id: number;
  name: string;
  email: string;
  nip?: string;
  profile_image?: string;
  username?: string;
}

export default function ListLecturerScreen() {
  const { token } = useAuth();
  const router = useRouter();

  // State untuk list dosen
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [filteredLecturers, setFilteredLecturers] = useState<Lecturer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLecturers();
  }, []);

  useEffect(() => {
    filterLecturers();
  }, [searchQuery, lecturers]);

  // Fetch daftar dosen
  const fetchLecturers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/manager/lecturers");
      console.log("Response lecturers:", response.data); // Debug log
      setLecturers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching lecturers:", error);
      Alert.alert("Error", "Gagal memuat daftar dosen.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLecturers();
  };

  const filterLecturers = () => {
    if (!searchQuery.trim()) {
      setFilteredLecturers(lecturers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = lecturers.filter(
      (lecturer) =>
        lecturer.name.toLowerCase().includes(query) ||
        lecturer.email.toLowerCase().includes(query) ||
        (lecturer.nip && lecturer.nip.toLowerCase().includes(query))
    );
    setFilteredLecturers(filtered);
  };

  const handleEditLecturer = (lecturerId: number) => {
    router.push(`/(shared)/editDosen?id=${lecturerId}`);
  };

  const handleDeleteLecturer = (lecturer: Lecturer) => {
    Alert.alert(
      "Hapus Dosen",
      `Apakah Anda yakin ingin menghapus "${lecturer.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/manager/lecturers/${lecturer.id}`);
              Alert.alert("Sukses", "Dosen berhasil dihapus.");
              fetchLecturers();
            } catch (error) {
              console.error("Error deleting lecturer:", error);
              Alert.alert("Error", "Gagal menghapus dosen.");
            }
          },
        },
      ]
    );
  };

  const handleAddLecturer = () => {
    // Arahkan ke halaman tambah dosen (dokumen kedua)
    router.push("/(admin)/AddLecturer");
  };

  const renderLecturerItem = ({ item }: { item: Lecturer }) => (
    <View style={styles.lecturerCard}>
      <View style={styles.lecturerContent}>
        <View style={styles.avatarContainer}>
          {item.profile_image ? (
            <Image source={{ uri: item.profile_image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={40} color="#999" />
            </View>
          )}
        </View>

        <View style={styles.lecturerInfo}>
          <Text style={styles.lecturerName}>{item.name}</Text>
          <Text style={styles.lecturerEmail}>{item.email}</Text>
          {item.nip && <Text style={styles.lecturerNip}>NIP: {item.nip}</Text>}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleEditLecturer(item.id)}
          >
            <Ionicons name="create-outline" size={26} color="#015023" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDeleteLecturer(item)}
          >
            <Ionicons name="trash-outline" size={26} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Daftar Dosen",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={28} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={22} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari Dosen (nama, email, NIP)..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Header list */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Daftar Dosen</Text>
          <TouchableOpacity
            onPress={handleAddLecturer}
            style={styles.addButton}
          >
            <Ionicons name="add-circle" size={40} color="#ffffffff" />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* List Dosen */}
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DABC4E" />
            <Text style={styles.loadingText}>Memuat daftar dosen...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredLecturers}
            renderItem={renderLecturerItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#ffffffff"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.4)" />
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "Tidak ada dosen yang sesuai pencarian"
                    : "Belum ada dosen. Tekan tombol + untuk menambahkan."}
                </Text>
              </View>
            }
          />
        )}
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    height: 56,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
  },
  addButton: {
    padding: 4,
  },
  divider: {
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  lecturerCard: {
    backgroundColor: "#F5E6C8",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lecturerContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    backgroundColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
  },
  lecturerInfo: {
    flex: 1,
  },
  lecturerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  lecturerEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  lecturerNip: {
    fontSize: 14,
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 4,
    marginLeft: 8,
  },
  iconButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 16,
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
});