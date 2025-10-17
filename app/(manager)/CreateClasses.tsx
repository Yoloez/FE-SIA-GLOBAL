import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

const IP_ADDRESS = "192.168.0.159"; //ip rumah
// const IP_ADDRESS = "10.33.65.27"; //dtedi ip
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

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
      if (!token) return;
      try {
        const [subjectsResponse, periodsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/manager/subjects`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/manager/academic-periods`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setSubjects(subjectsResponse.data.data);
        setPeriods(periodsResponse.data.data);
      } catch (error) {
        Alert.alert("Error", "Gagal memuat data awal. Pastikan server berjalan.");
      }
    };
    fetchInitialData();
  }, [token]);

  const handleCreateClass = async () => {
    // <-- 5. Tambahkan validasi untuk selectedPeriod
    if (!selectedSubject || !selectedPeriod || !codeClass.trim() || !memberClass.trim() || !schedule.trim()) {
      Alert.alert("Input Tidak Valid", "Semua kolom wajib diisi.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/manager/classes`,
        {
          // <-- 6. Tambahkan academic_period_id ke dalam payload
          id_subject: selectedSubject,
          academic_period_id: selectedPeriod,
          code_class: codeClass,
          member_class: parseInt(memberClass, 10),
          schedule: schedule,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
      <Stack.Screen options={{ title: "Buat Kelas Baru", presentation: "modal", headerTitleAlign: "center" }} />
      <ScrollView contentContainerStyle={styles.container}>
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
            <ActivityIndicator size="large" color="#015023" />
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
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: "#015023",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
