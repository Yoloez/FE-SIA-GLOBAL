import { Urbanist_400Regular, Urbanist_500Medium, Urbanist_600SemiBold, Urbanist_700Bold } from "@expo-google-fonts/urbanist";
import { useFonts } from "expo-font";
import React from "react";
import { Text, TextProps } from "react-native";

interface ThemedTextProps extends TextProps {
  variant?: "regular" | "medium" | "semibold" | "bold";
}

export function ThemedText({ style, variant = "regular", ...rest }: ThemedTextProps) {
  const [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const fontFamily = {
    regular: "Urbanist_400Regular",
    medium: "Urbanist_500Medium",
    semibold: "Urbanist_600SemiBold",
    bold: "Urbanist_700Bold",
  }[variant];

  return <Text style={[{ fontFamily }, style]} {...rest} />;
}
