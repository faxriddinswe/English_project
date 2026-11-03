"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./PWA.module.css";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
const DISMISSED_KEY = "se-install-dismissed-until";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

export function PWA() {
  const pathname = usePathname();
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [update, setUpdate] = useState<ServiceWorker | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return Number(localStorage.getItem(DISMISSED_KEY) ?? 0) > Date.now();
    } catch {
      return false;
    }
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const notice = useRef<HTMLElement>(null);
  const busy = useRef(false);
  // Forms and private workspaces take priority over optional installation/update UI.
  const quietRoute =
    /^\/(teacher|student|login|change-password|contact)(\/|$)/.test(
      pathname ?? "",
    );

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const local =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (local) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((reg) => reg.unregister())),
        )
        .catch(() => {});
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => {
            return Promise.all(
              keys
                .filter((key) => key.startsWith("sherzod-public-"))
                .map((key) => caches.delete(key)),
            );
          })
          .catch(() => {});
      }
    }
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const checkDisplay = () =>
      setStandalone(
        displayMode.matches ||
          !!(navigator as Navigator & { standalone?: boolean }).standalone,
      );
    const installed = () => {
      setInstall(null);
      setStandalone(true);
    };
    const before = (event: Event) => {
      const promptEvent = event as InstallEvent;
      if (typeof promptEvent.prompt !== "function" || !promptEvent.userChoice)
        return;
      event.preventDefault();
      setError("");
      setInstall(promptEvent);
    };
    const displayFrame = requestAnimationFrame(checkDisplay);
    displayMode.addEventListener("change", checkDisplay);
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", installed);
    let alive = true;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    const stateChange = () => {
      if (
        alive &&
        installing?.state === "installed" &&
        navigator.serviceWorker.controller
      )
        setUpdate(installing);
    };
    const updateFound = () => {
      installing?.removeEventListener("statechange", stateChange);
      installing = registration?.installing ?? null;
      installing?.addEventListener("statechange", stateChange);
    };
    if (!local)
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (!alive) return;
          registration = reg;
          if (reg.waiting) setUpdate(reg.waiting);
          reg.addEventListener("updatefound", updateFound);
          updateFound();
        })
        .catch(() => {});
    return () => {
      alive = false;
      cancelAnimationFrame(displayFrame);
      displayMode.removeEventListener("change", checkDisplay);
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", installed);
      registration?.removeEventListener("updatefound", updateFound);
      installing?.removeEventListener("statechange", stateChange);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const check = () => {
      const editing = document.activeElement?.matches(
        "input, textarea, select, [contenteditable='true']",
      );
      const keyboard =
        window.visualViewport &&
        window.innerHeight - window.visualViewport.height > 120;
      setBlocked(
        !!editing ||
          !!keyboard ||
          document.body.style.overflow === "hidden" ||
          !!document.querySelector('[role="dialog"][aria-modal="true"]'),
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(check);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "aria-modal"],
    });
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, []);

  const visible =
    !quietRoute &&
    !blocked &&
    (!!update || !!error || (!!install && !standalone && !dismissed));
  useEffect(() => {
    if (!visible || !notice.current) return;
    // Reserve enough document space for the fixed card, including a device's bottom inset.
    const measure = () => {
      if (!notice.current) return;
      const gap =
        window.innerHeight - notice.current.getBoundingClientRect().top + 12;
      document.documentElement.style.setProperty(
        "--pwa-notice-space",
        `${Math.ceil(gap)}px`,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(notice.current);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      document.documentElement.style.removeProperty("--pwa-notice-space");
    };
  }, [visible, error]);

  if (!visible) return null;
  const dismiss = () => {
    if (update) setUpdate(null);
    else {
      setDismissed(true);
      try {
        localStorage.setItem(
          DISMISSED_KEY,
          String(Date.now() + DISMISS_DURATION),
        );
      } catch {}
    }
    setError("");
  };
  return (
    <aside
      ref={notice}
      className={styles.notice}
      aria-label={update ? "Ilova yangilanishi" : "Ilovani o‘rnatish"}
    >
      <img
        className={styles.icon}
        src="/icons/icon-192.png"
        width={40}
        height={40}
        alt=""
      />
      <div className={styles.copy}>
        <strong>
          {update ? "Yangi versiya tayyor" : "Sherzod English’ni o‘rnating"}
        </strong>
        <p>
          {update
            ? "Sizga qulay paytda yangilang."
            : "Ilovani bosh ekrandan oching."}
        </p>
      </div>
      <button
        type="button"
        className={styles.close}
        onClick={dismiss}
        disabled={pending}
        aria-label="Bildirishnomani yopish"
      >
        ×
      </button>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {(install || update) && (
        <button
          type="button"
          className={`button ${styles.action}`}
          disabled={pending}
          onClick={async () => {
            if (busy.current) return;
            busy.current = true;
            setPending(true);
            setError("");
            try {
              if (update) {
                navigator.serviceWorker.addEventListener(
                  "controllerchange",
                  () => window.location.reload(),
                  { once: true },
                );
                update.postMessage({ type: "SKIP_WAITING" });
              } else if (install) {
                await install.prompt();
                const choice = await install.userChoice;
                setInstall(null); // A native prompt event may only be used once.
                if (choice.outcome === "dismissed") dismiss();
              }
            } catch {
              setInstall(null);
              setPending(false);
              setError("Brauzer menyusidan qayta urinib ko‘ring.");
            } finally {
              busy.current = false;
              if (!update) setPending(false);
            }
          }}
        >
          {pending ? "Kutilmoqda…" : update ? "Yangilash" : "O‘rnatish"}
        </button>
      )}
    </aside>
  );
}
