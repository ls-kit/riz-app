import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, StatusBar as RNStatusBar, View } from "react-native";
import WebShell from "../components/WebShell";
import { HOME_URL } from "../lib/constants";

export default function Intro() {
  const topPad = Platform.OS === "android" ? (RNStatusBar.currentHeight ?? 0) + 20 : 60;

  const headerHtml = `
    <style>
      #__riziq_header{box-sizing:border-box;}
      #__riziq_header .rz-wrap{
        background:linear-gradient(135deg,#0f172a 0%,#1e293b 65%,#0f172a 100%);
        padding:16px 5px 5px;
        font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
        border-bottom:1px solid rgba(255,255,255,0.08);
      }
      #__riziq_header h2{
        margin:0 0 14px;
        font-size:18px;font-weight:800;letter-spacing:.3px;color:#e2e8f0;
        display:flex;align-items:center;gap:8px;
      }
      #__riziq_header .rz-grid{
        display:grid;grid-template-columns:repeat(5,1fr);gap:5px;
      }
      #__riziq_header a.rz-item{
        text-decoration:none;background:#ffffff;border:1px solid #e5e7eb;
        border-radius:5px;padding:7px 3px 4px;display:flex;flex-direction:column;
        align-items:center;gap:6px;box-shadow:0 3px 10px rgba(0,0,0,0.07);
        transition:transform .18s ease, box-shadow .18s ease;
      }
      #__riziq_header a.rz-item:active{transform:scale(.95);box-shadow:0 2px 6px rgba(0,0,0,0.08);}
      #__riziq_header a.rz-item span.ic{font-size:20px;}
      #__riziq_header a.rz-item span.txt{
        font-size:12px;font-weight:800;color:#0f172a;letter-spacing:.3px;text-align:center;line-height:1.15;
      }
      @media (max-width:530px){
        #__riziq_header .rz-grid{grid-template-columns:repeat(5,1fr);}
        #__riziq_header a.rz-item{padding:9px 4px 8px;}
      }
    </style>
    <div class="rz-wrap">
    
      <div class="rz-grid">
        <a href="${HOME_URL}/earning"  class="rz-item"><span class="ic">💰</span><span class="txt">Earning</span></a>
        <a href="${HOME_URL}/investor" class="rz-item"><span class="ic">📈</span><span class="txt">Investor</span></a>
        <a href="${HOME_URL}/training" class="rz-item"><span class="ic">🎓</span><span class="txt">Training</span></a>
        <a href="${HOME_URL}/business" class="rz-item"><span class="ic">💼</span><span class="txt">Business</span></a>
        <a href="${HOME_URL}/mart"     class="rz-item"><span class="ic">🛒</span><span class="txt">Mart</span></a>

        <a href="${HOME_URL}/report"   class="rz-item"><span class="ic">📄</span><span class="txt">Report</span></a>
        <a href="${HOME_URL}/account"  class="rz-item"><span class="ic">👤</span><span class="txt">Account</span></a>
        <a href="${HOME_URL}/wallet"   class="rz-item"><span class="ic">💳</span><span class="txt">Wallet</span></a>
        <a href="${HOME_URL}/settings" class="rz-item"><span class="ic">⚙️</span><span class="txt">Settings</span></a>
        <a href="${HOME_URL}/support"  class="rz-item"><span class="ic">🛠️</span><span class="txt">Support</span></a>
      </div>
    </div>
  `;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#0f172a", "#1e293b", "#0f172a"]} style={{ flex: 1 }}>
        <StatusBar style="light" />
        {/* Optional native-only spacer if you still want space above WebView */}
        <View style={{ height: topPad }} />
        <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
          <WebShell
            url={HOME_URL}
            headerHtml={headerHtml}
          />
        </View>
      </LinearGradient>
    </View>
  );
}