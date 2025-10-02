import { Urbanist_400Regular, useFonts } from "@expo-google-fonts/urbanist";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAlert from "../components/CustomAlert"; // <-- 1. Impor komponen CustomAlert

export default function ForgotPasswordScreen() {
  let [fontsLoaded] = useFonts({
    Urbanist_400Regular,
  });

  const [email, setEmail] = useState("");
  const router = useRouter();

  // <-- 2. Buat state untuk mengontrol CustomAlert
  const [isAlertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertButtons, setAlertButtons] = useState<any[]>([]); // State untuk tombol

  const handleSendResetLink = () => {
    if (email === "") {
      // <-- 3. Atur konten alert untuk error dan tampilkan
      setAlertTitle("Input Kosong");
      setAlertMessage("Silakan masukkan alamat email Anda.");
      setAlertButtons([{ text: "OK", onPress: () => {} }]);
      setAlertVisible(true);
    } else {
      // <-- 4. Atur konten alert untuk sukses dan tampilkan
      setAlertTitle("Tautan Terkirim");
      setAlertMessage(`Jika email ${email} terdaftar, tautan reset password akan dikirimkan.`);
      setAlertButtons([
        {
          text: "OK",
          onPress: () => router.back(), // Kembali ke login setelah menekan OK
        },
      ]);
      setAlertVisible(true);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.content}>
          <Image source={require("../assets/images/logo-ugn.png")} style={styles.title} />

          <Text style={styles.infoText}>Masukkan email Anda yang terdaftar untuk menerima tautan pemulihan password.</Text>

          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="user@mail.com" value={email} onChangeText={setEmail} placeholderTextColor="grey" keyboardType="email-address" autoCapitalize="none" />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSendResetLink}>
            <Text style={styles.buttonText}>Kirim Tautan Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Kembali ke Login</Text>
          </TouchableOpacity>
        </View>

        {/* <-- 5. Render komponen CustomAlert di sini */}
        <CustomAlert visible={isAlertVisible} title={alertTitle} message={alertMessage} onClose={() => setAlertVisible(false)} buttons={alertButtons} />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ... (Stylesheet Anda tetap sama)
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 150,
    height: 170,
    alignSelf: "center",
    marginBottom: 45,
  },
  infoText: {
    fontFamily: "Urbanist_400Regular",
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
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
  backButton: {
    marginTop: 25,
    alignSelf: "center",
  },
  backButtonText: {
    fontFamily: "Urbanist_400Regular",
    color: "white",
    fontSize: 16,
  },
});
