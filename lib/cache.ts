import AsyncStorage from "@react-native-async-storage/async-storage";

const keyFor = (url: string) => {
  const safe = encodeURIComponent(url);
  return { html: `WEB_CACHE_${safe}`, ts: `WEB_CACHE_${safe}_TS` };
};

export async function getSnapshot(url: string): Promise<{ html: string | null; ts: number | null }> {
  const k = keyFor(url);
  const [html, tsStr] = await Promise.all([AsyncStorage.getItem(k.html), AsyncStorage.getItem(k.ts)]);
  return { html, ts: tsStr ? Number(tsStr) : null };
}

export async function setSnapshot(url: string, html: string) {
  const k = keyFor(url);
  const now = Date.now();
  await AsyncStorage.multiSet([
    [k.html, html],
    [k.ts, String(now)],
  ]);
  return now;
}