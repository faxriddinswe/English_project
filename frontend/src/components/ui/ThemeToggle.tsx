"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label =
    theme === "dark" ? "Yorug‘ rejimga o‘tish" : "Qorong‘u rejimga o‘tish";
  return (
    <button
      type="button"
      onClick={toggle}
      className={styles.toggle}
      aria-label={label}
      title={label}
    >
      {theme === "dark" ? (
        <Sun size={16} strokeWidth={1.8} aria-hidden="true" />
      ) : (
        <Moon size={16} strokeWidth={1.8} aria-hidden="true" />
      )}
    </button>
  );
}
