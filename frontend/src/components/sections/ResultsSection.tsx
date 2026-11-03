"use client";
import { useState } from "react";
import { PublicLink as Link } from "@/components/ui/PublicLink";
import { CertificateLightbox } from "@/components/ui/CertificateLightbox";
import { SectionPreviewHeading } from "./SectionPreviewHeading";
import styles from "./ResultsSection.module.css";
type Filter = "all" | "ielts" | "cefr";
type Result = {
  id: string;
  studentName: string;
  examDate: string;
  certificateUrl?: string;
  isSample?: boolean;
  cefrScore?: string;
} & (
  | {
      type: "ielts";
      overall: number;
      listening: number;
      reading: number;
      writing: number;
      speaking: number;
    }
  | { type: "cefr"; level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" }
);
export function ResultsSection({
  results = [],
  serverFilter,
  pageHeading = false,
  pagination,
  preview = false,
  title = "O‘quvchilar natijalari",
  description = "IELTS va SEFR sertifikatlari hamda qisqacha natijalar.",
  showFilters = true,
}: {
  title?: string;
  description?: string;
  showFilters?: boolean;
  results?: Result[];
  serverFilter?: Filter;
  pageHeading?: boolean;
  preview?: boolean;
  pagination?: { total: number; page: number; pageSize: number };
}) {
  const Heading = pageHeading ? "h1" : "h2";
  const [filter, setFilter] = useState<Filter>("all");
  const active = serverFilter ?? filter;
  const items = serverFilter
    ? results
    : results.filter((r) => active === "all" || r.type === active);
  if (!results.length && !serverFilter) return null;
  return (
    <section
      id="results"
      className={`${styles.section} section-py ${preview ? styles.compact : ""}`}
      data-home-preview={preview ? "results" : undefined}
      aria-labelledby="results-heading"
    >
      <div className="container">
        {preview ? (
          <SectionPreviewHeading
            id="results-heading"
            title="Natijalar"
            description="IELTS va SEFR sertifikatlaridan qisqa ko‘rinish."
            href="/results"
            label="Barcha natijalar"
          />
        ) : (
          <>
            <Heading id="results-heading" className={styles.heading}>
              {title}
            </Heading>
            <p className={styles.intro}>{description}</p>
          </>
        )}
        {results.some((r) => r.isSample) && (
          <p className={styles.notice}>
            Takroriy kartalar «NAMUNA» deb belgilangan; ular alohida o‘quvchilar
            sonini bildirmaydi. Ballar taqdim etilgan sertifikat rasmlaridan
            olingan.
          </p>
        )}
        {!preview && (
          <>
            {showFilters && (
              <div
                className={styles.filters}
                role="group"
                aria-label="Natija turi filtri"
              >
                {(
                  [
                    ["all", "Barchasi"],
                    ["ielts", "IELTS"],
                    ["cefr", "SEFR"],
                  ] as const
                ).map(([v, label]) =>
                  serverFilter ? (
                    <Link
                      key={v}
                      className={`${styles.filter} ${active === v ? styles.active : ""}`}
                      href={v === "all" ? "/results" : `/results?type=${v}`}
                      aria-current={active === v ? "page" : undefined}
                    >
                      {label}
                    </Link>
                  ) : (
                    <button
                      key={v}
                      type="button"
                      className={`${styles.filter} ${active === v ? styles.active : ""}`}
                      onClick={() => setFilter(v)}
                      aria-pressed={active === v}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            )}
            <p className={styles.count} role="status">
              {pagination
                ? `${pagination.total} ta natija · ${items.length ? (pagination.page - 1) * pagination.pageSize + 1 : 0}–${(pagination.page - 1) * pagination.pageSize + items.length} ko‘rsatilmoqda`
                : `${items.length} ta natija`}
            </p>
          </>
        )}
        <div className={styles.grid}>
          {items.map((r) => (
            <article
              key={r.id}
              className={styles.card}
              data-result-type={r.type}
            >
              <div className={styles.preview}>
                {r.certificateUrl ? (
                  <CertificateLightbox
                    src={r.certificateUrl}
                    name={r.studentName}
                  />
                ) : (
                  <p>Sertifikat rasmi mavjud emas</p>
                )}
              </div>
              <div className={styles.details}>
                <div className={styles.topline}>
                  <span>{r.type === "ielts" ? "IELTS" : "SEFR"}</span>
                  {r.isSample && <span className={styles.sample}>NAMUNA</span>}
                </div>
                <h3>{r.studentName}</h3>
                <div className={styles.score}>
                  <div className={styles.scoreMeta}>
                    <span className={styles.scoreLabel}>
                      {r.type === "ielts" ? "Umumiy ball" : "Daraja"}
                    </span>
                    <span className={styles.date}>
                      {r.examDate.split("-").reverse().join(".")}
                    </span>
                  </div>
                  <strong>
                    {r.type === "ielts" ? r.overall.toFixed(1) : r.level}
                  </strong>
                </div>
                {r.type === "cefr" && r.cefrScore && (
                  <p className={styles.skills}>Umumiy ball: {r.cefrScore}</p>
                )}
                {r.type === "ielts" && (
                  <dl
                    className={styles.skillGrid}
                    aria-label="IELTS bo‘limlari"
                  >
                    {[
                      { key: "L", label: "Listening", value: r.listening },
                      { key: "R", label: "Reading", value: r.reading },
                      { key: "W", label: "Writing", value: r.writing },
                      { key: "S", label: "Speaking", value: r.speaking },
                    ].map((s) => (
                      <div key={s.key} title={`${s.label}: ${s.value}`}>
                        <dt>{s.key}:</dt>
                        <dd>{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </article>
          ))}
        </div>
        {!items.length && (
          <p className="empty-state">
            Bu turdagi natijalar hali nashr qilinmagan.
          </p>
        )}
      </div>
    </section>
  );
}
