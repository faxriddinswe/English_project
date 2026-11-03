"use client";
import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

/** Same-page section links should reveal the page heading, not retain the footer. */
export function PublicLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.currentTarget.target === "_blank"
    )
      return;
    const target = new URL(event.currentTarget.href);
    if (
      target.origin === location.origin &&
      target.pathname === location.pathname &&
      target.search === location.search &&
      !target.hash
    ) {
      event.preventDefault();
      const reveal = () => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      };
      reveal();
      requestAnimationFrame(reveal);
      const heading = document.querySelector<HTMLElement>("main h1");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    }
  };
  return <Link {...props} onClick={handleClick} />;
}
