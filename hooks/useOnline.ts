import * as Network from "expo-network";
import { useEffect, useRef, useState } from "react";

export function useOnline() {
  const [online, setOnline] = useState<boolean>(true);
  const poller = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    let sub: any;

    const check = async () => {
      const st = await Network.getNetworkStateAsync();
      const isOn = !!st.isConnected && st.isInternetReachable !== false;
      setOnline(isOn);
    };

    check();

    // Some SDKs expose addNetworkStateListener; if not, fall back to polling
    const maybeSub = (Network as any)?.addNetworkStateListener?.((st: any) => {
      const isOn = !!st.isConnected && st.isInternetReachable !== false;
      setOnline(isOn);
    });

    if (maybeSub) {
      sub = maybeSub;
    } else {
      poller.current = setInterval(check, 3000);
    }

    return () => {
      if (sub?.remove) sub.remove();
      if (poller.current) clearInterval(poller.current);
    };
  }, []);

  return online;
}