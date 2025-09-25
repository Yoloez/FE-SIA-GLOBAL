import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function EditProfilScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ini Halaman Edit Profil</Text>
      <Text>Tab Bar tidak akan muncul di sini.</Text>

      {/* Tombol untuk kembali ke halaman profil */}
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Simpan & Kembali</Text>
      </TouchableOpacity>
    </View>
  );
}

// (Gaya/styles bisa disesuaikan)
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, marginBottom: 20 },
  button: { backgroundColor: "blue", padding: 15, borderRadius: 10, marginTop: 20 },
  buttonText: { color: "white", fontSize: 16 },
});
