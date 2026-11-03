"use client";

import { useState, useEffect, useRef } from "react";
import { PublicLink as Link } from "@/components/ui/PublicLink";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useScrolled } from "@/hooks/useScrolled";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import styles from "./SiteHeader.module.css";

export const PUBLIC_NAV_LINKS = [
  { href: "/", label: "Asosiy" },
  { href: "/about", label: "Ustoz haqida" },
  { href: "/courses", label: "Kurslar" },
  { href: "/results", label: "Natijalar" },
  { href: "/faq", label: "Savollar" },
  { href: "/contact", label: "Bog‘lanish" },
];

interface SiteHeaderProps {
  links?: { href: string; label: string }[];
  phone?: string;
}

export function SiteHeader({
  links = PUBLIC_NAV_LINKS,
  phone,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    pathname === href || (href !== "/" && !!pathname?.startsWith(href + "/"));
  const scrolled = useScrolled(60);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1321px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  // Close menu on route change / outside click
  useEffect(() => {
    if (!menuOpen) return;
    const hamburger = hamburgerRef.current;
    const handleClick = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !hamburgerRef.current?.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    const frame = requestAnimationFrame(() =>
      menuRef.current?.querySelector<HTMLElement>("button, a")?.focus(),
    );
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = menuRef.current?.querySelectorAll<HTMLElement>("a,button");
      if (!els?.length) return;
      const first = els[0],
        last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", trap);
      hamburger?.focus();
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`${styles.header} ${scrolled ? styles.scrolled : styles.transparent}`}
      role="banner"
    >
      <div
        className={`${styles.inner} ${scrolled ? styles.innerScrolled : ""}`}
      >
        <BrandLogo size="md" />

        {/* Desktop nav */}
        <nav className={styles.nav} aria-label="Asosiy menyu">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.navLink}
              aria-current={isCurrent(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className={styles.actions}>
          {phone && (
            <a href={`tel:${phone}`} className={styles.phone}>
              {phone}
            </a>
          )}
          <Link
            className={styles.cabinetBtn}
            href="/login"
            aria-label="Kabinetga kirish"
          >
            Kabinet
          </Link>

          <ThemeToggle />

          {/* Hamburger */}
          <button
            ref={hamburgerRef}
            className={styles.hamburger}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Menyuni yopish" : "Menyuni ochish"}
          >
            <span
              className={`${styles.hamburgerLine} ${menuOpen ? styles.open : ""}`}
            />
            <span
              className={`${styles.hamburgerLine} ${menuOpen ? styles.open : ""}`}
            />
            <span
              className={`${styles.hamburgerLine} ${menuOpen ? styles.open : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className={styles.mobileMenu}
          role="dialog"
          aria-modal="true"
          aria-label="Mobil menyu"
        >
          <button
            className="button secondary"
            onClick={() => setMenuOpen(false)}
          >
            Menyuni yopish ×
          </button>
          <nav className={styles.mobileNav}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                className={styles.mobileNavLink}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="/login"
              className={styles.mobileCabinetBtn}
              onClick={() => setMenuOpen(false)}
            >
              Kabinetga kirish
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
