import { ThemedText } from "@/components/ThemedText";
import { Urbanist_400Regular, Urbanist_600SemiBold, useFonts } from "@expo-google-fonts/urbanist";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Device from "expo-device";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
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

  const NOTIF_PERMISSION_KEY = "notifications_permission_status";
  const EXPO_PUSH_TOKEN_KEY = "expo_push_token";

  const registerPushToken = async () => {
    try {
      console.log("🔄 Getting Expo Push Token...");
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: "e1d2b90f-3cad-4f8a-bb98-ecff8f68a39f", // Your Expo project ID from app.json
      });

      console.log("✅ Expo Push Token obtained:", token.data);
      await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token.data);

      // Get device information
      const deviceId = Device.osBuildId || Device.osInternalBuildId || undefined;
      const deviceName = Device.deviceName || Device.modelName || undefined;

      console.log("📱 Device Info:", { deviceId, deviceName, platform: Platform.OS });

      // Send token to backend
      try {
        console.log("📤 Registering push token to backend...");
        await api.post("/device-tokens/register", {
          expo_push_token: token.data,
          device_id: deviceId,
          device_name: deviceName,
          platform: Platform.OS,
        });
        console.log("✅ Push token successfully registered to backend");
      } catch (backendError) {
        console.log("⚠️ Failed to register token to backend:", backendError);
        // Token is still stored locally, can retry later
      }

      return token.data;
    } catch (error) {
      console.log("❌ Failed to get push token:", error);
      return null;
    }
  };

  const requestNotificationPermissionIfNeeded = async () => {
    try {
      // Check existing permission status
      const existing = await Notifications.getPermissionsAsync();
      console.log("📱 Current notification permission status:", existing.status);

      if (existing.status === "granted") {
        await AsyncStorage.setItem(NOTIF_PERMISSION_KEY, "granted");
        // Register push token if already granted
        await registerPushToken();
        return;
      }

      // Show explanation modal before requesting system permission
      return new Promise<void>((resolve) => {
        setAlertTitle("🔔 Aktifkan Notifikasi");
        setAlertMessage(
          "Agar Anda tidak ketinggalan informasi penting seperti:\n\n" + "• Jadwal kuliah dan perubahan\n" + "• Pengumuman akademik\n" + "• Reminder presensi\n" + "• Pesan dari dosen/mahasiswa\n\n" + "Izinkan aplikasi mengirim notifikasi?"
        );
        setAlertButtons([
          {
            text: "Nanti Saja",
            onPress: async () => {
              console.log("❌ User menolak permission notifikasi");
              await AsyncStorage.setItem(NOTIF_PERMISSION_KEY, "denied");
              setAlertVisible(false);
              resolve();
            },
          },
          {
            text: "Izinkan",
            onPress: async () => {
              setAlertVisible(false);
              try {
                console.log("🔑 Requesting notification permission...");
                const result = await Notifications.requestPermissionsAsync();
                const status = result.status;
                console.log("📋 Permission result:", status);

                await AsyncStorage.setItem(NOTIF_PERMISSION_KEY, status);

                // Register push token if permission granted
                if (status === "granted") {
                  console.log("✅ Permission granted, registering push token...");
                  await registerPushToken();

                  // Show success message
                  setAlertTitle("✅ Notifikasi Aktif");
                  setAlertMessage("Notifikasi berhasil diaktifkan. Anda akan menerima pemberitahuan penting.");
                  setAlertButtons([
                    {
                      text: "OK",
                      onPress: () => {
                        setAlertVisible(false);
                        resolve();
                      },
                    },
                  ]);
                  setAlertVisible(true);
                } else {
                  console.log("⚠️ Permission denied or restricted");
                  resolve();
                }
              } catch (e) {
                console.log("❌ Permission request error:", e);
                resolve();
              }
            },
          },
        ]);
        setAlertVisible(true);
      });
    } catch (e) {
      console.log("❌ Permission check error:", e);
    }
  };

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
      console.log("USER DATA DARI API:", userFromApi);

      // Transform user data: map 'id' to 'id_user_si' for consistency
      const transformedUser = {
        id_user_si: userFromApi.id, // Backend mengirim 'id', kita mapping ke 'id_user_si'
        name: userFromApi.name,
        email: userFromApi.email,
        role: userFromApi.roles && userFromApi.roles.length > 0 ? userFromApi.roles[0] : "mahasiswa",
      };

      console.log("USER DATA TRANSFORMED:", transformedUser);

      await login(transformedUser, accessToken);

      // After successful login, always prompt for notification permission if not granted
      const existing = await Notifications.getPermissionsAsync();
      const stored = await AsyncStorage.getItem(NOTIF_PERMISSION_KEY);

      console.log("📱 Checking notification permission...");
      console.log("System permission status:", existing.status);
      console.log("Stored permission status:", stored);

      // Show prompt if: not granted OR user never made a decision
      if (existing.status !== "granted") {
        console.log("🔔 Showing notification permission prompt...");
        await requestNotificationPermissionIfNeeded();
      } else {
        // Already granted, just register token
        console.log("✅ Notification already granted, registering token...");
        await registerPushToken();
      }
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
    <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
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
                {/* 
                <TouchableOpacity onPress={() => router.push("/ForgotPassword")}>
                  <Text style={styles.forgotPassword}>Lupa Password?</Text>
                </TouchableOpacity> */}

                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <ThemedText variant="bold" style={styles.buttonText}>
                      Login
                    </ThemedText>
                  )}
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
    color: "black",
    fontSize: 18,
    textAlign: "center",
  },
});
