import axios from "axios";
import { Stack, router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function AddManagerScreen() {
  const { token } = useAuth();
  const isMounted = React.useRef(true);
  const isSubmitting = React.useRef(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      isSubmitting.current = false;
    };
  }, []);

  const handleAddManager = async () => {
    // Prevent double submission
    if (isSubmitting.current || isLoading) {
      console.log("Already submitting, ignoring duplicate request");
      return;
    }

    if (!name || !username || !email || !password) {
      Alert.alert("Error", "Semua kolom wajib diisi.");
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert("Error", "Password dan konfirmasi password tidak cocok.");
      return;
    }

    isSubmitting.current = true;
    setIsLoading(true);

    try {
      const response = await api.post("/admin/managers", {
        name: name,
        username: username,
        email: email,
        password: password,
        password_confirmation: passwordConfirmation,
      });

      if (!isMounted.current) return;

      console.log("Manager created successfully:", response.data);

      Alert.alert("Sukses", `Manajer "${response.data.data.name}" berhasil ditambahkan.`, [
        {
          text: "OK",
          onPress: () => {
            if (isMounted.current) {
              router.push("/(admin)");
            }
          },
        },
      ]);
    } catch (error) {
      if (!isMounted.current) return;

      if (axios.isAxiosError(error) && error.response) {
        console.error("Status Kode:", error.response.status);
        console.error("Pesan dari Server:", JSON.stringify(error.response.data, null, 2));
        const message = error.response.data?.message || "Terjadi kesalahan saat menambahkan manager.";
        Alert.alert("Gagal", message);
      } else {
        Alert.alert("Gagal", "Terjadi kesalahan yang tidak terduga.");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
      isSubmitting.current = false;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#015023",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Icon Tambah */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconPlus}>+</Text>
          </View>
          <Text style={styles.iconLabel}>Add</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Name:</Text>
          <TextInput style={styles.input} placeholder="" placeholderTextColor="#8aa899" value={name} onChangeText={setName} editable={!isLoading} />

          <Text style={styles.label}>Username:</Text>
          <TextInput style={styles.input} placeholder="" placeholderTextColor="#8aa899" value={username} onChangeText={setUsername} autoCapitalize="none" editable={!isLoading} />

          <Text style={styles.label}>Email:</Text>
          <TextInput style={styles.input} placeholder="" placeholderTextColor="#8aa899" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />

          <Text style={styles.label}>Password:</Text>
          <TextInput style={styles.input} placeholder="" placeholderTextColor="#8aa899" value={password} onChangeText={setPassword} secureTextEntry editable={!isLoading} />

          <TextInput style={[styles.input, styles.inputNoLabel]} placeholder="Confirm Password" placeholderTextColor="#8aa899" value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry editable={!isLoading} />

          {isLoading ? (
            <View style={styles.loadingButton}>
              <ActivityIndicator color="#0a4d2e" />
              <Text style={styles.loadingButtonText}>Menyimpan...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleAddManager} disabled={isLoading}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#015023",
  },
  container: {
    padding: 20,
    paddingTop: 20,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#2d6d4a",
    backgroundColor: "rgba(45, 109, 74, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  iconPlus: {
    fontSize: 40,
    color: "#2d6d4a",
    fontWeight: "300",
  },
  iconLabel: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "400",
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 8,
    fontWeight: "400",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    height: 50,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 25,
    color: "#ffffff",
  },
  inputNoLabel: {
    marginTop: -15,
  },
  button: {
    backgroundColor: "#d4af6a",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: {
    color: "#0a4d2e",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingButton: {
    backgroundColor: "#d4af6a",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    opacity: 0.7,
  },
  loadingButtonText: {
    color: "#0a4d2e",
    fontSize: 16,
    fontWeight: "600",
  },
});
