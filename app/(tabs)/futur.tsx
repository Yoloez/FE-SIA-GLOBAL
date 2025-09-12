import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Button, Image, StyleSheet, Text, View } from "react-native";

export default function PresensiScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState(null);
  const cameraRef = useRef(null);

  // Minta izin saat komponen pertama kali dimuat
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  // Tampilkan pesan jika izin belum diberikan atau sedang loading
  if (!permission) {
    // Izin sedang dimuat
    return <View />;
  }

  if (!permission.granted) {
    // Izin ditolak
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>Kami butuh izin Anda untuk menampilkan kamera</Text>
        <Button onPress={requestPermission} title="Berikan Izin" />
      </View>
    );
  }

  // Fungsi untuk mengambil gambar
  //   const takePicture = async () => {
  //     if (cameraRef.current) {
  //       const photo = await cameraRef.current.takePictureAsync();
  //       setCapturedImage(photo.uri);
  //     }
  //   };

  // Jika sudah ada gambar yang ditangkap, tampilkan hasilnya
  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.previewImage} />
        <View style={styles.buttonContainer}>
          <Button title="Ambil Ulang" onPress={() => setCapturedImage(null)} />
          {/* Di sini Anda bisa menambahkan tombol "Kirim" atau "Simpan" */}
          <Button title="Kirim Presensi" onPress={() => alert("Presensi terkirim!")} />
        </View>
      </View>
    );
  }

  // Tampilan utama kamera
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="front" ref={cameraRef}>
        <View style={styles.buttonContainer}>
          {/* <TouchableOpacity style={styles.button} onPress={takePicture}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}></View>
            </View>
          </TouchableOpacity> */}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 64,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  button: {
    alignSelf: "flex-end",
    alignItems: "center",
  },
  outerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "white",
  },
  previewImage: {
    flex: 1,
    resizeMode: "contain",
  },
});
