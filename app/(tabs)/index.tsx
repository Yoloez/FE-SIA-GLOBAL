import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-[#0F0C29] justify-center items-center px-6">
      {/* Grid glow effect (CSS only) */}
      <View className="absolute inset-0 opacity-10">
        <View className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <View className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <View className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-400 to-transparent" />
        <View className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-400 to-transparent" />
      </View>

      {/* Glass-morphism card (plain View) */}
      <View className="w-full max-w-sm rounded-3xl p-8 bg-white/5 border border-white/10 shadow-2xl">
        <Text className="text-5xl font-black text-white text-center">
          NATIVE
          <Text className="text-cyan-400">WIND</Text>
        </Text>
        <Text className="text-lg text-white/70 text-center mt-3">Cross-platform. Hyper-styled. Ready for 2025.</Text>

        <Link href="/futur" asChild>
          <View className="mt-6 px-6 py-3 rounded-md self-center bg-cyan-400/20 border border-cyan-400 active:scale-95">
            <Text className="text-cyan-300 font-semibold text-center">Explore Future →</Text>
          </View>
        </Link>
        {/* Neon button */}
        <Link href="/explore" asChild>
          <View className="mt-8 self-center px-6 py-3 rounded-full bg-cyan-400/20 border border-cyan-400 active:scale-95 shadow-lg ">
            <Text className="text-cyan-300 font-semibold">Launch Experience</Text>
          </View>
        </Link>
      </View>
    </View>
  );
}
