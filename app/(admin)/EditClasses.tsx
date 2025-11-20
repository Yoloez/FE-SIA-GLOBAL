import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { handleApiError } from "../../utils/errorHandler";

interface Subject {
  id_subject: number;
  name_subject: string;
}

interface AcademicPeriod {
  id_academic_period: number;
  name: string;
}

const DAY_OPTIONS = [
  { label: "Senin", value: 1 },
  { label: "Selasa", value: 2 },
  { label: "Rabu", value: 3 },
  { label: "Kamis", value: 4 },
  { label: "Jumat", value: 5 },
  { label: "Sabtu", value: 6 },
  { label: "Minggu", value: 7 },
];

export default function EditClassScreen() {
  const params = useLocalSearchParams();
  const classId = params.id_class as string;

  // Form state
  const [codeClass, setCodeClass] = useState("");
  const [memberClass, setMemberClass] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Data state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch subjects, periods, and class detail
      const [subjectsRes, periodsRes, classRes] = await Promise.all([
        api.get("/manager/subjects"),
        api.get("/academic-periods"),
        api.get(`/manager/classes/${classId}`),
      ]);

      // Handle response format
      const subjectsData = subjectsRes.data?.data || subjectsRes.data || [];
      const periodsData = periodsRes.data?.data || periodsRes.data || [];
      const classData = classRes.data?.data || classRes.data;

      console.log("Class data:", classData);

      setSubjects(subjectsData);
      setPeriods(periodsData);

      // Populate form with existing data
      if (classData) {
        setCodeClass(classData.code_class || "");
        setMemberClass(classData.member_class?.toString() || "");
        
        // Handle id_subject if it's an object or number
        const subId = typeof classData.id_subject === 'object' 
          ? classData.id_subject.id_subject 
          : classData.id_subject;
        setSubjectId(subId?.toString() || "");
        
        setPeriodId(classData.id_academic_period?.toString() || "");
        setDayOfWeek(classData.day_of_week || 1);
        setStartTime(classData.start_time || "");
        setEndTime(classData.end_time || "");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Gagal memuat data. Silakan coba lagi.");
    } finally {
      setIsLoadingData(false);
    }
  };

  const validateForm = () => {
    if (!codeClass.trim()) {
      Alert.alert("Validasi", "Kode kelas tidak boleh kosong");
      return false;
    }
    if (!memberClass.trim() || parseInt(memberClass) <= 0) {
      Alert.alert("Validasi", "Kapasitas kelas harus lebih dari 0");
      return false;
    }
    if (!subjectId) {
      Alert.alert("Validasi", "Pilih mata kuliah");
      return false;
    }
    if (!periodId) {
      Alert.alert("Validasi", "Pilih periode akademik");
      return false;
    }
    if (!startTime.trim()) {
      Alert.alert("Validasi", "Waktu mulai tidak boleh kosong (format: HH:MM)");
      return false;
    }
    if (!endTime.trim()) {
      Alert.alert("Validasi", "Waktu selesai tidak boleh kosong (format: HH:MM)");
      return false;
    }

    // Validasi format waktu
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      Alert.alert("Validasi", "Format waktu mulai tidak valid (gunakan HH:MM)");
      return false;
    }
    if (!timeRegex.test(endTime)) {
      Alert.alert("Validasi", "Format waktu selesai tidak valid (gunakan HH:MM)");
      return false;
    }

    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    Alert.alert(
      "Konfirmasi Update",
      "Apakah Anda yakin ingin mengupdate data kelas ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Update",
          onPress: async () => {
            setIsLoading(true);
            try {
              const updateData = {
                code_class: codeClass.trim(),
                member_class: parseInt(memberClass),
                id_subject: parseInt(subjectId),
                id_academic_period: parseInt(periodId),
                day_of_week: dayOfWeek,
                start_time: startTime.trim(),
                end_time: endTime.trim(),
              };

              console.log("Updating class with data:", updateData);

              await api.put(`/manager/classes/${classId}`, updateData);

              Alert.alert("Sukses", "Data kelas berhasil diupdate", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error("Update error:", error);
              const apiError = handleApiError(error);
              Alert.alert("Gagal", apiError.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD43B" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Edit Kelas",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Kode Kelas */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kode Kelas *</Text>
              <TextInput
                style={styles.input}
                value={codeClass}
                onChangeText={setCodeClass}
                placeholder="Contoh: A, B, C"
                placeholderTextColor="#999"
                editable={!isLoading}
              />
            </View>

            {/* Mata Kuliah */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mata Kuliah *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={subjectId}
                  onValueChange={(value) => setSubjectId(value)}
                  style={styles.picker}
                  enabled={!isLoading}
                >
                  <Picker.Item label="Pilih Mata Kuliah" value="" />
                  {subjects.map((subject) => (
                    <Picker.Item
                      key={subject.id_subject}
                      label={subject.name_subject}
                      value={subject.id_subject.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Periode Akademik */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Periode Akademik *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={periodId}
                  onValueChange={(value) => setPeriodId(value)}
                  style={styles.picker}
                  enabled={!isLoading}
                >
                  <Picker.Item label="Pilih Periode" value="" />
                  {periods.map((period) => (
                    <Picker.Item
                      key={period.id_academic_period}
                      label={period.name}
                      value={period.id_academic_period.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Hari */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hari *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={dayOfWeek}
                  onValueChange={(value) => setDayOfWeek(value)}
                  style={styles.picker}
                  enabled={!isLoading}
                >
                  {DAY_OPTIONS.map((day) => (
                    <Picker.Item
                      key={day.value}
                      label={day.label}
                      value={day.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Waktu Mulai & Selesai */}
            <View style={styles.timeRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Waktu Mulai *</Text>
                <TextInput
                  style={styles.input}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="08:00"
                  placeholderTextColor="#999"
                  editable={!isLoading}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Waktu Selesai *</Text>
                <TextInput
                  style={styles.input}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="10:00"
                  placeholderTextColor="#999"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Kapasitas */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kapasitas Mahasiswa *</Text>
              <TextInput
                style={styles.input}
                value={memberClass}
                onChangeText={setMemberClass}
                placeholder="Contoh: 40"
                placeholderTextColor="#999"
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Update Button */}
          <TouchableOpacity
            style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
            onPress={handleUpdate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#015023" />
            ) : (
              <Text style={styles.updateButtonText}>Update Kelas</Text>
            )}
          </TouchableOpacity>
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
    flex: 1,
    backgroundColor: "#015023",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  formContainer: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#F5EFD3",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    color: "#333",
    fontSize: 15,
    borderWidth: 2,
    borderColor: "#333",
  },
  pickerContainer: {
    backgroundColor: "#F5EFD3",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#333",
    overflow: "hidden",
  },
  picker: {
    color: "#333",
  },
  timeRow: {
    flexDirection: "row",
  },
  updateButton: {
    backgroundColor: "#FFD43B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 2,
    borderColor: "#333",
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: "#015023",
    fontSize: 16,
    fontWeight: "700",
  },
});