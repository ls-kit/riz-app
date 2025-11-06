import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type Props = { onRetry?: () => void };

export default function Offline({ onRetry }: Props) {
  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
      style={{ flex: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 }}
    >
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {/* Use your own logo/image */}
        <Image
          source={require("../assets/images/splash-icon.png")}
          style={{ width: 120, height: 120, marginBottom: 20, borderRadius: 28 }}
          resizeMode="contain"
        />
        <Text style={{ color: "#e2e8f0", fontSize: 22, fontWeight: "700", textAlign: "center" }}>
          You’re Offline
        </Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 10, textAlign: "center", lineHeight: 22 }}>
          Please check your internet connection. We’ll reconnect as soon as you’re back online.
        </Text>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onRetry}
          style={{
            marginTop: 24,
            backgroundColor: "#22c55e",
            paddingVertical: 14,
            paddingHorizontal: 26,
            borderRadius: 12,
            alignItems: "center",
            elevation: 3,
          }}
        >
          <Text style={{ color: "#0f172a", fontSize: 16, fontWeight: "800" }}>Retry</Text>
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: "center" }}>
        <Text style={{ color: "#64748b", fontSize: 12 }}>Riziq App</Text>
      </View>
    </LinearGradient>
  );
}
