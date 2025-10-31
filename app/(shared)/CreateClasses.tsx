import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

// Tipe data untuk objek Subject
interface Subject {
  id: number;
  name_subject: string;
}

interface AcademicPeriod {
  id: number;
  name: string;
}

// Mapping hari untuk menghindari array index issues
const DAY_NAMES: { [key: number]: string } = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

export default function CreateClassScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const isMounted = useRef(true);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [codeClass, setCodeClass] = useState("");
  const [memberClass, setMemberClass] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Ubah ke single schedule (bukan array)
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState(""); // Format "HH:MM"
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    isMounted.current = true;

    const fetchInitialData = async () => {
      try {
        const [subjectsResponse, periodsResponse] = await Promise.all([api.get("/manager/subjects"), api.get("/manager/academic-periods")]);

        if (isMounted.current) {
          setSubjects(subjectsResponse.data.data || []);
          setPeriods(periodsResponse.data.data || []);
        }
      } catch (error) {
        if (isMounted.current) {
          console.error("Error fetching initial data:", error);
          Alert.alert("Error", "Gagal memuat data awal. Pastikan server berjalan.");
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Validasi format waktu HH:MM
  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  // Format input waktu secara otomatis
  const formatTimeInput = (text: string): string => {
    const cleaned = text.replace(/[^\d]/g, "");

    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
    }
    return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
  };

  const handleStartTimeChange = (text: string) => {
    const formatted = formatTimeInput(text);
    setStartTime(formatted);
  };

  const handleEndTimeChange = (text: string) => {
    const formatted = formatTimeInput(text);
    setEndTime(formatted);
  };

  const handleCreateClass = async () => {
    // Validasi input dasar
    if (!selectedSubject || !selectedPeriod || !codeClass.trim() || !memberClass.trim()) {
      Alert.alert("Input Tidak Valid", "Semua kolom wajib diisi.");
      return;
    }

    // Validasi kapasitas kelas
    const capacity = parseInt(memberClass, 10);
    if (isNaN(capacity) || capacity <= 0) {
      Alert.alert("Input Tidak Valid", "Kapasitas kelas harus berupa angka positif.");
      return;
    }

    // Validasi waktu
    if (!startTime.trim() || !endTime.trim()) {
      Alert.alert("Input Tidak Valid", "Jam mulai dan selesai harus diisi.");
      return;
    }

    if (!validateTimeFormat(startTime)) {
      Alert.alert("Format Tidak Valid", "Format jam mulai harus HH:MM (contoh: 08:00)");
      return;
    }

    if (!validateTimeFormat(endTime)) {
      Alert.alert("Format Tidak Valid", "Format jam selesai harus HH:MM (contoh: 10:00)");
      return;
    }

    // Validasi waktu mulai harus lebih awal dari waktu selesai
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      Alert.alert("Waktu Tidak Valid", "Jam mulai harus lebih awal dari jam selesai.");
      return;
    }

    setIsLoading(true);
    try {
      // Kirim data sesuai format backend yang baru
      await api.post("/manager/classes", {
        id_subject: selectedSubject,
        academic_period_id: selectedPeriod,
        code_class: codeClass,
        member_class: capacity,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
      });

      if (isMounted.current) {
        Alert.alert("Sukses", "Kelas baru berhasil dibuat.", [
          {
            text: "OK",
            onPress: () => {
              if (isMounted.current) {
                router.replace("/(manager)");
              }
            },
          },
        ]);
      }
    } catch (error: any) {
      if (isMounted.current) {
        console.error("Error creating class:", error);
        const message = error?.response?.data?.message || "Terjadi kesalahan saat membuat kelas.";
        Alert.alert("Gagal", message);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView} keyboardVerticalOffset={0}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Custom Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Buat Kelas Baru</Text>
          </View>

          {/* Form */}
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
          <TextInput style={styles.input} value={codeClass} onChangeText={setCodeClass} placeholder="Contoh: A, B, Pagi" placeholderTextColor="#999" />

          <Text style={styles.label}>Kapasitas Kelas *</Text>
          <TextInput style={styles.input} value={memberClass} onChangeText={setMemberClass} placeholder="Contoh: 40" placeholderTextColor="#999" keyboardType="numeric" maxLength={3} />

          <Text style={styles.label}>Jadwal Kelas *</Text>
          <View style={styles.scheduleForm}>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={dayOfWeek} onValueChange={(itemValue) => setDayOfWeek(itemValue)}>
                <Picker.Item label="Senin" value={1} />
                <Picker.Item label="Selasa" value={2} />
                <Picker.Item label="Rabu" value={3} />
                <Picker.Item label="Kamis" value={4} />
                <Picker.Item label="Jumat" value={5} />
                <Picker.Item label="Sabtu" value={6} />
                <Picker.Item label="Minggu" value={7} />
              </Picker>
            </View>
            <View style={styles.timeRow}>
              <TextInput style={[styles.input, styles.timeInput]} value={startTime} onChangeText={handleStartTimeChange} placeholder="Mulai (HH:MM)" placeholderTextColor="#999" keyboardType="numeric" maxLength={5} />
              <TextInput style={[styles.input, styles.timeInput]} value={endTime} onChangeText={handleEndTimeChange} placeholder="Selesai (HH:MM)" placeholderTextColor="#999" keyboardType="numeric" maxLength={5} />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#DABC4E" />
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleCreateClass} activeOpacity={0.8}>
                <Text style={styles.buttonText}>Buat Kelas</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#015023",
  },
  container: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 10,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    marginHorizontal: 20,
    fontSize: 16,
    color: "white",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 20,
    justifyContent: "center",
  },
  picker: {
    height: 50,
    color: "white",
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
  scheduleForm: {
    padding: 15,
    borderRadius: 8,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 0,
  },
  addScheduleButton: {
    backgroundColor: "#DABC4E",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
  },
  addScheduleButtonText: {
    color: "#015023",
    fontSize: 16,
    fontWeight: "600",
  },
  scheduleListContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  scheduleListTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  scheduleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    marginBottom: 10,
  },
  scheduleItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleItemNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#015023",
    marginRight: 12,
    minWidth: 30,
  },
  scheduleItemDetails: {
    flex: 1,
  },
  scheduleItemDay: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  scheduleItemTime: {
    fontSize: 14,
    color: "#666",
  },
  deleteButton: {
    padding: 8,
  },
  keyboardView: {
    flex: 1,
  },
});
