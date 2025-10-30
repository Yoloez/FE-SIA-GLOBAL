import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios"; // Pastikan Anda menggunakan agen axios

// Definisikan tipe data untuk Kelas Dosen
interface LecturerClass {
  id_class: number;
  code_class: string;
  subject: {
    name_subject: string;
  };
  academic_period: {
    name: string;
  };
}

export default function LecturerClassesScreen() {
  const [classes, setClasses] = useState<LecturerClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk mengambil daftar kelas yang diajar
  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/lecturer/classes");
      setClasses(response.data.data);
    } catch (error) {
      alert("Gagal memuat daftar kelas Anda.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, [fetchClasses])
  );

  // Komponen untuk merender setiap kartu kelas
  const renderItem = ({ item }: { item: LecturerClass }) => (
    <TouchableOpacity
      style={styles.card}
      // Arahkan ke halaman detail nilai, kirimkan classId
      onPress={() => router.push(`/(dosen)/class-grades/${item.id_class}`)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.subject.name_subject}</Text>
        <Text style={styles.cardSubtitle}>
          Kelas {item.code_class} - {item.academic_period.name}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Input Nilai" }} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kelas yang Anda Ajar</Text>
        <Text style={styles.headerSubtitle}>Pilih kelas untuk menginput nilai</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#015023" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={classes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id_class.toString()}
          contentContainerStyle={styles.container}
          ListEmptyComponent={<Text style={styles.emptyText}>Anda belum ditugaskan untuk mengajar di kelas manapun.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f4f7" },
  header: { backgroundColor: "#015023", padding: 20, paddingTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff", textAlign: "center" },
  headerSubtitle: { fontSize: 16, color: "#d0e0d8", textAlign: "center" },
  container: { padding: 15 },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    elevation: 2,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  cardSubtitle: { fontSize: 14, color: "#666" },
  emptyText: { textAlign: "center", color: "#666", marginTop: 50, fontSize: 16 },
});
