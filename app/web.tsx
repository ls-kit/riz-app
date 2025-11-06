import * as Network from "expo-network";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Platform } from "react-native";
import { WebView } from "react-native-webview";
import Offline from "../components/Offline";

const HOME_URL = "https://riziqdev.kfml.info/app-home";

export default function WebScreen() {
  const webRef = useRef<WebView>(null);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [webError, setWebError] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0); // force WebView reload

  // Check & subscribe to network state
  useEffect(() => {
    let sub: any;

    const check = async () => {
      const st = await Network.getNetworkStateAsync();
      const online = !!st.isConnected && st.isInternetReachable !== false;
      setIsOnline(online);
      if (online) setWebError(false);
    };

    check();
    // @ts-ignore expo-network provides listener
    sub = Network.addNetworkStateListener((st) => {
      const online = !!st.isConnected && st.isInternetReachable !== false;
      setIsOnline(online);
      if (online) setWebError(false);
    });

    return () => {
      if (sub?.remove) sub.remove();
    };
  }, []);

  // Android back button -> goBack inside WebView history
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const s = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => s.remove();
  }, [canGoBack]);

  const handleRetry = useCallback(() => {
    setWebError(false);
    setReloadKey((k) => k + 1); // reload WebView
  }, []);

  // If offline OR last load failed -> show Offline screen
  if (!isOnline || webError) {
    return <Offline onRetry={handleRetry} />;
  }

  return (
    <WebView
      key={reloadKey}
      ref={webRef}
      source={{ uri: HOME_URL }}
      onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      pullToRefreshEnabled // Android pull-to-refresh
      setSupportMultipleWindows={false}
      onError={() => setWebError(true)}       // generic render/network error
      onHttpError={(e) => {
        // Treat 4xx/5xx as offline screen as well
        if (e.statusCode >= 400) setWebError(true);
      }}
      onShouldStartLoadWithRequest={(req) => {
        const url = req?.url ?? "";
        const external = ["tel:", "mailto:", "whatsapp:", "geo:", "intent:"];
        if (external.some((p) => url.startsWith(p))) return false; // let OS handle
        return true;
      }}
    />
  );
}
