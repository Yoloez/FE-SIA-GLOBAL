import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  confirmButtonColor?: string;
  // New props for announcement details
  sender?: string;
  className?: string;
  classCode?: string;
  subjectName?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = "Batal",
  iconName = "alert-circle",
  iconColor = "#F59E0B",
  confirmButtonColor = "#0EA5E9",
  sender,
  className,
  classCode,
  subjectName,
}) => {
  const [scaleAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [visible]);

  // Check if this is an announcement detail modal
  const isAnnouncementDetail = sender || className || classCode || subjectName;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.iconContainer}>
            <Ionicons name={iconName} size={32} color={iconColor} />
          </View>

          <Text style={styles.title}>{title}</Text>

          {/* Scrollable message content */}
          <ScrollView style={styles.messageScrollView} contentContainerStyle={styles.messageScrollContent} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
            <Text style={styles.message}>{message}</Text>

            {/* Announcement metadata */}
            {isAnnouncementDetail && (
              <View style={styles.metadataContainer}>
                {sender && (
                  <View style={styles.metadataRow}>
                    <Ionicons name="person-outline" size={16} color="#6B7280" />
                    <Text style={styles.metadataLabel}>Pengirim:</Text>
                    <Text style={styles.metadataValue}>{sender}</Text>
                  </View>
                )}

                {(classCode || className) && (
                  <View style={styles.metadataRow}>
                    <Ionicons name="school-outline" size={16} color="#6B7280" />
                    <Text style={styles.metadataLabel}>Kelas:</Text>
                    <Text style={styles.metadataValue}>{classCode && className ? `${classCode} - ${className}` : classCode || className}</Text>
                  </View>
                )}

                {subjectName && (
                  <View style={styles.metadataRow}>
                    <Ionicons name="book-outline" size={16} color="#6B7280" />
                    <Text style={styles.metadataLabel}>Mata Kuliah:</Text>
                    <Text style={styles.metadataValue}>{subjectName}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {cancelText ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, { backgroundColor: confirmButtonColor }]} onPress={onConfirm}>
                <Text style={styles.confirmText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.fullButton, { backgroundColor: confirmButtonColor }]} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: width - 64,
    maxWidth: 360,
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  messageScrollView: {
    width: "100%",
    maxHeight: 350,
    marginBottom: 20,
  },
  messageScrollContent: {
    paddingRight: 4,
  },
  message: {
    fontSize: 14,
    color: "#374151",
    textAlign: "left",
    lineHeight: 22,
  },
  metadataContainer: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metadataLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  metadataValue: {
    fontSize: 13,
    color: "#1F2937",
    flex: 1,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#0EA5E9",
    borderRadius: 12,
    alignItems: "center",
  },
  fullButton: {
    width: "100%",
    paddingVertical: 12,
    backgroundColor: "#0EA5E9",
    borderRadius: 12,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
