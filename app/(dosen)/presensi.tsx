import { StyleSheet, View } from "react-native";

export default function Presensi() {
  return <View style={styles.container}></View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#015023",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    backgroundColor: "transparent",
    paddingHorizontal: 20,
  },
  // Tombol Capture (Lingkaran di tengah)
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    borderWidth: 4,
    bottom: 160,
    borderColor: "#ccc",
    marginHorizontal: 40, // Memberi jarak antara tombol flip dan capture
  },
  // Tombol Flip (Tombol teks)
  flipButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  // Style untuk halaman preview
  previewImage: {
    flex: 1,
  },
  previewButtonContainer: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
