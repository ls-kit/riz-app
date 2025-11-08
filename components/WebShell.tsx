import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Animated, BackHandler, Platform, Pressable, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useOnline } from "../hooks/useOnline";
import { getSnapshot, setSnapshot } from "../lib/cache";
import { EXTERNAL_SCHEMES } from "../lib/constants";

// Props
type Props = {
  url: string;
  headerHtml?: string;
  showOfflineBanner?: boolean;
};

// Tap listener: only notify for real navigations (no popups / same-page)
const TAP_JS = `
(function(){
  if(window.__rzTapInit) return; window.__rzTapInit=1;

  function normPath(p){ if(!p) return '/'; return p.endsWith('/') && p!=='/' ? p.slice(0,-1) : p; }

  function hasPopupMarkers(el){
    var steps = 0;
    while(el && steps < 3){
      var cls = (el.getAttribute('class')||'').toLowerCase();
      if(/(account|my[-_ ]?account|user[-_ ]?(menu|icon|nav)|login|register|popup|modal|toggle|drawer|offcanvas|flyout|slideout|cart|mini[-_ ]?cart)/.test(cls)) return true;
      if(el.hasAttribute('data-toggle') || el.hasAttribute('data-target') || el.hasAttribute('data-open') || el.hasAttribute('aria-haspopup') || el.hasAttribute('aria-controls')) return true;
      var role = (el.getAttribute('role')||'').toLowerCase();
      if(role==='button' || role==='menuitem') return true;
      el = el.parentElement;
      steps++;
    }
    return false;
  }

  function isMinorNav(href, anchor){
    try{
      if(!href || href==='#' || href==='.' || href==='./') return true;
      if(/^javascript:/i.test(href)) return true;

      // Explicit account/cart popup suppression
      if(/\\/account(\\/|$)/i.test(href) && hasPopupMarkers(anchor)) return true;

      if(hasPopupMarkers(anchor)) return true;

      var cur = new URL(location.href);
      var u = new URL(href, location.href);
      var samePath = (u.origin===cur.origin && normPath(u.pathname)===normPath(cur.pathname));

      if(samePath){
        if(u.search===cur.search && u.hash && u.hash!==cur.hash) return true;
        var minorKeys = ['add-to-cart','remove_item','update_cart','wc-ajax','wc-api','elementor_library','account','login','register','quantity','nonce','_wp'];
        if(minorKeys.some(k => u.search.includes(k))) return true;
      }

      // Header account links often just open a popup
      if(!samePath && /\\/account(\\/|$)/i.test(u.pathname) && hasPopupMarkers(anchor)) return true;

      return false;
    }catch(_){ return false; }
  }

  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest && e.target.closest('a');
    if(!a) return;
    if(e.defaultPrevented) return;
    var href = a.getAttribute('href')||'';
    if(isMinorNav(href, a)) return;
    try{
      var u = new URL(href, location.href);
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'LINK_CLICK', href:u.href}));
    }catch(_){}
  }, false);
})();`;

