"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SITE_UPDATE_CHANNEL } from "@/lib/site-updates";

export function useSiteUpdates() {
  const router = useRouter();
  useEffect(() => {
    let revision: string | undefined;
    let active = true;
    let busy = false;
    const controller = new AbortController();
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const check = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const response = await fetch("/api/v1/public/revision", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const result = (await response.json()) as { revision: string };
        if (!active) return;
        if (revision && revision !== result.revision) refresh();
        revision = result.revision;
      } catch {
        /* A failed freshness check never reports a successful write. */
      } finally {
        busy = false;
      }
    };
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(SITE_UPDATE_CHANNEL)
        : null;
    if (channel) channel.onmessage = refresh;
    const interval = window.setInterval(check, 5000);
    const visible = () => {
      void check();
    };
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    void check();
    return () => {
      active = false;
      controller.abort();
      channel?.close();
      clearInterval(interval);
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [router]);
}
