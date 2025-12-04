import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import api from "../../api/axios";
import CustomAlert from "../../components/CustomAlert";
import { ThemedText } from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";

export default function Presensi() {
  const { user, isLoading: authLoading } = useAuth(); // Ambil data user dari AuthContext
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef<CameraView>(null);

  // CustomAlert states
  const [isAlertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertButtons, setAlertButtons] = useState<any[]>([]);

  // Debug: Log user data saat komponen mount
  useEffect(() => {
    console.log("========================================");
    console.log("[PRESENSI] User data dari AuthContext:", user);
    console.log("[PRESENSI] Auth loading status:", authLoading);
    if (user) {
      console.log("[PRESENSI] User ID:", user.id_user_si);
      console.log("[PRESENSI] User Name:", user.name);
      console.log("[PRESENSI] User Role:", user.role);
    } else {
      console.log("[PRESENSI] WARNING: User data tidak ditemukan!");
    }
    console.log("========================================");
  }, [user, authLoading]);

  // Shared values untuk slider zoom
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const SLIDER_WIDTH = 200;

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
      if (newX >= 0 && newX <= SLIDER_WIDTH) {
        translateX.value = newX;
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
    .onEnd(() => {});

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Fungsi untuk submit presensi ke backend
  const submitAttendance = async (qrKey: string) => {
    console.log("========================================");
    console.log("[SUBMIT PRESENSI] Memulai submit presensi...");
    console.log("[SUBMIT PRESENSI] QR Key:", qrKey);
    console.log("[SUBMIT PRESENSI] User object:", user);
    console.log("[SUBMIT PRESENSI] User ID:", user?.id_user_si);

    if (!user || !user.id_user_si) {
      console.log("[SUBMIT PRESENSI] ERROR: User data tidak valid!");
      console.log("[SUBMIT PRESENSI] User:", user);
      console.log("[SUBMIT PRESENSI] User ID:", user?.id_user_si);
      setAlertTitle("Error");
      setAlertMessage(`Data user tidak ditemukan.\n\nUser: ${user ? "Ada" : "Null"}\nUser ID: ${user?.id_user_si || "Tidak ada"}\n\nSilakan login kembali.`);
      setAlertButtons([{ text: "OK", onPress: () => setAlertVisible(false) }]);
      setAlertVisible(true);
      return;
    }

    console.log("[SUBMIT PRESENSI] User valid, melanjutkan ke API...");
    setIsProcessing(true);

    try {
      console.log("[SUBMIT PRESENSI] Mengirim request ke /student/attendances/scan");
      console.log("[SUBMIT PRESENSI] Payload:", { key: qrKey, id_student: user.id_user_si });

      const response = await api.post("/student/attendances/scan", {
        key: qrKey,
        id_student: user.id_user_si,
      });

      console.log("[SUBMIT PRESENSI] Response status:", response.status);
      console.log("[SUBMIT PRESENSI] Response data:", response.data);

      if (response.data.status === "success") {
        console.log("[SUBMIT PRESENSI] Presensi berhasil!");
        setAlertTitle("Presensi Berhasil!");
        setAlertMessage(response.data.message);
        setAlertButtons([
          {
            text: "OK",
            onPress: () => {
              setAlertVisible(false);
              // Kembali ke halaman sebelumnya atau dashboard
              router.back();
            },
          },
        ]);
        setAlertVisible(true);
      }
    } catch (error: any) {
      console.log("[SUBMIT PRESENSI] Error occurred:", error);
      console.log("[SUBMIT PRESENSI] Error response:", error.response?.data);
      let errorMessage = "Gagal melakukan presensi. Silakan coba lagi.";

      if (error.response) {
        // Error dari server dengan response
        if (error.response.status === 422) {
          // Validation error
          const errors = error.response.data.errors;
          if (errors?.key) {
            errorMessage = errors.key.join("\n");
          } else if (errors?.id_student) {
            errorMessage = errors.id_student.join("\n");
          } else {
            errorMessage = error.response.data.message;
          }
        } else if (error.response.status === 500) {
          errorMessage = error.response.data.message || "Terjadi kesalahan pada server.";
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      } else if (error.request) {
        // Request dibuat tapi tidak ada response
        errorMessage = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      }

      setAlertTitle("Presensi Gagal");
      setAlertMessage(errorMessage);
      setAlertButtons([
        {
          text: "Batal",
          style: "cancel",
          onPress: () => {
            setAlertVisible(false);
            router.back();
          },
        },
        {
          text: "Scan Ulang",
          onPress: () => {
            setAlertVisible(false);
            setScannedData(null);
            setIsProcessing(false);
          },
        },
      ]);
      setAlertVisible(true);
    } finally {
      setIsProcessing(false);
      console.log("========================================");
    }
  };

  // Fungsi untuk handle QR code yang di-scan
  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scannedData || isProcessing) return; // Prevent multiple scans

    setScannedData(data);

    // Validasi format QR code (opsional, sesuaikan dengan format key Anda)
    if (!data || data.trim() === "") {
      setAlertTitle("QR Code Invalid");
      setAlertMessage("QR Code tidak dapat dibaca. Silakan coba lagi.");
      setAlertButtons([
        {
          text: "OK",
          onPress: () => {
            setAlertVisible(false);
            setScannedData(null);
          },
        },
      ]);
      setAlertVisible(true);
      return;
    }

    // Submit attendance dengan key dari QR code
    submitAttendance(data);
  };

  // Loading state untuk auth
  if (authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#015023" />
          <ThemedText variant="semibold" style={styles.loadingAuthText}>
            Memuat data pengguna...
          </ThemedText>
        </View>
      </View>
    );
  }

  // Cek jika user tidak ada setelah auth selesai loading
  if (!authLoading && !user) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#dc2626" />
          <ThemedText variant="bold" style={[styles.permissionTitle, { color: "#dc2626" }]}>
            Sesi Tidak Valid
          </ThemedText>
          <ThemedText style={styles.permissionMessage}>Data pengguna tidak ditemukan. Silakan login kembali.</ThemedText>
          <TouchableOpacity style={[styles.permissionButton, { backgroundColor: "#dc2626" }]} onPress={() => router.replace("/(auth)/login")}>
            <ThemedText variant="semibold" style={styles.permissionButtonText}>
              Kembali ke Login
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#015023" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color="#015023" />
          <ThemedText variant="bold" style={styles.permissionTitle}>
            Izin Kamera Diperlukan
          </ThemedText>
          <ThemedText style={styles.permissionMessage}>Aplikasi ini memerlukan akses kamera untuk melakukan presensi dengan QR Code</ThemedText>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <ThemedText variant="semibold" style={styles.permissionButtonText}>
              Berikan Izin Kamera
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <ThemedText variant="bold" style={styles.headerTitle}>
            Scan QR Presensi
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Overlay dengan persegi scan QR di tengah */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />

          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />

            {/* Persegi scan QR */}
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              {/* Animated scanning line */}
              {!scannedData && !isProcessing && <Animated.View style={styles.scanLine} />}
            </View>

            <View style={styles.overlaySide} />
          </View>

          <View style={styles.overlayBottom}>
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#DABC4E" />
                <ThemedText variant="semibold" style={styles.processingText}>
                  Memproses presensi...
                </ThemedText>
              </View>
            ) : (
              <>
                <ThemedText variant="semibold" style={styles.scanText}>
                  Arahkan kamera ke QR Code
                </ThemedText>
                <ThemedText style={styles.scanSubtext}>QR Code akan otomatis terdeteksi</ThemedText>
              </>
            )}
          </View>
        </View>

        {/* Zoom Slider */}
        {!isProcessing && (
          <View style={styles.zoomContainer}>
            <ThemedText variant="bold" style={styles.zoomLabel}>
              -
            </ThemedText>
            <View style={styles.sliderTrack}>
              <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.sliderThumb, animatedStyle]} />
              </GestureDetector>
            </View>
            <ThemedText variant="bold" style={styles.zoomLabel}>
              +
            </ThemedText>
          </View>
        )}

        {/* Flash Toggle (opsional) */}
        {/* <TouchableOpacity 
          style={styles.flashButton}
          onPress={() => {}}
        >
          <Ionicons name="flash-outline" size={28} color="#fff" />
        </TouchableOpacity> */}

        {/* Custom Alert */}
        <CustomAlert visible={isAlertVisible} title={alertTitle} message={alertMessage} onClose={() => setAlertVisible(false)} buttons={alertButtons} />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  overlayMiddle: {
    flexDirection: "row",
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 70,
  },
  scanArea: {
    width: 250,
    height: 250,
    position: "relative",
    backgroundColor: "transparent",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#DABC4E",
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    width: "100%",
    height: 2,
    backgroundColor: "#DABC4E",
    position: "absolute",
    top: "50%",
  },
  scanText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
  scanSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  processingContainer: {
    alignItems: "center",
  },
  processingText: {
    color: "#DABC4E",
    fontSize: 16,
    marginTop: 15,
  },
  userInfoContainer: {
    marginTop: 30,
    backgroundColor: "rgba(1, 80, 35, 0.8)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  userInfoText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  userInfoSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  zoomContainer: {
    position: "absolute",
    bottom: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 40,
  },
  zoomLabel: {
    color: "#DABC4E",
    fontSize: 24,
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
    backgroundColor: "#DABC4E",
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
  flashButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#f5f5f5",
  },
  permissionTitle: {
    fontSize: 22,
    color: "#015023",
    marginTop: 20,
    marginBottom: 10,
  },
  permissionMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: "#015023",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    elevation: 3,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  loadingAuthText: {
    fontSize: 16,
    color: "#015023",
    marginTop: 16,
  },
});
