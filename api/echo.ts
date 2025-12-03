import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Echo from "laravel-echo";
import Pusher from "pusher-js/react-native";

// IP Laptop Anda
const IP_ADDRESS = "10.72.9.211";
const BROADCASTING_URL = `http://${IP_ADDRESS}:8000`;

(window as any).Pusher = Pusher;

// Aktifkan log hanya jika perlu debugging
// Pusher.logToConsole = true;

const REVERB_APP_KEY = "qi2l7jof7hedxkaxwkiy"; // Key dari .env

const reverbPortString = process.env.EXPO_PUBLIC_REVERB_PORT || "9090";
const reverbPortNumber = parseInt(reverbPortString, 10);

const echo = new Echo({
  broadcaster: "reverb",
  key: REVERB_APP_KEY,
  wsHost: IP_ADDRESS,
  wsPort: reverbPortNumber,
  wssPort: reverbPortNumber,
  forceTLS: false,
  enabledTransports: ["ws", "wss"],

  authorizer: (channel: any) => {
    return {
      authorize: (socketId: string, callback: (error: Error | null, authData: any) => void) => {
        AsyncStorage.getItem("userToken")
          .then((token) => {
            if (!token) {
              throw new Error("Token otentikasi tidak ditemukan.");
            }

            console.log("🔐 Attempting auth for channel:", channel.name);

            return axios.post(
              `${BROADCASTING_URL}/broadcasting/auth`,
              {
                socket_id: socketId,
                channel_name: channel.name,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/json",
                },
              }
            );
          })
          .then((response) => {
            console.log("✅ Auth successful for:", channel.name);
            callback(null, response.data);
          })
          .catch((error) => {
            console.error("❌ PUSHER AUTH FAILED for channel:", channel.name);
            if (axios.isAxiosError(error)) {
              console.error("❌ Status:", error.response?.status);
              console.error("❌ Data:", error.response?.data);
            } else {
              console.error("❌ Error:", error);
            }
            callback(error as Error, null);
          });
      },
    };
  },
});

export default echo;
