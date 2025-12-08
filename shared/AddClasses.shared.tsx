import api from "@/api/axios";
import CustomAlert from "@/components/CustomAlert";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CreateClassScreenProps {
  viewMode: "admin" | "manager";
  onBack?: () => void;
  onSuccess?: () => void;
}

interface Subject {
  id_subject: number;
  name_subject: string;
  code_subject?: string;
}

interface AcademicPeriod {
  id_academic_period: number;
  name: string;
}

const DAYS_OF_WEEK = [
  { label: "Senin", value: 1 },
  { label: "Selasa", value: 2 },
  { label: "Rabu", value: 3 },
  { label: "Kamis", value: 4 },
  { label: "Jumat", value: 5 },
  { label: "Sabtu", value: 6 },
  { label: "Minggu", value: 7 },
];

export default function CreateClassScreen({ viewMode, onBack, onSuccess }: CreateClassScreenProps) {
  const isMounted = useRef(true);

  // Form states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(0);
  const [codeClass, setCodeClass] = useState("");
  const [memberClass, setMemberClass] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // CustomAlert state
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onClose: () => {},
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const showAlert = useCallback((title: string, message: string, type: "success" | "error" | "info" = "info", onClose?: () => void) => {
    if (!isMounted.current) return;

    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onClose:
        onClose ||
        (() => {
          if (isMounted.current) {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
          }
        }),
    });
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const abortController = new AbortController();

      try {
        const [subjectsRes, periodsRes] = await Promise.all([api.get("/manager/subjects", { signal: abortController.signal }), api.get("/academic-periods", { signal: abortController.signal })]);

        if (isMounted.current) {
          const subjectsData = subjectsRes.data.data || [];
          const periodsData = periodsRes.data.data || [];

          setSubjects(subjectsData);
          setPeriods(periodsData);

          // Set default values
          if (subjectsData.length > 0) {
            setSelectedSubject(subjectsData[0].id_subject);
          }
          if (periodsData.length > 0) {
            setSelectedPeriod(periodsData[0].id_academic_period);
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError" || error.name === "CanceledError") {
          console.log("Fetch data aborted");
          return;
        }

        console.error("Error fetching data:", error);
        if (isMounted.current) {
          showAlert("Error", "Gagal memuat data. Silakan coba lagi.");
        }
      } finally {
        if (isMounted.current) {
          setIsLoadingData(false);
        }
      }
    };

    fetchData();
  }, [showAlert]);

  const validateTime = useCallback(
    (hour: string, minute: string, label: string): boolean => {
      if (!hour.trim() || !minute.trim()) {
        showAlert("Input Tidak Valid", `${label} tidak boleh kosong.`, "error");
        return false;
      }

      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);

      if (isNaN(h) || isNaN(m)) {
        showAlert("Input Tidak Valid", `${label} harus berupa angka.`, "error");
        return false;
      }

      if (h < 0 || h > 23) {
        showAlert("Input Tidak Valid", `Jam ${label} harus antara 00-23.`, "error");
        return false;
      }

      if (m < 0 || m > 59) {
        showAlert("Input Tidak Valid", `Menit ${label} harus antara 00-59.`, "error");
        return false;
      }

      return true;
    },
    [showAlert]
  );

  const handleCreateClass = useCallback(async () => {
    // Prevent double submission
    if (isLoading) return;

    // Validasi lengkap
    if (!selectedSubject || selectedSubject === 0) {
      showAlert("Input Tidak Valid", "Pilih mata kuliah terlebih dahulu.", "error");
      return;
    }

    if (!selectedPeriod || selectedPeriod === 0) {
      showAlert("Input Tidak Valid", "Pilih periode akademik terlebih dahulu.", "error");
      return;
    }

    if (!codeClass.trim()) {
      showAlert("Input Tidak Valid", "Kode kelas wajib diisi.", "error");
      return;
    }

    if (!memberClass.trim()) {
      showAlert("Input Tidak Valid", "Kapasitas kelas wajib diisi.", "error");
      return;
    }

    const capacity = parseInt(memberClass, 10);
    if (isNaN(capacity) || capacity < 1) {
      showAlert("Input Tidak Valid", "Kapasitas kelas harus angka lebih dari 0.", "error");
      return;
    }

    // Validasi waktu
    if (!validateTime(startHour, startMinute, "mulai")) return;
    if (!validateTime(endHour, endMinute, "selesai")) return;

    // Format waktu dengan padding
    const startTime = `${startHour.trim().padStart(2, "0")}:${startMinute.trim().padStart(2, "0")}`;
    const endTime = `${endHour.trim().padStart(2, "0")}:${endMinute.trim().padStart(2, "0")}`;

    // Validasi jam selesai > jam mulai
    if (startTime >= endTime) {
      showAlert("Input Tidak Valid", "Jam selesai harus lebih besar dari jam mulai.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/manager/classes", {
        id_subject: selectedSubject,
        id_academic_period: selectedPeriod,
        code_class: codeClass.trim(),
        member_class: capacity,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        is_active: true,
      });

      if (!isMounted.current) return;

      // Success response
      if (response.data.status === "success") {
        showAlert("Sukses", response.data.message || "Kelas baru berhasil dibuat.", "success", () => {
          if (isMounted.current) {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            // Small delay before callback for better UX
            setTimeout(() => {
              if (isMounted.current) {
                onSuccess?.();
              }
            }, 300);
          }
        });
      }
    } catch (error: any) {
      if (!isMounted.current) return;

      console.error("Error creating class:", error);

      let errorMessage = "Terjadi kesalahan saat membuat kelas.";

      // Handle different error responses from backend
      if (error.response) {
        const { status, data } = error.response;

        if (status === 422 && data.errors) {
          // Validation errors
          const errorMessages = Object.values(data.errors).flat();
          errorMessage = errorMessages.join("\n");
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      showAlert("Gagal", errorMessage, "error");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [selectedSubject, selectedPeriod, codeClass, memberClass, dayOfWeek, startHour, startMinute, endHour, endMinute, isLoading, validateTime, showAlert, onSuccess]);

  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor="#015023" />
        <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DABC4E" />
            <ThemedText variant="medium" style={styles.loadingText}>
              Memuat data...
            </ThemedText>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#015023" />

      <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onBack?.()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <ThemedText variant="bold" style={styles.headerTitle}>
            Buat Kelas Baru
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.formContainer}>
              {/* Periode Akademik */}
              <View style={styles.inputGroup}>
                <ThemedText variant="semibold" style={styles.label}>
                  Periode Akademik *
                </ThemedText>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={selectedPeriod} onValueChange={setSelectedPeriod} style={styles.picker}>
                    {periods.map((period) => (
                      <Picker.Item key={period.id_academic_period} label={period.name} value={period.id_academic_period} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Mata Kuliah */}
              <View style={styles.inputGroup}>
                <ThemedText variant="semibold" style={styles.label}>
                  Mata Kuliah *
                </ThemedText>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={selectedSubject} onValueChange={setSelectedSubject} style={styles.picker}>
                    {subjects.map((subject) => (
                      <Picker.Item key={subject.id_subject} label={subject.name_subject} value={subject.id_subject} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Kode Kelas */}
              <View style={styles.inputGroup}>
                <ThemedText variant="semibold" style={styles.label}>
                  Kode Kelas *
                </ThemedText>
                <View style={styles.inputWrapper}>
                  <Ionicons name="bookmark-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput style={styles.input} value={codeClass} onChangeText={setCodeClass} placeholder="Contoh: A, B, Pagi" placeholderTextColor="#9ca3af" maxLength={10} />
                </View>
              </View>

              {/* Kapasitas */}
              <View style={styles.inputGroup}>
                <ThemedText variant="semibold" style={styles.label}>
                  Kapasitas Kelas *
                </ThemedText>
                <View style={styles.inputWrapper}>
                  <Ionicons name="people-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput style={styles.input} value={memberClass} onChangeText={setMemberClass} placeholder="Contoh: 40" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
                </View>
              </View>

              {/* Hari */}
              <View style={styles.inputGroup}>
                <ThemedText variant="semibold" style={styles.label}>
                  Hari Perkuliahan *
                </ThemedText>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={dayOfWeek} onValueChange={setDayOfWeek} style={styles.picker}>
                    {DAYS_OF_WEEK.map((day) => (
                      <Picker.Item key={day.value} label={day.label} value={day.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Jam Mulai */}
              <View style={styles.inputGroup}>
                <ThemedText variant="semibold" style={styles.label}>
                  Jam Mulai *
                </ThemedText>
                <View style={styles.timeInputRow}>
                  <View style={[styles.inputWrapper, styles.timeInputWrapper]}>
                    <TextInput style={styles.timeInput} value={startHour} onChangeText={setStartHour} placeholder="08" placeholderTextColor="#9ca3af" keyboardType="number-pad" maxLength={2} />
                  </View>
                  <ThemedText variant="bold" style={styles.timeSeparator}>
                    :
                  </ThemedText>
                  <View style={[styles.inputWrapper, styles.timeInputWrapper]}>
                    <TextInput style={styles.timeInput} value={startMinute} onChangeText={setStartMinute} placeholder="00" placeholderTextColor="#9ca3af" keyboardType="number-pad" maxLength={2} />
                  </View>
                </View>
                <ThemedText style={styles.helperText}>Format 24 jam (contoh: 08:00)</ThemedText>
              </View>

              {/* Jam Selesai */}
              {/* Jam Selesai */}
              <View style={styles.inputGroup}>
                <ThemedText variant="semibold" style={styles.label}>
                  Jam Selesai *
                </ThemedText>
                <View style={styles.timeInputRow}>
                  <View style={[styles.inputWrapper, styles.timeInputWrapper]}>
                    <TextInput style={styles.timeInput} value={endHour} onChangeText={setEndHour} placeholder="10" placeholderTextColor="#9ca3af" keyboardType="number-pad" maxLength={2} />
                  </View>
                  <ThemedText variant="bold" style={styles.timeSeparator}>
                    :
                  </ThemedText>
                  <View style={[styles.inputWrapper, styles.timeInputWrapper]}>
                    <TextInput style={styles.timeInput} value={endMinute} onChangeText={setEndMinute} placeholder="00" placeholderTextColor="#9ca3af" keyboardType="number-pad" maxLength={2} />
                  </View>
                </View>
                <ThemedText style={styles.helperText}>Harus lebih besar dari jam mulai</ThemedText>
              </View>

              {/* Submit Button */}
              <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleCreateClass} activeOpacity={0.8} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#015023" />
                    <ThemedText variant="semibold" style={styles.buttonText}>
                      Membuat kelas...
                    </ThemedText>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#015023" />
                    <ThemedText variant="bold" style={styles.buttonText}>
                      Buat Kelas
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* CustomAlert */}
        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={alertConfig.onClose} />
      </LinearGradient>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#ffffff",
    marginBottom: 8,
    marginLeft: 5,
  },
  pickerContainer: {
    backgroundColor: "rgba(245, 239, 211, 0.95)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  picker: {
    height: 50,
    color: "#1f2937",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 239, 211, 0.95)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 14,
    color: "#1f2937",
    fontFamily: "Urbanist",
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  timeInputWrapper: {
    flex: 1,
    paddingHorizontal: 0,
    justifyContent: "center",
  },
  timeInput: {
    height: 50,
    fontSize: 24,
    color: "#1f2937",
    fontFamily: "Urbanist",
    fontWeight: "600",
    textAlign: "center",
  },
  timeSeparator: {
    fontSize: 24,
    color: "#ffffff",
    marginHorizontal: 12,
  },
  helperText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 6,
    marginLeft: 5,
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#DABC4E",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#015023",
    fontSize: 16,
  },
});
