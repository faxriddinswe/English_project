import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
} from "lucide-react";
import { PublicLink } from "@/components/ui/PublicLink";
import type { Course } from "@/lib/api/public";
import { localizeText, formatValue } from "@/lib/uz";
import { courseGuides } from "./course-guides";
import styles from "./CourseDetails.module.css";

export function CourseDetails({
  course,
  courses,
  onEnroll,
}: {
  course: Course;
  courses: Course[];
  onEnroll: (slug: string) => void;
}) {
  const guide = courseGuides[course.slug];
  const hero = guide?.images[0];
  return (
    <article className={`container ${styles.page}`}>
      <PublicLink href="/courses" className={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" /> Barcha kurslar
      </PublicLink>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>
            <GraduationCap size={17} aria-hidden="true" />
            {guide?.eyebrow ?? "Ingliz tili ta’limi"}
          </span>
          <h1>{localizeText(course.name)}</h1>
          <h2>{guide?.title ?? localizeText(course.short_description)}</h2>
          <p>{guide?.intro ?? localizeText(course.description)}</p>
          <div className={styles.ctas}>
            <button className="button" onClick={() => onEnroll(course.slug)}>
              Kursga yozilish <ArrowRight size={16} aria-hidden="true" />
            </button>
            <a className="button secondary" href="#course-topics">
              Batafsil tanishish
            </a>
          </div>
          <div className={styles.tags}>
            {course.features.map((feature) => (
              <span key={feature}>
                <Check size={14} aria-hidden="true" />
                {localizeText(feature)}
              </span>
            ))}
          </div>
        </div>
        {hero && (
          <figure className={styles.heroImage}>
            <Image
              src={hero.src}
              alt={hero.alt}
              width={1400}
              height={1100}
              sizes="(max-width: 760px) 100vw, 45vw"
              loading="eager"
            />
            <figcaption>
              {hero.caption}
              <a href={hero.source} target="_blank" rel="noreferrer">
                Foto: Pexels
              </a>
            </figcaption>
          </figure>
        )}
      </header>
      <div className={styles.content} id="course-topics">
        <div className={styles.main}>
          <section className={styles.intro}>
            <span className={styles.sectionLabel}>YO‘NALISH HAQIDA</span>
            <h2>Bilimni amaliy ko‘nikmaga aylantiring</h2>
            {course.description && (
              <p className={styles.description}>
                {localizeText(course.description)}
              </p>
            )}
            {guide?.overview.map((text) => (
              <p key={text}>{text}</p>
            ))}
            {course.audience && (
              <p>
                <strong>Kimlar uchun:</strong> {localizeText(course.audience)}
              </p>
            )}
          </section>
          {!!guide?.topics.length && (
            <section>
              <h2>Asosiy yo‘nalishlar</h2>
              <div className={styles.topics}>
                {guide.topics.map((topic, index) => (
                  <div className={styles.topic} key={topic.title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <h3>{topic.title}</h3>
                    <p>{topic.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {guide?.images[1] && (
            <figure className={styles.studyImage}>
              <Image
                src={guide.images[1].src}
                alt={guide.images[1].alt}
                width={1400}
                height={1100}
                sizes="(max-width: 760px) 100vw, 65vw"
              />
              <figcaption>
                {guide.images[1].caption}
                <a
                  href={guide.images[1].source}
                  target="_blank"
                  rel="noreferrer"
                >
                  Foto: Pexels
                </a>
              </figcaption>
            </figure>
          )}
          {guide && (
            <section className={styles.practice}>
              <h2>Mustaqil mashq uchun uch qadam</h2>
              <ol>
                {guide.practice.map((text, index) => (
                  <li key={text}>
                    <span>{index + 1}</span>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
              <a
                href={guide.reference.url}
                target="_blank"
                rel="noreferrer"
                className={styles.reference}
              >
                <BookOpen size={17} aria-hidden="true" />
                {guide.reference.title} ↗
              </a>
            </section>
          )}
        </div>
        <aside className={styles.aside} aria-label="Kursga yozilish">
          <div className={styles.enrollment}>
            <GraduationCap size={28} aria-hidden="true" />
            <h2>Keyingi qadamni tanlang</h2>
            <p>
              Maqsadingiz va hozirgi bilimingizni ayting. Mos guruh, narx va
              dars vaqti haqida ma’lumot oling.
            </p>
            <dl>
              {[
                ["Daraja", course.level],
                [
                  "Format",
                  course.format ? formatValue(course.format, "format") : "",
                ],
                ["Davomiylik", course.duration],
                ["Jadval", course.schedule],
                [
                  "Oylik narx",
                  course.marketing_price
                    ? formatValue(course.marketing_price, "marketing_price")
                    : "",
                ],
              ]
                .filter(([, value]) => !!value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
            <button className="button" onClick={() => onEnroll(course.slug)}>
              Ariza qoldirish <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          {courses.length > 1 && (
            <nav className={styles.related} aria-label="Boshqa yo‘nalishlar">
              <h3>Boshqa yo‘nalishlar</h3>
              {courses
                .filter((item) => item.id !== course.id)
                .map((item) => (
                  <PublicLink href={`/courses/${item.slug}`} key={item.id}>
                    {localizeText(item.name)}
                    <ArrowRight size={16} aria-hidden="true" />
                  </PublicLink>
                ))}
            </nav>
          )}
        </aside>
      </div>
    </article>
  );
}
