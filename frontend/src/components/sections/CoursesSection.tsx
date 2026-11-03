import { PublicLink } from "@/components/ui/PublicLink";
import { SectionPreviewHeading } from "./SectionPreviewHeading";
import styles from "./CoursesSection.module.css";

interface Course {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  features: string[];
  format?: string;
  duration?: string;
  schedule?: string;
  price?: string;
  priceUnit?: string;
  accentColor: "yellow" | "purple" | "light-purple";
}

interface CoursesSectionProps {
  courses?: Course[];
  onEnroll?: (slug: string) => void;
  pageHeading?: boolean;
  preview?: boolean;
}

export function CoursesSection({
  courses,
  onEnroll,
  pageHeading = false,
  preview = false,
}: CoursesSectionProps) {
  const items = courses ?? [];
  const Heading = pageHeading ? "h1" : "h2";

  return (
    <section
      className={`${styles.section} section-py ${preview ? styles.compact : ""}`}
      data-home-preview={preview ? "courses" : undefined}
      id="courses"
      aria-labelledby="courses-heading"
    >
      <div className="container">
        {preview ? (
          <SectionPreviewHeading
            id="courses-heading"
            title="Kurslar"
            description="O‘zingizga mos yo‘nalish bilan qisqacha tanishing."
            href="/courses"
            label="Barcha kurslar"
          />
        ) : (
          <>
            <Heading id="courses-heading" className={styles.heading}>
              Kurslar
            </Heading>
            <p className={styles.subheading}>
              O&apos;zingizga mos yo&apos;nalishni tanlang va maqsadingiz sari
              birinchi qadamni qo&apos;ying.
            </p>
          </>
        )}

        <div className={styles.grid}>
          {items.map((course) => (
            <article
              key={course.id}
              className={`${styles.card} ${styles[`card-${course.accentColor}`]}`}
              aria-labelledby={`course-${course.id}-title`}
            >
              <div className={styles.cardBody}>
                <h3
                  id={`course-${course.id}-title`}
                  className={styles.courseTitle}
                >
                  {course.name}
                </h3>

                <p className={styles.description}>{course.shortDescription}</p>
                <ul className={styles.features} role="list">
                  {(preview
                    ? course.features.slice(0, 2)
                    : course.features
                  ).map((feat, i) => (
                    <li key={i} className={styles.featureItem}>
                      <span className={styles.checkIcon} aria-hidden="true">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <circle
                            cx="10"
                            cy="10"
                            r="10"
                            className={styles.checkCircle}
                          />
                          <path
                            d="M6 10l3 3 5-5"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <PublicLink
                  className="course-detail-link"
                  href={`/courses/${course.slug}`}
                >
                  Kurs haqida batafsil ↗
                </PublicLink>
                {/* Format, jadval */}
                {!preview && (
                  <div className={styles.meta}>
                    {course.format && (
                      <span className={styles.metaItem}>
                        📍 {course.format}
                      </span>
                    )}
                    {course.schedule && (
                      <span className={styles.metaItem}>
                        📅 {course.schedule}
                      </span>
                    )}
                    {course.duration && (
                      <span className={styles.metaItem}>
                        ⏱ {course.duration}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                {!preview &&
                  (course.price ? (
                    <div className={styles.priceRow}>
                      <span className={styles.price}>{course.price}</span>
                      <span className={styles.priceUnit}>
                        {course.priceUnit ?? "so‘m / oy"}
                      </span>
                    </div>
                  ) : (
                    <p className={styles.priceContact}>
                      Narx va jadvalni aniqlash uchun bog&apos;laning
                    </p>
                  ))}
                <button
                  className={styles.enrollBtn}
                  onClick={() => onEnroll?.(course.slug)}
                  type="button"
                >
                  Kursga yozilish
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
