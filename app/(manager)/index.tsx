import axios from "axios";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

// Definisikan IP dan URL API Anda
const IP_ADDRESS = "192.168.0.159"; // Ganti dengan IP Address laptop Anda
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

export default function ManagerDashboardScreen() {
  const { token, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/manager/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(response.data.data);
    } catch (error) {
      alert("Gagal memuat daftar kelas.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, [fetchClasses])
  );

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(manager)/${item.id_class}`)}>
      <Text style={styles.cardTitle}>{item.subject.name_subject}</Text>
      <Text style={styles.cardSubtitle}>Kode: {item.code_class}</Text>
      <Text style={styles.cardInfo}>
        Anggota: {item.students.length} / {item.member_class}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={() => router.push("/(manager)/CreateClasses")}>
          <Text style={styles.buttonText}>+ Buat Kelas Baru</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: "red", width: "100%", padding: 15, borderRadius: 8, alignItems: "center" }} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push("/(manager)/CreateSubjects")}>
          <Text style={styles.buttonText}>+ Tambah Mata Kuliah Baru</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator size="large" color="#015023" />
        ) : (
          <FlatList data={classes} renderItem={renderItem} keyExtractor={(item) => item.id_class.toString()} ListEmptyComponent={<Text style={styles.emptyText}>Belum ada kelas yang dibuat.</Text>} style={{ width: "100%" }} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f4f7" },
  container: { flex: 1, padding: 20, alignItems: "center" },
  button: { backgroundColor: "#015023", padding: 15, borderRadius: 8, width: "100%", alignItems: "center", marginBottom: 20 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 8, width: "100%", marginBottom: 10, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardSubtitle: { fontSize: 14, color: "#666" },
  cardInfo: { fontSize: 14, color: "#333", marginTop: 5 },
  emptyText: { color: "#666", marginTop: 20 },
});
