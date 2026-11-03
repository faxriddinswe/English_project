import { PublicLink as Link } from "@/components/ui/PublicLink";
import { CertificateLightbox } from "@/components/ui/CertificateLightbox";
import { text, type ContentItem, type Course } from "@/lib/api/public";
import styles from "./TeacherAboutSection.module.css";

const bioCardMeta = [
  { icon: "✨", title: "Kirish va umumiy ma’lumot" },
  { icon: "📚", title: "Grammatika / Umumiy ingliz tili" },
  { icon: "🎯", title: "IELTS — Xalqaro imtihon tayyorgarligi" },
  { icon: "🌐", title: "SEFR — Milliy va xalqaro til darajalari" },
  { icon: "💻", title: "Shaxsiy kabinet imkoniyatlari" },
  { icon: "✍️", title: "Kursga yozilish va qabul tartibi" },
];

export function TeacherAboutSection({
  bio,
  courses = [],
  results = [],
  pageHeading = true,
  onLeadOpen,
}: {
  bio: ContentItem;
  courses?: Course[];
  results?: ContentItem[];
  pageHeading?: boolean;
  onLeadOpen?: () => void;
}) {
  const Heading = pageHeading ? "h1" : "h2";
  const ownCertificates = Array.isArray(bio.data.certificate_ids)
    ? bio.data.certificate_ids.filter(
        (id): id is string => typeof id === "string",
      )
    : [];
  const studentCertificates = [
    results.find((item) => item.data.type === "ielts" && item.media_url),
    results.find((item) => item.data.type === "cefr" && item.media_url),
  ].filter((item): item is ContentItem => !!item);
  const facts = [
    {
      value:
        text(bio, "experience") ||
        (courses.length ? String(courses.length) : "—"),
      label: text(bio, "experience") ? "Tajribasi" : "Kurs yo‘nalishi",
    },
    { value: "IELTS", label: "Imtihonga tayyorgarlik" },
    { value: "SEFR", label: "Til darajasi bo‘yicha tayyorgarlik" },
    {
      value: text(bio, "students_taught") || "Kabinet",
      label: text(bio, "students_taught")
        ? "Ta’lim olgan o‘quvchilar"
        : "Jadval, vazifalar va to‘lovlar",
    },
  ];
  const paragraphs = text(bio, "body")
    .split(/\n\s*\n/)
    .filter(Boolean);
  return (
    <section id="teacher" className={`container ${styles.section}`}>
      <div className={styles.profile} data-testid="teacher-profile">
        <div className={styles.portrait}>
          <img
            src="/teacher/sherzod-portrait.png"
            alt="Sherzod Allamurodov"
            width={510}
            height={730}
            fetchPriority="high"
          />
          <div className={styles.portraitBadge}>
            <span className={styles.badgeStar}>★</span>
            <span>18+ yillik tajriba</span>
          </div>
          {text(bio, "video_url") && (
            <a
              href={text(bio, "video_url")}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.video}
              aria-label="Sherzod Allamurodov tanishtiruv videosini ochish"
            >
              <span aria-hidden="true">▶</span>Tanishuv videosi
            </a>
          )}
        </div>
        <div className={styles.content}>
          <div className={styles.eyebrowWrapper}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowSparkle}>✦</span>
              Ustoz haqida · Sherzod English
            </span>
          </div>
          <Heading className={styles.name}>Sherzod Allamurodov</Heading>
          <p className={styles.role}>
            Oliy toifali ingliz tili o‘qituvchisi · IELTS &amp; CEFR instruktori
          </p>
          <dl className={styles.facts}>
            {facts.map((fact, index) => (
              <div
                key={fact.label}
                className={`${styles.fact} ${styles[`tint${index}`]}`}
              >
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          {(ownCertificates.length > 0 || studentCertificates.length > 0) && (
            <div className={styles.certificates}>
              <h2>
                {ownCertificates.length
                  ? "Ustoz sertifikatlari"
                  : "O‘quvchilar sertifikatlaridan"}
              </h2>
              {!ownCertificates.length && (
                <p className={styles.certificateNote}>
                  Bu hujjatlar o‘quvchilarga tegishli. Takroriy namuna kartalari
                  «Natijalar» bo‘limida belgilangan.
                </p>
              )}
              <div className={styles.certificateGrid}>
                {ownCertificates.length
                  ? ownCertificates.slice(0, 2).map((id, index) => (
                      <figure key={id}>
                        <CertificateLightbox
                          src={`/api/v1/media/${id}`}
                          name={`Sherzod Allamurodov — sertifikat ${index + 1}`}
                        />
                        <figcaption>Ustoz sertifikati</figcaption>
                      </figure>
                    ))
                  : studentCertificates.map((result) => (
                      <figure key={result.id}>
                        <CertificateLightbox
                          src={result.media_url!}
                          name={text(result, "student_name")}
                        />
                        <figcaption>
                          <strong>{text(result, "student_name")}</strong>
                          <span>
                            {result.data.type === "ielts"
                              ? `IELTS · Umumiy ball ${text(result, "overall")}`
                              : `SEFR · ${text(result, "level")}`}
                          </span>
                        </figcaption>
                      </figure>
                    ))}
              </div>
              <Link className={styles.resultLink} href="/results">
                Barcha natijalarni ko‘rish <span aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
        </div>
      </div>
      <article className={styles.biography} data-testid="teacher-biography">
        <div className={styles.bioHeading}>
          <span className={styles.kicker}>USTOZ BILAN TANISHING</span>
          <h2>Sherzod Allamurodov haqida batafsil</h2>
          <div className={styles.bioPhilosophyCard}>
            <div className={styles.philosophyQuoteMark}>“</div>
            <p className={styles.philosophyText}>
              Ingliz tilini o‘rganish — bu formulalarni yodlash emas, dunyo bilan
              erkin muloqot qilish va o‘z imkoniyatlaringizni kengaytirishdir.
            </p>
            <ul className={styles.philosophyList}>
              <li>
                <span className={styles.checkIcon}>✓</span> Mantiqiy grammatik poydevor
              </li>
              <li>
                <span className={styles.checkIcon}>✓</span> Har bir darsda shaxsiy tahlil
              </li>
              <li>
                <span className={styles.checkIcon}>✓</span> Xalqaro imtihonlarga tizimli tayyorgarlik
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.body}>
          {paragraphs.map((paragraph, index) => {
            const meta = bioCardMeta[index] || {
              icon: "📌",
              title: "Ta’lim yo‘nalishi",
            };
            if (index === 0) {
              return (
                <div key={index} className={styles.bioLeadCard}>
                  <p>{paragraph}</p>
                </div>
              );
            }
            return (
              <div key={index} className={styles.bioCard}>
                <div className={styles.bioCardHeader}>
                  <span className={styles.bioCardIcon}>{meta.icon}</span>
                  <span className={styles.bioCardTitle}>{meta.title}</span>
                </div>
                <p>{paragraph}</p>
              </div>
            );
          })}
        </div>
      </article>
      <section
        className={styles.classroomSection}
        aria-labelledby="classroom-moments"
      >
        <div className={styles.classroomHeader}>
          <span className={styles.kicker}>JONLI TA’LIM MUHITI</span>
          <h2 id="classroom-moments">Dars jarayonidan lavhalar</h2>
        </div>
        <div className={styles.classroomGrid}>
          <article className={styles.classroomCard}>
            <div className={styles.classroomImageWrapper}>
              <img
                src="/teacher/sherzod-lesson.png"
                alt="Sherzod Allamurodov doska oldida dars jarayonida"
                width={400}
                height={275}
                className={styles.classroomImage}
                loading="lazy"
              />
            </div>
            <div className={styles.classroomContent}>
              <span className={styles.classroomBadge}>
                01 · METODIKA VA TAJRIBA
              </span>
              <h3 className={styles.classroomTitle}>
                18+ yillik tajriba va tushunarli grammatika
              </h3>
              <p className={styles.classroomText}>
                Murakkab grammatik qoidalarni mantiqiy tushuntirish va kundalik
                muloqotda erkin qo‘llashga o‘rgatish. Har bir mavzu hayotiy
                misollar bilan mustahkamlanadi.
              </p>
            </div>
          </article>

          <article className={styles.classroomCard}>
            <div className={styles.classroomImageWrapper}>
              <img
                src="/teacher/sherzod-individual.jpg"
                alt="Sherzod ustoz o‘quvchiga individual yondashmoqda"
                width={400}
                height={275}
                className={styles.classroomImage}
                loading="lazy"
              />
            </div>
            <div className={styles.classroomContent}>
              <span className={styles.classroomBadge}>
                02 · INDIVIDUAL E’TIBOR
              </span>
              <h3 className={styles.classroomTitle}>
                Har bir o‘quvchiga shaxsiy e’tibor va tahlil
              </h3>
              <p className={styles.classroomText}>
                Kichik guruhlarda har bir o‘quvchining yozma ishlari, talaffuzi
                va mavzuni o‘zlashtirishi ustoz tomonidan shaxsan tekshirilib,
                xatolar dars davomida bartaraf etiladi.
              </p>
            </div>
          </article>

          <article className={styles.classroomCard}>
            <div className={styles.classroomImageWrapper}>
              <img
                src="/teacher/sherzod-interactive.jpg"
                alt="Sherzod ustoz interaktiv doskada dars tushuntirmoqda"
                width={400}
                height={275}
                className={styles.classroomImage}
                loading="lazy"
              />
            </div>
            <div className={styles.classroomContent}>
              <span className={styles.classroomBadge}>
                03 · ZAMONAVIY TA’LIM
              </span>
              <h3 className={styles.classroomTitle}>
                Smart texnologiyalar va tizimli tayyorgarlik
              </h3>
              <p className={styles.classroomText}>
                Katta interaktiv doskalar va multimedia resurslari yordamida
                IELTS hamda SEFR imtihonlarining barcha 4 ta ko‘nikmasi
                (Listening, Reading, Writing, Speaking) tizimli shakllantiriladi.
              </p>
            </div>
          </article>
        </div>
      </section>
      {courses.length > 0 && (
        <section
          className={styles.directions}
          aria-labelledby="teacher-directions"
        >
          <h2 id="teacher-directions">Ta’lim yo‘nalishlari</h2>
          <div>
            {courses.slice(0, 3).map((course) => (
              <article key={course.id}>
                <h3>{course.name}</h3>
                <p>{course.short_description}</p>
                <Link href={`/courses/${course.slug}`}>
                  Kurs haqida batafsil <span aria-hidden="true">↗</span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
      <div className={styles.actions}>
        {onLeadOpen && (
          <button type="button" className="button" onClick={onLeadOpen}>
            Kursga yozilish
          </button>
        )}
        <Link className="button secondary" href="/courses">
          Kurslarni ko‘rish
        </Link>
      </div>
    </section>
  );
}
