import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Alert, Button, Image, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

export default function Presensi() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef<CameraView>(null);

  // Shared values untuk slider zoom
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const SLIDER_WIDTH = 200; // Lebar slider

  // Fungsi untuk update zoom
  const updateZoom = (value: number) => {
    setZoom(value);
  };

  // Gesture handler untuk slider
  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const newX = startX.value + event.translationX;
      // Batasi gerakan slider
      if (newX >= 0 && newX <= SLIDER_WIDTH) {
        translateX.value = newX;
        // Convert posisi slider ke nilai zoom (0-1)
        const zoomValue = newX / SLIDER_WIDTH;
        runOnJS(updateZoom)(zoomValue);
      } else if (newX < 0) {
        translateX.value = 0;
        runOnJS(updateZoom)(0);
      } else if (newX > SLIDER_WIDTH) {
        translateX.value = SLIDER_WIDTH;
        runOnJS(updateZoom)(1);
      }
    })
    .onEnd(() => {
      // Opsional: smooth snap
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Fungsi untuk mengambil gambar
  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        setCapturedImage(photo.uri);
      }
    }
  };

  // Fungsi untuk handle QR code yang di-scan
  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScannedData(data);
    Alert.alert("QR Code Terdeteksi", `Data: ${data}`, [
      {
        text: "OK",
        onPress: () => {
          // Reset untuk scan lagi
          setTimeout(() => setScannedData(null), 2000);
        },
      },
    ]);
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

  // Tampilan kamera utama dengan QR scanner
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
          zoom={zoom}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={scannedData ? undefined : handleBarcodeScanned}
        />

        {/* Overlay dengan persegi scan QR di tengah */}
        <View style={styles.overlay}>
          {/* Area gelap atas */}
          <View style={styles.overlayTop} />

          <View style={styles.overlayMiddle}>
            {/* Area gelap kiri */}
            <View style={styles.overlaySide} />

            {/* Persegi scan QR */}
            <View style={styles.scanArea}>
              {/* Corner kiri atas */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              {/* Corner kanan atas */}
              <View style={[styles.corner, styles.cornerTopRight]} />
              {/* Corner kiri bawah */}
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              {/* Corner kanan bawah */}
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>

            {/* Area gelap kanan */}
            <View style={styles.overlaySide} />
          </View>

          {/* Area gelap bawah */}
          <View style={styles.overlayBottom}>
            <Text style={styles.scanText}>Arahkan kamera ke QR Code</Text>
          </View>
        </View>

        {/* Zoom Slider */}
        <View style={styles.zoomContainer}>
          <Text style={styles.zoomLabel}>-</Text>
          <View style={styles.sliderTrack}>
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.sliderThumb, animatedStyle]} />
            </GestureDetector>
          </View>
          <Text style={styles.zoomLabel}>+</Text>
        </View>
      </View>
    </GestureHandlerRootView>
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
  // Overlay styles
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  overlayMiddle: {
    flexDirection: "row",
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 250,
    height: 250,
    position: "relative",
  },
  // Corner styles (sudut persegi scan)
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#DABC4E",
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
  },
  // Zoom Slider Styles
  zoomContainer: {
    position: "absolute",
    bottom: 190,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 40,
  },
  zoomLabel: {
    color: "#DABC4E",
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 10,
  },
  sliderTrack: {
    width: 200,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    position: "relative",
  },
  sliderThumb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "white",
    position: "absolute",
    top: -13,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
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
