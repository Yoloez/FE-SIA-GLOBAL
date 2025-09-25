import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
// 1. Impor ScrollView di sini
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function HomeScreen() {
  const { logout } = useAuth();
  const handleLogout = () => {
    console.log("Tombol Logout Ditekan!");
    logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="green" />

      {/* 2. Ganti <View> menjadi <ScrollView> untuk konten yang bisa digulir */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Ionicons name="person-circle-outline" size={50} />
          <View>
            <Text style={styles.userName}>Hanan Fijananto</Text>
            <Text style={styles.userId}>24/123456/TRPL/56789</Text>
          </View>
        </View>

        <Link href="/profil" asChild>
          <View style={styles.iconsSection}>
            <Ionicons name="chatbox-ellipses-outline" size={30} style={{ marginLeft: 10 }} />
            <Ionicons name="notifications-outline" size={30} />
          </View>
        </Link>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingTop: 80 }}>
        {/* Anda bisa menambahkan lebih banyak konten di sini untuk menguji scroll */}
        <View style={styles.centerBox}>
          <Text>Haloo</Text>
        </View>
        <View style={styles.centerBox}>
          <Text>Konten Tambahan 1</Text>
        </View>
        <View style={styles.centerBox}>
          <Text>Konten Tambahan 2</Text>
        </View>
        <View style={styles.centerBox}>
          <Text>Konten Tambahan 2</Text>
        </View>
        <View style={styles.centerBox}>
          <Text>Konten Tambahan 2</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput placeholder="Search" style={styles.search} placeholderTextColor="grey" />
          <Ionicons name="search-outline" size={20} />
        </View>

        <View style={styles.centerBox}>
          <Text>Konten Tambahan 3</Text>
        </View>
        <View style={styles.centerBox}>
          <Text>Konten Tambahan 4</Text>
        </View>
        {/* Konten terakhir diberi margin bawah agar tidak terpotong oleh tombol logout */}
        <View style={{ marginBottom: 200 }} />
      </ScrollView>

      {/* 3. Pindahkan Tombol Logout ke luar <ScrollView> */}
      {/* Tombol ini sekarang menjadi "sibling" dari ScrollView, bukan "child" */}
      <TouchableOpacity onPress={handleLogout} style={styles.button}>
        <Text style={styles.buttonTxt}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1, // Biarkan flex: 1 agar ScrollView tahu batasannya
  },
  header: {
    alignItems: "center",
    backgroundColor: "yellow",
    borderBottomWidth: 2,
    borderColor: "black",
    padding: 10,
    justifyContent: "space-between",
    flexDirection: "row",
    position: "absolute",
    alignSelf: "center",
    left: 0,
    right: 0,
    top: 0,
    gap: 12,
    zIndex: 100,
    // marginTop: 12,
    marginHorizontal: 20,
    marginBottom: 15, // Menambah jarak ke bawah
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  userName: {
    fontSize: 18,
    color: "#000000B3",
    marginTop: 3,
  },
  userId: {
    fontSize: 14,
    color: "#000000",
  },
  iconsSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  centerBox: {
    borderColor: "black",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 15,
    padding: 30,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  searchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: "black",
    borderWidth: 2,
    marginTop: 15,
    padding: 10,
    marginHorizontal: 20,
    borderRadius: 30,
    paddingHorizontal: 15,
  },
  search: {
    flex: 1,
    borderColor: "white",
    fontSize: 16,
  },
  button: {
    // Style ini akan bekerja dengan benar karena sekarang relatif terhadap SafeAreaView
    position: "absolute",
    bottom: 120,
    width: "90%",
    alignSelf: "center", // Cara terbaik untuk centering horizontal di React Native
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "black",
  },
  buttonTxt: {
    color: "black",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
});
