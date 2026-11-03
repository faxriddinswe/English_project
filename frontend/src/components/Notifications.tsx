"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  NOTIFICATION_EVENT,
  type NotificationMessage,
} from "@/lib/notifications";
import styles from "./Notifications.module.css";
type Item = NotificationMessage & { id: number };
const subscribeToClient = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
function NotificationCard({ item, close }: { item: Item; close: () => void }) {
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const change = () => setHidden(document.visibilityState === "hidden");
    change();
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  const remaining = useRef(item.kind === "error" ? 4000 : 3000);
  useEffect(() => {
    if (paused || hidden) return;
    const started = Date.now();
    const timer = window.setTimeout(close, remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(
        0,
        remaining.current - (Date.now() - started),
      );
    };
  }, [paused, hidden, close]);
  return (
    <li
      className={`${styles.card} ${styles[item.kind]}`}
      data-toast
      data-testid="notification"
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPaused(false);
      }}
    >
      <span className={styles.symbol} aria-hidden="true">
        {item.kind === "success" ? "✓" : item.kind === "error" ? "!" : "i"}
      </span>
      <div className={styles.copy}>
        <strong>{item.title}</strong>
        {item.description && <p>{item.description}</p>}
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="Bildirishnomani yopish"
        className={styles.close}
      >
        ×
      </button>
    </li>
  );
}
export function Notifications() {
  const [items, setItems] = useState<Item[]>([]);
  const mounted = useSyncExternalStore(
    subscribeToClient,
    clientSnapshot,
    serverSnapshot,
  );
  const nextId = useRef(0);
  useEffect(() => {
    const receive = (event: Event) => {
      const message = (event as CustomEvent<NotificationMessage | null>).detail;
      if (!message) {
        setItems([]);
        return;
      }
      if (
        !message.title ||
        !["success", "error", "info"].includes(message.kind)
      )
        return;
      const id = ++nextId.current;
      setItems((previous) =>
        [
          { ...message, id },
          ...previous.filter(
            (item) =>
              item.title !== message.title || item.kind !== message.kind,
          ),
        ].slice(0, 3),
      );
    };
    window.addEventListener(NOTIFICATION_EVENT, receive);
    return () => window.removeEventListener(NOTIFICATION_EVENT, receive);
  }, []);
  if (!mounted) return null;
  return createPortal(
    <section
      className={styles.viewport}
      aria-label="Bildirishnomalar"
      aria-live="polite"
      aria-relevant="additions text"
    >
      <ol>
        {items.map((item) => (
          <NotificationCard
            key={item.id}
            item={item}
            close={() =>
              setItems((previous) =>
                previous.filter((value) => value.id !== item.id),
              )
            }
          />
        ))}
      </ol>
    </section>,
    document.body,
  );
}
