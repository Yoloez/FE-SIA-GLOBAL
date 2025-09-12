// app/futur.tsx
import { Link } from "expo-router";
import { Image, Text, View } from "react-native";

export default function FuturScreen() {
  return (
    <View className="flex-1 bg-[#111] justify-center items-center">
      <Image source={require("@/assets/images/icon.png")} className="w-64 h-64 rounded-full mb-4" />

      <Text className="text-white text-2xl font-bold">🚀 Future page reached!</Text>

      <Link href="/" asChild>
        <View className=" mt-6 px-6 py-3 rounded-md self-center bg-cyan-400/20 border border-cyan-400 active:scale-95">
          <Text className="text-cyan-300 font-semibold text-center">Go Back Home</Text>
        </View>
      </Link>
    </View>
  );
}
