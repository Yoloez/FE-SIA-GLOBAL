import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity } from "react-native";

const { width } = Dimensions.get("window");

interface NotificationActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
  isRead: boolean;
}

export const NotificationActionMenu: React.FC<NotificationActionMenuProps> = ({ visible, onClose, onMarkAsRead, onDelete, isRead }) => {
  const [slideAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [visible]);

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.title}>Pilih Aksi</Text>

          {!isRead && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onMarkAsRead();
                onClose();
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={22} color="#0EA5E9" />
              <Text style={styles.menuText}>Tandai Dibaca</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.menuItem, styles.deleteItem]}
            onPress={() => {
              onDelete();
              onClose();
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
            <Text style={[styles.menuText, styles.deleteText]}>Hapus</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.cancelItem]} onPress={onClose}>
            <Ionicons name="close-circle-outline" size={22} color="#6B7280" />
            <Text style={styles.menuText}>Batal</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 2,
  },
  deleteItem: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  cancelItem: {
    backgroundColor: "rgba(107, 114, 128, 0.05)",
    marginTop: 4,
  },
  menuText: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
    fontWeight: "500",
  },
  deleteText: {
    color: "#EF4444",
  },
});
