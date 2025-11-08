import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, Text } from "react-native";

type Props = { onRetry?: () => void };

export default function Offline({ onRetry }: Props) {
  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
      style={{ flex: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40, justifyContent: "center", alignItems: "center" }}
    >
      <Text style={{ color: "#e2e8f0", fontSize: 18, fontWeight: "800" }}>You’re offline</Text>
      <Text style={{ color: "#94a3b8", marginTop: 6, textAlign: "center" }}>Check your connection and try again.</Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => ({
          marginTop: 16,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 12,
          backgroundColor: pressed ? "#16a34a" : "#22c55e",
        })}
      >
        <Text style={{ color: "#0f172a", fontWeight: "800" }}>Retry</Text>
      </Pressable>
    </LinearGradient>
  );
}
