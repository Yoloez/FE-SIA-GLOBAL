import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Button, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Presensi() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Fungsi untuk mengambil gambar
  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setCapturedImage(photo.uri);
    }
  };

  if (!permission) {
    // Izin kamera masih dimuat.
    return <View />;
  }

  if (!permission.granted) {
    // Izin kamera belum diberikan.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Aplikasi ini memerlukan izin Anda untuk menggunakan kamera</Text>
        <Button onPress={requestPermission} title="Berikan Izin" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  // Jika sudah ada gambar yang dicapture, tampilkan preview
  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.previewImage} />
        <View style={styles.previewButtonContainer}>
          <Button title="Ambil Ulang" onPress={() => setCapturedImage(null)} />
          {/* Anda bisa tambahkan tombol "Simpan" di sini */}
        </View>
      </View>
    );
  }

  // Tampilan kamera utama
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
      <View style={styles.buttonContainer}>
        {/* Tombol Flip Camera */}
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
          <Text style={styles.text}>Flip</Text>
        </TouchableOpacity>

        {/* Tombol Capture Baru */}
        <TouchableOpacity style={styles.captureButton} onPress={takePicture} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
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
