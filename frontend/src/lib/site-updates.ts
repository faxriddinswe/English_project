"use client";
export const SITE_UPDATE_CHANNEL = "sherzod-site-updates";
export function announceSiteUpdate() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(SITE_UPDATE_CHANNEL);
  channel.postMessage("content-changed");
  channel.close();
}
