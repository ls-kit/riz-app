import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

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

  const barW = width.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.85)", alignItems: "center", justifyContent: "center", zIndex: 9 }}>
      <Text style={{ color: "#e2e8f0", fontSize: 16, fontWeight: "800" }}>{label}</Text>
      <View style={{ width: "70%", height: 8, borderRadius: 6, backgroundColor: "#0b1222", marginTop: 12, overflow: "hidden", borderWidth: 1, borderColor: "#1f2a40" }}>
        <Animated.View style={{ width: barW, height: "100%", backgroundColor: "#22c55e" }} />
      </View>
    </View>
  );
}