"use client";
export const WORKSPACE_UPDATES_CHANNEL = "sherzod-workspace-updates";
export function announceWorkspaceUpdate() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined")
    return;
  const channel = new BroadcastChannel(WORKSPACE_UPDATES_CHANNEL);
  channel.postMessage("changed");
  channel.close();
}
