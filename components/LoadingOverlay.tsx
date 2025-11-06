import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Image, Text, View } from "react-native";

type Props = {
  visible: boolean;
  progress?: number; // 0..1
  label?: string;
};

export default function LoadingOverlay({ visible, progress = 0, label = "Loading..." }: Props) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  if (!visible) return null;

  const progWidth = width.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <LinearGradient
      colors={["#0f172a", "#1f2a40", "#0f172a"]}
      style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, paddingHorizontal: 28, paddingTop: 80, paddingBottom: 40, justifyContent: "center", alignItems: "center", zIndex: 9 }}
    >
      <Image
        source={require("../assets/images/rizround.png")}
        style={{ width: 96, height: 96, borderRadius: 24, marginBottom: 18, opacity: 0.95 }}
        resizeMode="contain"
      />
      <Text style={{ color: "#e2e8f0", fontSize: 18, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>Please wait…</Text>

      <View style={{ width: "80%", height: 8, borderRadius: 6, backgroundColor: "#0b1222", marginTop: 18, overflow: "hidden", borderWidth: 1, borderColor: "#1f2a40" }}>
        <Animated.View style={{ width: progWidth, height: "100%", backgroundColor: "#22c55e" }} />
      </View>
    </LinearGradient>
  );
}