import React from "react";
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Tentukan tipe data untuk props agar lebih aman dengan TypeScript
interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  buttons?: { text: string; onPress: () => void; style?: "cancel" | "destructive" }[];
}

const { width } = Dimensions.get("window");

const CustomAlert: React.FC<CustomAlertProps> = ({ visible, title, message, onClose, buttons }) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.alertContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            {buttons && buttons.length > 0 ? (
              buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    index > 0 && styles.buttonSeparator, // Beri garis pemisah jika ada lebih dari 1 tombol
                    button.style === "destructive" && styles.destructiveButton,
                  ]}
                  onPress={() => {
                    button.onPress();
                    onClose(); // Selalu tutup alert setelah tombol ditekan
                  }}
                >
                  <Text style={[styles.buttonText, button.style === "destructive" && styles.destructiveButtonText]}>{button.text}</Text>
                </TouchableOpacity>
              ))
            ) : (
              // Tombol default jika tidak ada tombol yang disediakan
              <TouchableOpacity style={styles.button} onPress={onClose}>
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Latar belakang semi-transparan
    justifyContent: "center",
    alignItems: "center",
  },
  alertContainer: {
    width: width * 0.8, // 80% dari lebar layar
    backgroundColor: "white",
    borderRadius: 15,
    paddingTop: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonSeparator: {
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
  },
  buttonText: {
    fontSize: 16,
    color: "#007AFF", // Warna biru khas iOS
    fontWeight: "600",
  },
  destructiveButton: {
    // Styling khusus untuk tombol "hapus"
  },
  destructiveButtonText: {
    color: "red",
  },
});

export default CustomAlert;
