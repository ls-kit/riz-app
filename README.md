# Riziq App — WebView Android অ্যাপ গাইড

এই অ্যাপটি Expo + React Native দিয়ে তৈরি, যেখানে:
- প্রথম স্ক্রিনটি স্ট্যাটিক (ইন্ট্রো)
- বোতাম ক্লিক করলে WebView-তে WordPress সাইট লোড হয়
- প্রতিটি পেজ/নেভিগেশনে কাস্টম লোডিং স্ক্রিন দেখায়
- প্রথম সফল লোডের HTML স্ন্যাপশট সেভ হয়ে পরে অফলাইনে ফfallback দেখাতে পারে

## দ্রুত শুরু

- Windows PowerShell/Terminal:
```
npm i
npx expo install expo-linear-gradient react-native-webview @react-native-async-storage/async-storage expo-network
npx expo start
```
- Android ডিভাইসে টেস্ট:
```
npx expo run:android
```

## ফোল্ডার স্ট্রাকচার (মূল ফাইলগুলি)

- app/_layout.tsx — Expo Router লেআউট (header লুকানো)
- app/index.tsx — Intro স্ক্রিন (স্ট্যাটিক, বোতাম -> /web)
- app/web.tsx — খুব ছোট স্ক্রিন যা WebShell ব্যবহার করে
- components/WebShell.tsx — WebView + Loader + Offline cache-এর সব লজিক (মেইন কম্পোনেন্ট)
- components/LoadingOverlay.tsx — আকর্ষণীয় লোডার (গ্রেডিয়েন্ট, লোগো, প্রগ্রেস বার)
- components/Offline.tsx — অফলাইন স্ক্রিন (Retry বাটন)
- hooks/useOnline.ts — নেটওয়ার্ক স্টেট ডিটেক্ট
- lib/constants.ts — সাইট URL ও এক্সটার্নাল স্কিমের কনফিগ
- lib/cache.ts — HTML স্ন্যাপশট AsyncStorage-এ সেভ/রিড
- app.json — আইকন/সপ্ল্যাশ/প্লাগইন কনফিগ

## কীভাবে কাজ করে (ছোট করে)

- Intro স্ক্রিন (app/index.tsx) থেকে বোতামে router.push("/web") করা হয়।
- app/web.tsx => <WebShell url={HOME_URL} /> — এখানে HOME_URL (lib/constants.ts) থেকে আসে।
- WebShell:
  - অনলাইন থাকলে লাইভ পেজ লোড করে, প্রতিবার নেভিগেশনে লোডার দেখায়।
  - ইনজেক্টেড JS DOM snapshot তুলে AsyncStorage-এ সেভ রাখে (সর্বশেষ কপি)।
  - অফলাইন বা লোডিং এরর হলে সেভ করা HTML দেখায় + ছোট Offline ব্যানার।
  - Android ব্যাক বাটনে WebView.goBack() সাপোর্ট করে।

## কোথায় কী কাস্টমাইজ করবেন

1) WordPress সাইট URL
- ফাইল: lib/constants.ts
- HOME_URL আপডেট করুন:
```ts
export const HOME_URL = "https://your-wordpress-site.com/start-page";
```

2) Intro স্ক্রিনের লেখা/বোতাম/লোগো
- ফাইল: app/index.tsx
- লোগো ইমেজ: assets/images/rizround.png
- বোতাম রং/টেক্সট/গ্রেডিয়েন্ট এখানে বদলান।

3) লোডিং স্ক্রিন (ব্র্যান্ডিং, রং, টেক্সট)
- ফাইল: components/LoadingOverlay.tsx
- লোগো: require("../assets/images/rizround.png")
- গ্রেডিয়েন্টের রং, টেক্সট, প্রগ্রেস বার রং এখানে বদলান।
- এটি WebShell যেকোনো লোডে দেখায় (অনলাইন/ক্যাশড—সবক্ষেত্রে)।

4) Offline স্ক্রিন
- ফাইল: components/Offline.tsx
- ছবি: assets/images/splash-icon.png
- টেক্সট/বোতাম/গ্রেডিয়েন্ট এখানে বদলান।

