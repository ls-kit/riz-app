import React, { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Platform, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useOnline } from "../hooks/useOnline";
import { getSnapshot, setSnapshot } from "../lib/cache";
import { EXTERNAL_SCHEMES } from "../lib/constants";
import LoadingOverlay from "./LoadingOverlay";
import Offline from "./Offline";

type Props = {
  url: string;
  pullToRefreshEnabled?: boolean;
  showOfflineBanner?: boolean;
};

const INJECTED_JS = `
(function() {
  function snapshot() {
    try {
      var html = document.documentElement.outerHTML;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SNAPSHOT', html: html }));
    } catch (e) {}
  }
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(snapshot, 200); });
  window.addEventListener('load', function(){ setTimeout(snapshot, 200); });
  setTimeout(snapshot, 1500);
})();`;

export default function WebShell({ url, pullToRefreshEnabled = true, showOfflineBanner = true }: Props) {
  const webRef = useRef<WebView>(null);
  const isOnline = useOnline();

  const [canGoBack, setCanGoBack] = useState(false);
  const [webError, setWebError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showLoader, setShowLoader] = useState(true);

  const [cachedHtml, setCachedHtml] = useState<string | null>(null);
  const [cacheUpdatedAt, setCacheUpdatedAt] = useState<number | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  // Load any cached snapshot at start
  useEffect(() => {
    (async () => {
      try {
        const snap = await getSnapshot(url);
        setCachedHtml(snap.html);
        setCacheUpdatedAt(snap.ts);
      } catch {}
    })();
  }, [url]);

  // Android back button -> goBack inside WebView
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
    setUsingCache(false);
    setReloadKey((k) => k + 1);
  }, []);

  // Loader controls per navigation
  const onLoadStart = () => {
    setShowLoader(true);
    setLoadingProgress(0);
  };
  const onLoadProgress = (e: any) => {
    const p = e?.nativeEvent?.progress ?? 0;
    setLoadingProgress(p);
  };
  const onLoadEnd = () => {
    setLoadingProgress(1);
    setTimeout(() => setShowLoader(false), 120);
  };

  // Save/refresh latest HTML snapshot
  const onMessage = async (e: any) => {
    try {
      const data = JSON.parse(e?.nativeEvent?.data || "{}");
      if (data?.type === "SNAPSHOT" && typeof data?.html === "string" && data.html.length > 0) {
        const ts = await setSnapshot(url, data.html);
        setCachedHtml(data.html);
        setCacheUpdatedAt(ts);
      }
    } catch {}
  };

  // Offline or error -> use cache if present, else show Offline screen
  if ((!isOnline || webError) && cachedHtml) {
    if (!usingCache) setUsingCache(true);
    return (
      <View style={{ flex: 1 }}>
        <WebView
          key={`cached-${reloadKey}`}
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html: cachedHtml, baseUrl: url }}
          setSupportMultipleWindows={false}
          onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
          onLoadStart={onLoadStart}
          onLoadProgress={onLoadProgress}
          onLoadEnd={onLoadEnd}
        />

        {showOfflineBanner && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              paddingVertical: 6,
              paddingHorizontal: 10,
              backgroundColor: "rgba(15,23,42,0.9)",
            }}
          >
            <Text style={{ color: "#22c55e", fontWeight: "800" }}>Offline</Text>
            <Text style={{ color: "#94a3b8", fontSize: 11 }}>
              Showing saved copy{cacheUpdatedAt ? ` • updated ${new Date(cacheUpdatedAt).toLocaleString()}` : ""}
            </Text>
          </View>
        )}

        <LoadingOverlay visible={showLoader} progress={loadingProgress} label="Showing saved copy" />
      </View>
    );
  }

  if (!isOnline || webError) {
    return <Offline onRetry={handleRetry} />;
  }

  // Online flow
  return (
    <View style={{ flex: 1 }}>
      <WebView
        key={reloadKey}
        ref={webRef}
        source={{ uri: url }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        pullToRefreshEnabled={pullToRefreshEnabled}
        setSupportMultipleWindows={false}
        onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
        onError={() => setWebError(true)}
        onHttpError={(e) => {
          if (e.statusCode >= 400) setWebError(true);
        }}
        onShouldStartLoadWithRequest={(req) => {
          const reqUrl = req?.url ?? "";
          if (EXTERNAL_SCHEMES.some((p) => reqUrl.startsWith(p))) return false;
          return true;
        }}
        onLoadStart={onLoadStart}
        onLoadProgress={onLoadProgress}
        onLoadEnd={onLoadEnd}
        injectedJavaScript={INJECTED_JS}
        onMessage={onMessage}
      />
      <LoadingOverlay visible={showLoader} progress={loadingProgress} label={usingCache ? "Showing saved copy" : "Loading..."} />
    </View>
  );
}