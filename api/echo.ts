import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Echo from "laravel-echo";
import Pusher from "pusher-js/react-native";

const IP_ADDRESS = "192.168.0.159"; // IP Laptop Anda
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;
// URL untuk otorisasi broadcasting biasanya tidak di bawah /api
const BROADCASTING_URL = `http://${IP_ADDRESS}:8000`;

(window as any).Pusher = Pusher;

// --- GANTI KUNCI INI DENGAN YANG ADA DI FILE .env LARAVEL ANDA ---
const REVERB_APP_KEY = "qi2l7jof7hedxkaxwkiy";
// -----------------------------------------------------------

const reverbPortString = process.env.EXPO_PUBLIC_REVERB_PORT || "8080";
const reverbPortNumber = parseInt(reverbPortString, 10);

const echo = new Echo({
  broadcaster: "reverb",
  client: new Pusher(REVERB_APP_KEY, {
    wsHost: IP_ADDRESS,
    wsPort: reverbPortNumber,
    wssPort: reverbPortNumber,
    forceTLS: false,
    enabledTransports: ["ws", "wss"],
    cluster: "mt1",
  }),
  authorizer: (channel: any) => {
    return {
      authorize: async (socketId: string, callback: (isAuth: boolean, authInfo: any) => void) => {
        try {
          const token = await AsyncStorage.getItem("userToken");
          if (!token) {
            throw new Error("Token not found");
          }
          // Panggil endpoint /broadcasting/auth
          const response = await axios.post(
            `${BROADCASTING_URL}/broadcasting/auth`,
            {
              socket_id: socketId,
              channel_name: channel.name,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          callback(false, response.data);
        } catch (error) {
          if (axios.isAxiosError(error) && error.response) {
            console.error("Authorization failed:", error.response?.data || error.message);
            callback(true, error);
          }
        }
      },
    };
  },
  // --- INI PERBAIKANNYA ---
  // Kita menambahkan 'as any' untuk memberitahu TypeScript agar tidak khawatir
  // dengan tipe data yang kompleks dari library ini.
} as any);

export default echo;
