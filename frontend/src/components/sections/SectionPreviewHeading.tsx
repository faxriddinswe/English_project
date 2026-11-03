import { PublicLink as Link } from "@/components/ui/PublicLink";
import styles from "./HomePreviews.module.css";
export function SectionPreviewHeading({
  id,
  title,
  description,
  href,
  label = "Batafsil",
}: {
  id?: string;
  title: string;
  description?: string;
  href: string;
  label?: string;
}) {
  return (
    <div className={styles.headingRow}>
      <div>
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <Link
        className={styles.more}
        href={href}
        aria-label={`${title} — ${label}`}
      >
        {label}
        <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
