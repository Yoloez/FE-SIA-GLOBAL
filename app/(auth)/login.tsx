import { Urbanist_400Regular, Urbanist_600SemiBold, useFonts } from "@expo-google-fonts/urbanist";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAlert from "../../components/CustomAlert";
import { useAuth } from "../../context/AuthContext";

const IP_ADDRESS = "192.168.0.159"; // Ganti dengan IP Address laptop Anda
const API_URL = `http://${IP_ADDRESS}:8000/api/auth/login`;

export default function LoginScreen() {
  let [fontsLoaded, fontError] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const [isAlertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertButtons, setAlertButtons] = useState<any[]>([]);

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertTitle("Login Gagal");
      setAlertMessage("Email dan password tidak boleh kosong.");
      // --- PERBAIKAN: Tambahkan properti onPress ---
      setAlertButtons([{ text: "OK", onPress: () => setAlertVisible(false) }]);
      setAlertVisible(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(API_URL, {
        email: email,
        password: password,
      });

      const responseData = response.data.data;
      const userFromApi = responseData.user;
      const accessToken = responseData.access_token;

      const transformedUser = {
        ...userFromApi,
        role: userFromApi.roles && userFromApi.roles.length > 0 ? userFromApi.roles[0] : "mahasiswa", // Fallback ke mahasiswa
      };

      await login(transformedUser, accessToken);
    } catch (error) {
      // console.error("Login Error:", error.response ? error.response.data : error.message);
      console.error("Login Error:", error);

      let title = "Koneksi Gagal";
      let message = "Tidak dapat terhubung ke server. Silakan coba lagi nanti.";

      if (axios.isAxiosError(error) && error.response) {
        title = "Login Gagal";
        message = error.response.data.message || "Email atau password yang Anda berikan salah.";
      }

      setAlertTitle(title);
      setAlertMessage(message);
      // --- PERBAIKAN: Tambahkan properti onPress ---
      setAlertButtons([{ text: "OK", onPress: () => setAlertVisible(false) }]);
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.content}>
          <Image source={require("../../assets/images/logo-ugn.png")} style={styles.title}></Image>

          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="user@mail.com" value={email} onChangeText={setEmail} placeholderTextColor="grey" keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="grey" />
          </View>

          <TouchableOpacity onPress={() => router.push("/ForgotPassword")}>
            <Text style={{ fontSize: 16, color: "white", marginTop: -7, marginBottom: 15, alignSelf: "flex-end", fontFamily: "Urbanist_400Regular" }}>Lupa Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator size="small" color="#000000" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>

          <CustomAlert visible={isAlertVisible} title={alertTitle} message={alertMessage} onClose={() => setAlertVisible(false)} buttons={alertButtons} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// STYLESHEET TIDAK DIUBAH SAMA SEKALI
const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  title: {
    justifyContent: "center",
    width: 150,
    height: 170,
    fontFamily: "Urbanist_400Regular",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 45,
    color: "white",
    alignSelf: "center",
  },
  label: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginBottom: 8,
    fontFamily: "Urbanist_400Regular",
  },
  input: {
    height: 55,
    backgroundColor: "white",
    borderColor: "black",
    borderWidth: 2,
    color: "black",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    fontFamily: "Urbanist_400Regular",
  },
  button: {
    backgroundColor: "#DABC4E",
    paddingVertical: 18,
    borderRadius: 30,
    width: "100%",
    marginTop: 20,
  },
  buttonText: {
    fontFamily: "Urbanist_400Regular",
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
