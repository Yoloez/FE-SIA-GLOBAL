import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

// Tipe data untuk objek Subject
interface Subject {
  id: number;
  name_subject: string;
}

// <-- 1. Tambahkan tipe data untuk objek AcademicPeriod
interface AcademicPeriod {
  id: number;
  name: string;
}

export default function CreateClassScreen() {
  const { token } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [codeClass, setCodeClass] = useState("");
  const [memberClass, setMemberClass] = useState("");
  const [schedule, setSchedule] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [subjectsResponse, periodsResponse] = await Promise.all([api.get("/manager/subjects"), api.get("/manager/academic-periods")]);
        setSubjects(subjectsResponse.data.data);
        setPeriods(periodsResponse.data.data);
      } catch (error) {
        Alert.alert("Error", "Gagal memuat data awal. Pastikan server berjalan.");
      }
    };
    fetchInitialData();
  }, []);

  const handleCreateClass = async () => {
    // <-- 5. Tambahkan validasi untuk selectedPeriod
    if (!selectedSubject || !selectedPeriod || !codeClass.trim() || !memberClass.trim() || !schedule.trim()) {
      Alert.alert("Input Tidak Valid", "Semua kolom wajib diisi.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/manager/classes", {
        // <-- 6. Tambahkan academic_period_id ke dalam payload
        id_subject: selectedSubject,
        academic_period_id: selectedPeriod,
        code_class: codeClass,
        member_class: parseInt(memberClass, 10),
        schedule: schedule,
      });
      Alert.alert("Sukses", "Kelas baru berhasil dibuat.");
      router.back();
    } catch (error) {
      const message = "Terjadi kesalahan.";
      Alert.alert("Gagal", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView contentContainerStyle={styles.container}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buat Kelas Baru</Text>
        </View>

        {/* Add Icon Button */}
        <View style={styles.addIconContainer}>
          <View style={styles.addIconCircle}>
            <Ionicons name="add" size={32} color="#ffffff" />
          </View>
          <Text style={styles.addText}>Tambah Foto</Text>
        </View>

        {/* Form  */}
        <Text style={styles.label}>Pilih Periode Akademik *</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedPeriod} onValueChange={(itemValue) => setSelectedPeriod(itemValue)} style={styles.picker}>
            <Picker.Item label="-- Pilih Periode --" value={null} />
            {periods.map((period) => (
              <Picker.Item key={period.id} label={period.name} value={period.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Pilih Mata Kuliah *</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedSubject} onValueChange={(itemValue) => setSelectedSubject(itemValue)} style={styles.picker}>
            <Picker.Item label="-- Pilih Mata Kuliah --" value={null} />
            {subjects.map((subject) => (
              <Picker.Item key={subject.id} label={subject.name_subject} value={subject.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Kode Kelas *</Text>
        <TextInput style={styles.input} value={codeClass} onChangeText={setCodeClass} placeholder="Contoh: A, B, Pagi" />

        <Text style={styles.label}>Kapasitas Kelas *</Text>
        <TextInput style={styles.input} value={memberClass} onChangeText={setMemberClass} placeholder="Contoh: 40" keyboardType="numeric" />

        <Text style={styles.label}>Jadwal *</Text>
        <TextInput style={styles.input} value={schedule} onChangeText={setSchedule} placeholder="Contoh: Senin, 10:00 - 12:00" />

        <View style={styles.buttonContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#DABC4E" />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleCreateClass}>
              <Text style={styles.buttonText}>Buat Kelas</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#015023" },
  container: { paddingBottom: 40 },
  
  // Style untuk header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 10,
    
  },

  
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  
  // Style untuk icon Add 
  addIconContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  addIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  addText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  
  // Style form 
  label: { fontSize: 16, fontWeight: "600", color: "#ffffff", marginBottom: 8, paddingHorizontal: 20 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    marginHorizontal: 20,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#DABC4E",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#015023",
    fontSize: 18,
    fontWeight: "bold",
  },
});