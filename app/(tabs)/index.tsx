import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function HomeScreen() {
  const { logout } = useAuth(); // 2. Ambil fungsi logout dari "wadah"
  const handleLogout = () => {
    console.log("Tombol Logout Ditekan!");
    logout(); // 3. Panggil fungsi logout
  };

  return (
    <View style={styles.container}>
      <View style={{ alignItems: "center", justifyContent: "space-between", flexDirection: "row", gap: 12, marginTop: 12, marginHorizontal: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
          }}
        >
          <Ionicons name="person-circle-outline" size={50} />
          <View>
            <Text className="text-lg text-white/70 text-center mt-3">Hanan Fijananto</Text>
            <Text>24/123456/TRPL/56789</Text>
          </View>
        </View>

        {/* Neon button */}
        <Link href="/explore" asChild>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Ionicons name="chatbox-ellipses-outline" size={30} style={{ marginLeft: 10 }}></Ionicons>
            <Ionicons name="notifications-outline" size={30}></Ionicons>
          </View>
        </Link>
      </View>

      <View style={{ borderColor: "black", borderWidth: 2, justifyContent: "center", alignItems: "center", marginVertical: 15, padding: 30, marginHorizontal: 20, borderRadius: 10 }}>
        <Text>Haloo</Text>
      </View>
      <View style={{ borderColor: "black", borderWidth: 2, justifyContent: "space-between", alignItems: "center", marginTop: 15, padding: 10, marginHorizontal: 20, borderRadius: 30, flexDirection: "row", paddingHorizontal: 15 }}>
        <TextInput placeholder="Search" />
        <Ionicons name="search-outline" size={20}></Ionicons>
      </View>

      <TouchableOpacity onPress={handleLogout} style={styles.button}>
        <Text style={styles.buttonTxt}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  button: {
    alignItems: "center",
    backgroundColor: "white",
    padding: 10,
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    marginHorizontal: "auto",
    width: "90%",
    borderRadius: 8,
  },

  buttonTxt: {
    color: "black",
    fontSize: 16,
    textAlign: "center",
  },
});