// Header injection + tap listener
function buildHeaderInject(raw?: string) {
  if (!raw) return TAP_JS;
  const safe = raw.replace(/`/g, "\\`");
  return `
(function(){
  function insert(){
    if(!document.body){return setTimeout(insert,40);}
    if(document.getElementById('__riziq_header')) return;
    var w=document.createElement('div');
    w.id='__riziq_header';
    w.innerHTML=\`${safe}\`;
    document.body.insertBefore(w,document.body.firstChild);
  }
  insert();
  ${TAP_JS}
})();`;
}

// Snapshot saver
const SNAPSHOT_JS = `
(function(){
  function send(){
    try{
      var html=document.documentElement.outerHTML;
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'SNAPSHOT',html}));
    }catch(e){}
  }
  window.addEventListener('load',()=>setTimeout(send,250));
  setTimeout(send,1200);
})();`;

export default function WebShell({ url, headerHtml, showOfflineBanner = true }: Props) {
  const online = useOnline();
  const webRef = useRef<WebView>(null);

  const [currentUrl, setCurrentUrl] = useState(url);

  // Cache
  const [cachedHtml, setCachedHtml] = useState<string | null>(null);
  const [cacheTs, setCacheTs] = useState<number | null>(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  // Navigation
  const [canGoBack, setCanGoBack] = useState(false);

  // Loading bar
  const [barVisible, setBarVisible] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const barAnim = useRef(new Animated.Value(0)).current;

  const showBar = () => {
    setBarVisible(true);
    setProgressPct(5);
    barAnim.setValue(0);
    Animated.timing(barAnim, { toValue: 0.3, duration: 150, useNativeDriver: false }).start();
  };
  const updateBar = (p: number) => {
    const pct = Math.min(99, Math.max(progressPct, Math.floor(p * 100)));
    setProgressPct(pct);
    Animated.timing(barAnim, { toValue: Math.min(1, p), duration: 140, useNativeDriver: false }).start();
  };
  const finishBar = () => {
    setProgressPct(100);
    Animated.timing(barAnim, { toValue: 1, duration: 160, useNativeDriver: false }).start(() => {
      setTimeout(() => setBarVisible(false), 140);
    });
  };

  // Load snapshot once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getSnapshot(url);
        if (!cancelled) {
          setCachedHtml(snap.html);
          setCacheTs(snap.ts);
        }
      } finally {
        if (!cancelled) setCacheLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  // Messages (tap + snapshot)
  const onMessage = async (e: any) => {
    try {
      const data = JSON.parse(e?.nativeEvent?.data || "{}");
      if (data.type === "LINK_CLICK") {
        // Only show bar for real navigations (not popups/minor)
        if (online && !isMinorUrl(String(data.href || ""), currentUrl)) {
          showBar();
        }
        return;
      }
      if (data.type === "SNAPSHOT" && data.html && data.html !== cachedHtml) {
        const ts = await setSnapshot(url, data.html);
        setCachedHtml(data.html);
        setCacheTs(ts);
      }
    } catch {}
  };

  // Android back
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const headerScript = buildHeaderInject(headerHtml);

  // Offline: show cached copy if available; else simple message
  const [webError, setWebError] = useState(false);
  const [webErrorInfo, setWebErrorInfo] = useState<{ code?: number; url?: string; desc?: string } | null>(null);
  const [showOfflineOverlay, setShowOfflineOverlay] = useState(false);

  if (!online) {
    if (cacheLoaded && cachedHtml) {
      return (
        <View style={{ flex: 1 }}>
          <WebView
            ref={webRef}
            originWhitelist={["*"]}
            source={{ html: cachedHtml, baseUrl: url }}
            injectedJavaScriptBeforeContentLoaded={headerScript}
            // Remove meta refresh that may try to navigate after a few seconds
            injectedJavaScript={`(function(){try{var ms=document.querySelectorAll('meta[http-equiv="refresh"]');ms.forEach(function(m){m.parentNode&&m.parentNode.removeChild(m);});}catch(e){}})();true;`}
            onMessage={onMessage}
            onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
            onShouldStartLoadWithRequest={(req) => {
              const u = req?.url ?? "";
              if (EXTERNAL_SCHEMES.some(p => u.startsWith(p))) return false;
              // Block any network navigation while offline
              if (/^https?:\/\//i.test(u)) return false;
              return true;
            }}
            // Prevent the default RN WebView error screen
            onError={() => {}}
            onHttpError={() => {}}
            renderError={() => null}
          />
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, padding: 4, backgroundColor: "#0f172a" }}>
            <Text style={{ color: "#22c55e", fontSize: 11, fontWeight: "700" }}>
              Offline (saved copy) {cacheTs ? "• " + new Date(cacheTs).toLocaleTimeString() : ""}
            </Text>
          </View>
        </View>
      );
    }
    // No snapshot yet
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: "#e2e8f0", fontSize: 20, fontWeight: "800" }}>Offline</Text>
        <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 8, textAlign: "center" }}>
          No saved copy available. Connect to the internet and retry.
        </Text>
      </View>
    );
  }

  // Online
  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ uri: url }}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        injectedJavaScriptBeforeContentLoaded={headerScript}
        injectedJavaScript={SNAPSHOT_JS}
        onMessage={onMessage}
        onNavigationStateChange={(nav) => {
          setCanGoBack(nav.canGoBack);
          if (nav?.url) setCurrentUrl(nav.url);
        }}
        onShouldStartLoadWithRequest={(req) => {
          const u = req?.url ?? "";
          if (EXTERNAL_SCHEMES.some(p => u.startsWith(p))) return false;
          // clear previous error when starting a new navigation
          if (webError) { setWebError(false); setWebErrorInfo(null); }
          const isTop = (req as any)?.isTopFrame !== false;
          if (isTop && !isMinorUrl(u, currentUrl) && !barVisible) showBar();
          return true;
        }}
        onLoadStart={() => { if (barVisible) updateBar(0.35); }}
        onLoadProgress={(e) => { if (barVisible) updateBar(e?.nativeEvent?.progress ?? 0); }}
        onLoadEnd={() => { if (barVisible) finishBar(); }}
        onError={(e) => {
          setBarVisible(false);
          setWebError(true);
          setWebErrorInfo({
            code: e?.nativeEvent?.code,
            url: e?.nativeEvent?.url,
            desc: e?.nativeEvent?.description || "Load error"
          });
        }}
        onHttpError={(e) => {
          // Show overlay for non-404 errors (keep native 404 page visible)
            if (e.statusCode !== 404) {
              setBarVisible(false);
              setWebError(true);
              setWebErrorInfo({
                code: e.statusCode,
                url: e?.nativeEvent?.url,
                desc: `HTTP ${e.statusCode}`
              });
            }
        }}
      />

      {barVisible && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6 }}>
          <Animated.View
            style={{
              height: "100%",
              width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            }}
          >
            <LinearGradient
              colors={["#22c55e", "#16a34a", "#0d9488"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, borderRadius: 3 }}
            />
            {/* Mini percentage badge (rounded rectangle) */}
            <Animated.View
              style={{
                position: "absolute",
                right: -22,        // sits just ahead of the bar
                top: -6,           // small lift above the 6px bar
                minWidth: 28,
                height: 14,
                paddingHorizontal: 6,
                borderRadius: 7,   // rounded corners
                backgroundColor: "#fef08a",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#facc15",
                elevation: 3,
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1 },
              }}
            >
              <Text style={{ fontSize: 9, lineHeight: 12, fontWeight: "800", color: "#0f172a" }}>
                {progressPct}%
              </Text>
            </Animated.View>
          </Animated.View>
        </View>
      )}

      {webError && (
        <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(15,23,42,0.94)", alignItems: "center", justifyContent: "center", padding: 28 }}>
          <LinearGradient
            colors={["#0f172a", "#1e293b", "#0f172a"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: "absolute", inset: 0 }}
          />
          <View style={{ width: "100%", maxWidth: 400, backgroundColor: "#ffffff", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "#e2e8f0" }}>
            <Text style={{ color: "#0f172a", fontSize: 22, fontWeight: "800" }}>Unable to load</Text>
            <Text style={{ color: "#475569", fontSize: 14, marginTop: 10, lineHeight: 20 }}>
              {webErrorInfo?.desc || "Connection problem."}{webErrorInfo?.code ? ` (Code: ${webErrorInfo.code})` : ""}
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 22 }}>
              <Pressable
                onPress={() => {
                  setWebError(false);
                  setWebErrorInfo(null);
                  webRef.current?.reload();
                  showBar();
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed ? "#f1f5f9" : "#f8fafc",
                  paddingVertical: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  alignItems: "center"
                })}
              >
                <Text style={{ color: "#0f172a", fontWeight: "700" }}>Retry</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setWebError(false);
                  setWebErrorInfo(null);
                  webRef.current?.injectJavaScript(`window.location.href='${url}';true;`);
                  showBar();
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed ? "#16a34a" : "#22c55e",
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: "center"
                })}
              >
                <Text style={{ color: "#0f172a", fontWeight: "800" }}>Home</Text>
              </Pressable>
            </View>
            <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 16, textAlign: "center" }}>
              Check your internet connection.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// After barVisible / progressPct state, add helper in TS side (before return):
// Helper to decide if a URL change is "minor" (no progress bar)
function isMinorUrl(nextUrl: string, currentUrl: string): boolean {
  try {
    const norm = (p: string) => (p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p);
    const n = new URL(nextUrl);
    const c = new URL(currentUrl);
    const samePath = n.origin === c.origin && norm(n.pathname) === norm(c.pathname);
    if (samePath) {
      if (n.search === c.search && n.hash && n.hash !== c.hash) return true;
      const minor = ['add-to-cart','remove_item','update_cart','wc-ajax','wc-api','elementor_library','account','login','register','quantity','nonce','_wp'];
      if (minor.some(k => n.search.includes(k))) return true;
    }
    return false;
  } catch {
    return false;
  }
}