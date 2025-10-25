import { Urbanist_400Regular, Urbanist_600SemiBold, useFonts } from "@expo-google-fonts/urbanist";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import CustomAlert from "../../components/CustomAlert";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  let [fontsLoaded, fontError] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
      setAlertButtons([{ text: "OK", onPress: () => setAlertVisible(false) }]);
      setAlertVisible(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email,
        password: password,
      });

      const responseData = response.data.data;
      const userFromApi = responseData.user;
      const accessToken = responseData.access_token;

      console.log("AUTH TOKEN DITERIMA:", accessToken);

      const transformedUser = {
        ...userFromApi,
        role: userFromApi.roles && userFromApi.roles.length > 0 ? userFromApi.roles[0] : "mahasiswa",
      };

      await login(transformedUser, accessToken);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Login Error:", error.response ? error.response.data : error.message);
      }

      let title = "Koneksi Gagal";
      let message = "Tidak dapat terhubung ke server. Silakan coba lagi nanti.";

      if (axios.isAxiosError(error) && error.response) {
        title = "Login Gagal";
        message = error.response.data.message || "Email atau password yang Anda berikan salah.";
      }

      setAlertTitle(title);
      setAlertMessage(message);
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

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView} keyboardVerticalOffset={0}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.content}>
                <Image source={require("../../assets/images/logo-ugn.png")} style={styles.title} />

                <View style={styles.formContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput style={styles.inputEmail} placeholder="user@mail.com" value={email} onChangeText={setEmail} placeholderTextColor="grey" keyboardType="email-address" autoCapitalize="none" returnKeyType="next" />

                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.inputPassword}
                      placeholder="••••••••"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!isPasswordVisible}
                      placeholderTextColor="grey"
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity style={styles.eyeIcon} onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                      <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={24} color="grey" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity onPress={() => router.push("/ForgotPassword")}>
                  <Text style={styles.forgotPassword}>Lupa Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator size="small" color="#000000" /> : <Text style={styles.buttonText}>Login</Text>}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>

        <CustomAlert visible={isAlertVisible} title={alertTitle} message={alertMessage} onClose={() => setAlertVisible(false)} buttons={alertButtons} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  title: {
    width: 150,
    height: 170,
    marginBottom: 45,
    alignSelf: "center",
  },
  formContainer: {
    marginBottom: 8,
  },
  label: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginBottom: 8,
    fontFamily: "Urbanist_400Regular",
  },
  inputEmail: {
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
  inputPassword: {
    height: 55,
    backgroundColor: "white",
    borderColor: "black",
    borderWidth: 2,
    color: "black",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: "Urbanist_400Regular",
  },
  passwordContainer: {
    position: "relative",
    justifyContent: "center",
    marginBottom: 20,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    height: "100%",
    justifyContent: "center",
  },
  forgotPassword: {
    fontSize: 16,
    color: "white",
    marginBottom: 15,
    alignSelf: "flex-end",
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