5) External লিংক নীতি
- ফাইল: lib/constants.ts → EXTERNAL_SCHEMES
- ডিফল্টে tel:, mailto:, whatsapp:, geo:, intent: ব্লক করা।
- ওপেন করতে চাইলে WebShell-এর onShouldStartLoadWithRequest-এ Linking.openURL ব্যবহার করে হ্যান্ডেল করতে পারেন (ঐচ্ছিক)।

6) Pull-to-Refresh
- WebShell প্রপ: pullToRefreshEnabled (ডিফল্ট true)।
- app/web.tsx-এ প্রয়োজনে <WebShell url={HOME_URL} pullToRefreshEnabled={false} /> সেট করুন।

## অফলাইন/ক্যাশিং কীভাবে কাজ করে

- কী সেভ হয়: বর্তমান পেজের DOM-এর HTML (document.documentElement.outerHTML)।
- কখন সেভ হয়: পেজ লোডের পর ইনজেক্টেড JS কয়েকবার স্ন্যাপশট পাঠায়; সর্বশেষ কপি AsyncStorage-এ আপডেট হয়।
- কী দেখায়: অফলাইন/এরর হলে সেভ করা কপি WebView-তে দেখায়, টপে “Offline • updated <time>” ব্যানার।
- কী সেভ হয় না: CSS/JS/ইমেজ ফাইলগুলো আলাদা করে ডাউনলোড হয় না। তাই পূর্ণ অফলাইন অভিজ্ঞতার জন্য WordPress সাইটে PWA সক্ষম করুন।

### WordPress-এর জন্য সুপারিশ (PWA)
- সাইটে PWA প্লাগইন চালু করুন (যেমন “Super Progressive Web Apps”, “PWA by PWA Plugin Contributors”, বা “LiteSpeed Cache” এর PWA)।
- Service Worker-এর মাধ্যমে একাধিক পেজ/অ্যাসেট অফলাইন ক্যাশ হবে, WebView-তেও কাজ করবে।
- Start URL যেন HOME_URL-এর সাথে মিলে।

## ক্যাশ ক্লিয়ার করবেন কীভাবে

- অ্যাপ আনইনস্টল/রিইনস্টল করলে ক্লিয়ার হয়ে যায়।
- ডেভেলপমেন্টে নির্দিষ্ট URL ক্যাশ ক্লিয়ার করতে AsyncStorage থেকে key মুছুন (WEB_CACHE_<encodeURIComponent(url)> ও _TS)।

## আইকন/স্প্ল্যাশ

- app.json-এ কনফিগ আছে:
  - আইকন: assets/images/icon.png
  - Android adaptive: foreground/background/monochrome ইমেজ
  - Splash: assets/images/splash-icon.png
- এগুলো আপনার ব্র্যান্ড অনুযায়ী বদলান।

## টিপস

- Android ব্যাক বাটন: WebView ভেতরে নেভিগেশনে ব্যাক করে; রুটে গেলে OS ব্যাক আচরণে ফিরে যায়।
- মিক্সড কনটেন্ট এড়াতে সাইটে HTTPS রাখুন।
- URL পাল্টালে আগের ক্যাশ দেখা যেতে পারে; প্রয়োজন হলে ক্যাশ ক্লিয়ার করুন।

## বিল্ড/রিলিজ (সংক্ষেপে)

- লোকালি ডিবাগ APK (bare/preview):
```
npx expo run:android
```
- ক্লাউড বিল্ড (সুপারিশকৃত):
```
npm i -g eas-cli
eas login
eas build -p android --profile preview
```

## ফাইল রেফারেন্স দ্রুত লিংক

- Intro: app/index.tsx
- WebView Shell: components/WebShell.tsx
- Loader: components/LoadingOverlay.tsx
- Offline: components/Offline.tsx
- URL/স্কিম: lib/constants.ts
- Cache utils: lib/cache.ts
- Network hook: hooks/useOnline.ts

সব কনফিগ এক জায়গায় (lib/constants.ts) রাখায় ভবিষ্যতে URL/নীতি বদলানো সহজ। Loader/Offline আলাদা কম্পোনেন্ট হওয়ায় ডিজাইন কাস্টমাইজ করাও সহজ।


## Go to intro url
<a href="riziqapp://">Back to App Home</a>
<button onclick="window.location.href='riziqapp://'">
   Back to App Home
</button>
"scheme": "riziqapp"

## Start in tunnel mode + clear cache
npx expo start --tunnel --clear
