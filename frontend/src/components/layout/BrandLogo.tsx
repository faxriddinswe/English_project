import styles from "./BrandLogo.module.css";
import { PublicLink } from "@/components/ui/PublicLink";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
  label?: string;
}

export function BrandLogo({
  size = "md",
  className = "",
  href = "/",
  label = "Sherzod English — Bosh sahifa",
}: BrandLogoProps) {
  return (
    <PublicLink
      href={href}
      className={`${styles.logo} ${styles[size]} ${className}`}
      aria-label={label}
    >
      <div className={styles.monogram} aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect
            width="48"
            height="48"
            rx="12"
            fill="currentColor"
            className={styles.monogramBg}
          />
          <text
            x="50%"
            y="50%"
            dominantBaseline="central"
            textAnchor="middle"
            fill="white"
            fontSize="20"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            SE
          </text>
        </svg>
      </div>
      <div className={styles.wordmark}>
        <span className={styles.wordmarkTop}>SHERZOD</span>
        <span className={styles.wordmarkBottom}>ENGLISH</span>
      </div>
    </PublicLink>
  );
}
