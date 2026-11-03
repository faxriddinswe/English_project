"use client";
import { useState, type ReactNode } from "react";
import { notify } from "@/lib/notifications";
import { safeErrorText } from "@/lib/uz";
export function DownloadButton({
  path,
  filename,
  children,
  className = "button secondary",
}: {
  path: string;
  filename: string;
  children: ReactNode;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const response = await fetch(path, {
            credentials: "same-origin",
            cache: "no-store",
          });
          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(
              safeErrorText(
                error.message ??
                  "Faylni tayyorlab bo‘lmadi. Qayta urinib ko‘ring.",
              ),
            );
          }
          if (
            !response.headers
              .get("content-type")
              ?.includes(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              )
          )
            throw new Error(
              "Jadval faylini tayyorlab bo‘lmadi. Qayta urinib ko‘ring.",
            );
          const blob = await response.blob();
          const signature = new Uint8Array(
            await blob.slice(0, 4).arrayBuffer(),
          );
          if (
            signature[0] !== 0x50 ||
            signature[1] !== 0x4b ||
            signature[2] !== 3 ||
            signature[3] !== 4
          )
            throw new Error(
              "Excel faylini tayyorlab bo‘lmadi. Qayta urinib ko‘ring.",
            );
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.append(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
          notify({
            kind: "success",
            title: "Excel fayli yuklab olishga tayyorlandi.",
          });
        } catch (error) {
          notify({
            kind: "error",
            title: "Excel fayli yuklanmadi.",
            description:
              error instanceof Error ? error.message : "Qayta urinib ko‘ring.",
          });
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Tayyorlanmoqda…" : children}
    </button>
  );
}
