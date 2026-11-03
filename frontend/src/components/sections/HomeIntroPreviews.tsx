import { PublicLink as Link } from "@/components/ui/PublicLink";
import { type ContentItem } from "@/lib/api/public";
import { SectionPreviewHeading } from "./SectionPreviewHeading";
import styles from "./HomePreviews.module.css";

const teacherStories = [
  {
    image: "/teacher/sherzod-lesson.png",
    alt: "Sherzod Allamurodov sinfda dars jarayonida",
    badge: "01 · METODIKA VA TAJRIBA",
    caption: "Jonli dars mashg‘uloti",
    title: "18+ yillik tajriba va tushunarli grammatika",
    description:
      "Murakkab grammatik qoidalarni yodlatish emas, balki til qonuniyatlarini mantiqiy tushuntirish va kundalik muloqotda erkin qo‘llashga o‘rgatish. Har bir mavzu hayotiy misollar va mustahkam mashqlar bilan tushuntiriladi.",
    highlights: [
      "18+ yillik pedagogik tajriba",
      "Sodda va mantiqiy grammatika",
      "Jonli savol-javob va muloqot",
    ],
  },
  {
    image: "/teacher/sherzod-individual.jpg",
    alt: "Sherzod ustoz o‘quvchiga individual yondashmoqda",
    badge: "02 · INDIVIDUAL E’TIBOR",
    caption: "Yakkama-yakka tushuntirish",
    title: "Har bir o‘quvchiga shaxsiy e’tibor va tahlil",
    description:
      "Kichik guruhlarda har bir o‘quvchining yozma ishlari, talaffuzi va mavzuni o‘zlashtirishi ustoz tomonidan shaxsan tekshiriladi. Kamchiliklar dars davomida aniqlanib, o‘sha joyning o‘zida bartaraf etiladi.",
    highlights: [
      "Kichik va qulay guruhlar",
      "Xatolarni yakkama-yakka tahlil qilish",
      "O‘quvchi sur’atiga mos ko‘mak",
    ],
  },
  {
    image: "/teacher/sherzod-interactive.jpg",
    alt: "Sherzod ustoz interaktiv doskada dars tushuntirmoqda",
    badge: "03 · ZAMONAVIY TA’LIM",
    caption: "Zamonaviy raqamli ta’lim",
    title: "Smart texnologiyalar va imtihonga tizimli tayyorgarlik",
    description:
      "Zamonaviy interaktiv doskalar, multimedia resurslari va xalqaro standartdagi o‘quv qo‘llanmalari. IELTS va SEFR imtihonlarining barcha 4 ta ko‘nikmasi (Listening, Reading, Writing, Speaking) kompleks rivojlantiriladi.",
    highlights: [
      "Katta interaktiv doska mashg‘ulotlari",
      "IELTS va SEFR yo‘nalishlari",
      "500+ sertifikat olgan o‘quvchilar",
    ],
  },
];

export function HomeIntroPreviews({
  bio,
  onLeadOpen,
}: {
  bio?: ContentItem;
  onLeadOpen?: () => void;
}) {
  return (
    <>
      {bio && (
        <section
          className={`container ${styles.section}`}
          data-home-preview="about"
        >
          <SectionPreviewHeading
            title="Ustoz haqida"
            description="Sherzod Allamurodov — 18 yildan ortiq tajribaga ega o‘qituvchi. Dars jarayonidan jonli lavhalar, kuchli metodika va har bir o‘quvchiga samimiy individual e’tibor."
            href="/about"
          />

          <div className={styles.teacherShowcase}>
            {teacherStories.map((story, index) => {
              const isReverse = index % 2 === 1;
              return (
                <div
                  key={story.badge}
                  className={`${styles.storyCard} ${isReverse ? styles.reverse : ""}`}
                >
                  <div className={styles.storyImageWrapper}>
                    <img
                      src={story.image}
                      alt={story.alt}
                      width={460}
                      height={320}
                      className={styles.storyImage}
                      loading="lazy"
                    />
                    <div className={styles.storyImageOverlay}>
                      <span className={styles.storyImageBadge}>
                        {story.caption}
                      </span>
                    </div>
                  </div>

                  <div className={styles.storyContent}>
                    <span className={styles.storyKicker}>{story.badge}</span>
                    <h3 className={styles.storyTitle}>{story.title}</h3>
                    <p className={styles.storyText}>{story.description}</p>
                    <div className={styles.storyHighlights}>
                      {story.highlights.map((item) => (
                        <span key={item} className={styles.storyHighlight}>
                          <span
                            className={styles.storyHighlightIcon}
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className={styles.showcaseFooter}>
              <div className={styles.showcaseStats}>
                <span>
                  <strong>18+ yil</strong> tajriba
                </span>
                <span>•</span>
                <span>
                  <strong>1000+</strong> ta’lim olganlar
                </span>
                <span>•</span>
                <span>
                  <strong>500+</strong> sertifikat olganlar
                </span>
              </div>
              <div className={styles.showcaseActions}>
                <Link href="/about#classroom-moments" className={styles.more}>
                  Ustoz haqida to‘liq tanishish <span>→</span>
                </Link>
                {onLeadOpen && (
                  <button
                    type="button"
                    onClick={onLeadOpen}
                    className="button small"
                  >
                    Kursga yozilish
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
