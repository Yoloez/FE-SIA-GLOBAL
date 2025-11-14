import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";

// Definisikan tipe data untuk item yang kita terima
interface GradeItem {
  id_class: number;
  code_class: string;
  subject: {
    name_subject: string;
  };
  grade: {
    grade: string;
  } | null;
}

// Tipe data untuk seksi (Periode Akademik)
interface GradeSection {
  title: string; // Nama Periode
  data: GradeItem[]; // Array kelas di dalam periode tsb
}

export default function GradesScreen() {
  const [sections, setSections] = useState<GradeSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/student/classes");
      const groupedData = response.data.data; // Ini adalah OBJEK, bukan array

      // --- PERUBAHAN KUNCI: Ubah OBJEK menjadi ARRAY ---
      // Ubah { "Semester 1": [...], "Semester 2": [...] }
      // menjadi [ { title: "Semester 1", data: [...] }, { title: "Semester 2", data: [...] } ]
      const transformedSections = Object.keys(groupedData).map((periodName) => ({
        title: periodName,
        data: groupedData[periodName],
      }));

      setSections(transformedSections);
    } catch (error) {
      console.error("Gagal memuat nilai:", error.response?.data);
      alert("Gagal memuat daftar nilai Anda.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGrades();
    }, [fetchGrades])
  );

  // Komponen untuk merender KARTU KELAS
  const renderItem = ({ item }: { item: GradeItem }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.subjectName}>{item.subject.name_subject}</Text>
        <Text style={styles.className}>Kelas {item.code_class}</Text>
      </View>
      <View style={[styles.gradeContainer, !item.grade && styles.gradeContainerEmpty]}>
        <Text style={styles.gradeText}>{item.grade ? item.grade.grade : "-"}</Text>
      </View>
    </View>
  );

  // Komponen untuk merender HEADER PERIODE
  const renderSectionHeader = ({ section: { title } }: { section: GradeSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Transkrip Nilai" }} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nilai Anda</Text>
        <Text style={styles.headerSubtitle}>Nilai akhir per mata kuliah</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#015023" style={{ flex: 1 }} />
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id_class.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada nilai yang diinput untuk Anda.</Text>
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
  // --- STYLE BARU UNTUK HEADER SEKSI ---
  sectionHeader: {
    paddingVertical: 10,
    marginTop: 10,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#015023",
    paddingHorizontal: 15,
  },
  // ------------------------------------
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10, // Beri jarak dari header seksi
    elevation: 2,
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
  gradeContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#015023",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
  },
  gradeContainerEmpty: {
    backgroundColor: "#adb5bd", // Warna abu-abu jika nilai kosong
  },
  gradeText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
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
