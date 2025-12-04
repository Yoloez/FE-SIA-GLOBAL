import { Urbanist_400Regular, Urbanist_600SemiBold, Urbanist_700Bold } from "@expo-google-fonts/urbanist";
import { useFonts } from "expo-font";
import React, { createContext, useContext } from "react";

interface FontContextData {
  fontsLoaded: boolean;
}

const FontContext = createContext<FontContextData>({ fontsLoaded: false });

export const useFont = () => useContext(FontContext);

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
  });

  return <FontContext.Provider value={{ fontsLoaded }}>{children}</FontContext.Provider>;
};
