import styles from "./StatsSection.module.css";

interface StatItem {
  value: string;
  label: string;
}

interface StatsSectionProps {
  stats?: StatItem[];
}

// Default placeholder stats — production'da CMS'dan keladi
const DEFAULT_STATS: StatItem[] = [
  { value: "—", label: "Yillik tajriba" },
  { value: "—", label: "O'quvchilar" },
  { value: "—", label: "IELTS natijalari" },
  { value: "—", label: "CEFR sertifikatlari" },
];

export function StatsSection({ stats }: StatsSectionProps) {
  const items = stats ?? DEFAULT_STATS;

  // Agar hech qanday haqiqiy ma'lumot yo'q bo'lsa yashiramiz
  const hasRealData = items.some((s) => s.value !== "—" && s.value !== "");
  if (!hasRealData) return null;

  return (
    <section className={styles.stats} aria-label="Statistika">
      <div className="container">
        <ul className={styles.grid} role="list">
          {items.map((item, i) => (
            <li key={i} className={styles.item}>
              <span className={styles.value}>{item.value}</span>
              <span className={styles.label}>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
