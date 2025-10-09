import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

const IP_ADDRESS = "192.168.0.159";
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

export default function CreateClassScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [codeClass, setCodeClass] = useState("");
  const [memberClass, setMemberClass] = useState("");
  const [schedule, setSchedule] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/manager/subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubjects(response.data.data);
      } catch (error) {
        Alert.alert("Error", "Gagal memuat daftar mata kuliah.");
      }
    };
    fetchSubjects();
  }, [token]);

  const handleCreateClass = async () => {
    if (!selectedSubject || !codeClass || !memberClass || !schedule) {
      Alert.alert("Error", "Semua field wajib diisi.");
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/manager/classes`,
        {
          id_subject: selectedSubject,
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
      const message = error.response?.data?.message || "Terjadi kesalahan.";
      Alert.alert("Gagal", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pilih Mata Kuliah</Text>
      <Picker selectedValue={selectedSubject} onValueChange={(itemValue) => setSelectedSubject(itemValue)} style={styles.input}>
        <Picker.Item label="-- Pilih Mata Kuliah --" value={null} />
        {subjects.map((subject) => (
          <Picker.Item key={subject.id_subject} label={subject.name_subject} value={subject.id_subject} />
        ))}
      </Picker>

      <Text style={styles.label}>Kode Kelas</Text>
      <TextInput style={styles.input} value={codeClass} onChangeText={setCodeClass} placeholder="Contoh: A, B, Pagi" />

      <Text style={styles.label}>Jumlah Anggota Maksimal</Text>
      <TextInput style={styles.input} value={memberClass} onChangeText={setMemberClass} placeholder="Contoh: 40" keyboardType="numeric" />

      <Text style={styles.label}>Jadwal</Text>
      <TextInput style={styles.input} value={schedule} onChangeText={setSchedule} placeholder="Contoh: Senin, 10:00 - 12:00" />

      <Button title={isLoading ? "Membuat..." : "Buat Kelas"} onPress={handleCreateClass} disabled={isLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  label: { fontSize: 16, marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10, marginBottom: 20 },
});
