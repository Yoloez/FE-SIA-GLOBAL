import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

// Definisikan tipe data untuk schedule item
interface ScheduleItem {
  id_class: number;
  code_class: string;
  schedule: string;
  subject: {
    name_subject: string;
  };
}

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      // Panggil endpoint baru di backend
      const response = await api.get("/student/schedules");
      setSchedules(response.data.data);
    } catch (error) {
      if (axios.isAxiosError(error)) console.error("Gagal memuat jadwal:", error.response?.data);
      alert("Gagal memuat jadwal Anda.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
    }, [fetchSchedules])
  );

  const renderItem = ({ item }: { item: ScheduleItem }) => (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name="time-outline" size={28} color="#015023" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.subjectName}>{item.subject.name_subject}</Text>
        <Text style={styles.className}>Kelas: {item.code_class}</Text>
        <Text style={styles.scheduleText}>{item.schedule}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Jadwal Kuliah" }} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jadwal Kuliah Anda</Text>
        <Text style={styles.headerSubtitle}>Semester Ini</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#015023" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={schedules}
          renderItem={renderItem}
          keyExtractor={(item) => item.id_class.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Anda belum memiliki jadwal untuk semester ini.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f4f7" },
  header: {
    backgroundColor: "#015023",
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#d0e0d8",
    textAlign: "center",
  },
  listContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    backgroundColor: "#e8f5e9",
    padding: 15,
    borderRadius: 30,
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  className: {
    fontSize: 14,
    color: "#555",
  },
  scheduleText: {
    fontSize: 14,
    color: "#015023",
    fontWeight: "500",
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: "30%",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    fontSize: 16,
  },
});
