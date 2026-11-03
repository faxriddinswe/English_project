"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRef, type ReactNode } from "react";
export function Dialog({
  open,
  onOpenChange,
  title,
  children,
  className = "",
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content
          className={`dialog-content ${className}`}
          aria-describedby={undefined}
          onEscapeKeyDown={(event) => {
            // An expanded search consumes the first Escape; the next closes the dialog.
            if (
              (event.target as HTMLElement)?.closest?.(
                '[role="combobox"][aria-expanded="true"]',
              )
            )
              event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if ((event.target as HTMLElement)?.closest?.("[data-toast]"))
              event.preventDefault();
          }}
          onOpenAutoFocus={() => {
            returnFocus.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            const target =
              (returnFocusRef?.current?.isConnected
                ? returnFocusRef.current
                : null) ??
              (returnFocus.current?.isConnected ? returnFocus.current : null) ??
              (typeof document !== "undefined"
                ? (document.querySelector<HTMLElement>(
                    ".workspace-menu-toggle",
                  ) ?? null)
                : null);
            if (target?.isConnected) {
              event.preventDefault();
              target.focus({ preventScroll: true });
              setTimeout(() => {
                if (target.isConnected) {
                  target.focus({ preventScroll: true });
                }
              }, 50);
            }
            returnFocus.current = null;
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close className="dialog-close" aria-label="Yopish">
            ×
          </DialogPrimitive.Close>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
