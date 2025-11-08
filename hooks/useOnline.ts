import * as Network from "expo-network";
import { useEffect, useRef, useState } from "react";

export function useOnline() {
  const [online, setOnline] = useState<boolean>(true);
  const lastVal = useRef<boolean>(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let sub: any;

    const publish = (next: boolean) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // Debounce to avoid quick flip/flop
      debounceRef.current = setTimeout(() => {
        if (lastVal.current !== next) {
          lastVal.current = next;
          setOnline(next);
        }
      }, 800);
    };

    const check = async () => {
      try {
        const st = await Network.getNetworkStateAsync();
        // Treat null as "unknown" → keep previous
        const reachable = st.isInternetReachable;
        const next =
          !!st.isConnected && (reachable === null ? lastVal.current : reachable !== false);
        publish(next);
      } catch {
        publish(true);
      }
    };

    check();

    const maybeSub = (Network as any)?.addNetworkStateListener?.((st: any) => {
      const reachable = st.isInternetReachable;
      const next =
        !!st.isConnected && (reachable === null ? lastVal.current : reachable !== false);
      publish(next);
    });

    if (maybeSub) {
      sub = maybeSub;
    } else {
      const id = setInterval(check, 3000);
      sub = { remove: () => clearInterval(id) };
    }

    return () => {
      if (sub?.remove) sub.remove();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return online;
}