// app/index.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image, StatusBar, Text, TouchableOpacity, View } from "react-native";

export default function Intro() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
      style={{ flex: 1, paddingHorizontal: 28, paddingTop: 80, paddingBottom: 40 }}
    >
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Image
          source={require("../assets/images/rizround.png")} // <-- put your logo here
          style={{ width: 140, height: 140, marginBottom: 24, borderRadius: 28 }}
          resizeMode="contain"
        />
        <Text style={{ color: "#e2e8f0", fontSize: 28, fontWeight: "700", textAlign: "center" }}>
          Welcome to Riziq Green Agro Industrial Park PLC
        </Text>
        <Text style={{ color: "#94a3b8", fontSize: 15, marginTop: 10, textAlign: "center", lineHeight: 22 }}>
          Fast, simple access to our services—right inside the app.
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push("/web")}
        style={{
          backgroundColor: "#22c55e",
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: "center",
          shadowColor: "#22c55e",
          shadowOpacity: 0.5,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        }}
      >
        <Text style={{ color: "#0f172a", fontSize: 18, fontWeight: "800", letterSpacing: 0.5 }}>
          Let’s Go
        </Text>
      </TouchableOpacity>

      <View style={{ alignItems: "center", marginTop: 16 }}>
        <Text style={{ color: "#64748b", fontSize: 12 }}>v1.0 • Riziq App</Text>
      </View>
    </LinearGradient>
  );
}
