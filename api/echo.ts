import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Echo from "laravel-echo";
import Pusher from "pusher-js/react-native";

const IP_ADDRESS = "192.168.0.159"; // IP Laptop Anda
const BROADCASTING_URL = `http://${IP_ADDRESS}:8000`;

(window as any).Pusher = Pusher;
// Pusher.logToConsole = true;

const REVERB_APP_KEY = "qi2l7jof7hedxkaxwkiy"; // Ganti dengan key dari .env Laravel Anda

const reverbPortString = process.env.EXPO_PUBLIC_REVERB_PORT || "9090";
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

    authEndpoint: `${BROADCASTING_URL}/broadcasting/auth`,

    // --- INI PERBAIKANNYA ---
    // 'authorizer' harus fungsi sinkron yang mengembalikan objek.
    // 'async' dipindahkan ke dalam method 'authorize'.
    authorizer: (channel, options) => {
      return {
        authorize: async (socketId, callback) => {
          try {
            const token = await AsyncStorage.getItem("userToken");
            if (!token) {
              throw new Error("Token otentikasi tidak ditemukan.");
            }
            const response = await axios.post(
              options.authEndpoint,
              {
                socket_id: socketId,
                channel_name: channel.name,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            callback(null, response.data);
          } catch (error) {
            if (axios.isAxiosError(error)) {
              console.error("PUSHER AUTH FAILED:", error.response?.data || error.message);
              callback(error as Error, null);
            }
          }
        },
      };
    },
  }),
});

export default echo;
