import React, { cloneElement } from "react";
import { GestureResponderEvent, StyleSheet, TouchableOpacity, View } from "react-native";

interface TabBarButtonProps {
  children: React.ReactElement<{ color?: string }>;
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityState?: { selected?: boolean };
}

const ACTIVE_ICON_BG = "#FACC15";
const INACTIVE_ICON_BG = "#FEFBEA";

const TabBarButton: React.FC<TabBarButtonProps> = ({ children, onPress, accessibilityState }) => {
  const focused = accessibilityState?.selected ?? false;

  const coloredChild = cloneElement(children, {
    color: focused ? "#015023" : "#DABC4E",
  });

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.9}>
      <View
        style={{
          borderWidth: 2,
          width: 70,
          height: 70,
          borderRadius: 35,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: focused ? ACTIVE_ICON_BG : INACTIVE_ICON_BG,
          borderColor: focused ? "#FACC15" : "#DABC4E",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 4.65,
          elevation: 8,
        }}
      >
        {coloredChild || children}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    top: -35,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TabBarButton;
