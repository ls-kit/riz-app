// app/web.tsx
import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Platform } from "react-native";
import { WebView } from "react-native-webview";

const HOME_URL = "https://dokaner.com";

export default function WebScreen() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Android back button -> goBack inside WebView
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false; // allow app to close if no back history
    });
    return () => sub.remove();
  }, [canGoBack]);

  return (
    <WebView
      ref={webRef}
      source={{ uri: HOME_URL }}
      onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false} // safer default
      onShouldStartLoadWithRequest={(req) => {
        const url = req?.url ?? "";
        const external = ["tel:", "mailto:", "whatsapp:", "geo:", "intent:"];
        if (external.some((p) => url.startsWith(p))) return false; // let OS handle
        return true;
      }}
    />
  );
}
