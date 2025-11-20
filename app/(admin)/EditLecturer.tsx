import api from "@/api/axios";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function EditLecturerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [formData, setFormData] = useState({
    name: (params.name as string) || "",
    nip: (params.employee_id_number as string) || "",
    email: (params.email as string) || "",
    password: "",
    image: params.profile_image ? (params.profile_image as string) : null,
  });

  const lecturerId = params.id_user_si || params.id;
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Pilih gambar dari galeri
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Izinkan akses ke galeri untuk memilih foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true, // PENTING: Enable base64
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  // Ambil foto dari kamera
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Izinkan akses ke kamera untuk mengambil foto.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true, // PENTING: Enable base64
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  // Tampilkan pilihan sumber foto
  const showImageOptions = () => {
    Alert.alert("Pilih Foto", "Pilih sumber foto profil", [
      { text: "Galeri", onPress: pickImage },
      { text: "Kamera", onPress: takePhoto },
      { text: "Batal", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    // Validasi input
    if (!formData.name.trim()) {
      Alert.alert('Validasi', 'Nama tidak boleh kosong.');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validasi', 'Email tidak boleh kosong.');
      return;
    }

    try {
      setIsSaving(true);
      
      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        employee_id_number: formData.nip.trim(),
      };

      // Hanya kirim password jika diisi
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      // Jika ada gambar baru (URI lokal), kirim juga
      if (formData.image && !formData.image.startsWith('http')) {
        updateData.profile_image = formData.image;
      }

      console.log('Sending data:', updateData); // Debug

      await api.put(`/manager/lecturers/${lecturerId}`, updateData);
      
      Alert.alert('Sukses', 'Data dosen berhasil diperbarui.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating lecturer:', error);
      console.error('Error response:', error.response?.data); // Debug
      const errorMessage = error.response?.data?.message || 'Gagal memperbarui data dosen.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#015023" />
      <Stack.Screen
        options={{
          title: "Edit Dosen",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={28} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Profile Image */}
          <View style={styles.profileSection}>
            <TouchableOpacity style={styles.profileImageContainer} onPress={showImageOptions}>
              <Image 
                source={{ uri: formData.image || "https://via.placeholder.com/150" }}
                style={styles.profileImage}
              />
              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={16} color="#015023" />
              </View>
            </TouchableOpacity>
            <Text style={styles.editText}>Ubah Foto</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama:</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => handleChange('name', value)}
                placeholder="Masukkan nama dosen"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NIP:</Text>
              <TextInput
                style={styles.input}
                value={formData.nip}
                onChangeText={(value) => handleChange('nip', value)}
                placeholder="Masukkan NIP"
                keyboardType="numeric"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email:</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                placeholder="Masukkan email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password Baru (Opsional):</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
                placeholder="Kosongkan jika tidak ingin mengubah"
                secureTextEntry
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <Text style={styles.helperText}>
                * Kosongkan password jika tidak ingin mengubah
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#015023" />
            ) : (
              <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#015023' 
  },
  container: { 
    flex: 1, 
    backgroundColor: '#015023' 
  },
  content: { 
    padding: 20 
  },
  profileSection: { 
    alignItems: 'center', 
    marginBottom: 30 
  },
  profileImageContainer: { 
    position: 'relative' 
  },
  profileImage: { 
    width: 120, 
    height: 120, 
    borderRadius: 60 
  },
  cameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    backgroundColor: '#e8c468',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#015023',
    elevation: 3,
  },
  editText: { 
    color: '#fff', 
    fontSize: 14, 
    marginTop: 10 
  },
  formContainer: { 
    marginBottom: 20 
  },
  inputGroup: { 
    marginBottom: 20 
  },
  label: { 
    color: '#fff', 
    fontSize: 14, 
    marginBottom: 8,
    fontWeight: '500'
  },
  input: { 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    borderColor: 'rgba(255, 255, 255, 0.2)', 
    borderWidth: 1, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    color: '#fff', 
    fontSize: 16 
  },
  helperText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  saveButton: { 
    backgroundColor: '#e8c468', 
    paddingVertical: 16, 
    borderRadius: 25, 
    alignItems: 'center', 
    marginTop: 10,
    marginBottom: 30
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: { 
    color: '#015023', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});