import { PublicLink } from "@/components/ui/PublicLink";
import styles from "./HeroSection.module.css";

interface HeroSectionProps {
  onLeadOpen: () => void;
  title?: string;
  subtitle?: string;
  portraitUrl?: string;
}

export function HeroSection({
  onLeadOpen,
  title,
  subtitle,
  portraitUrl,
}: HeroSectionProps) {
  return (
    <section id="home" className={styles.hero} aria-label="Asosiy taklif">
      {/* Background grid pattern */}
      <div className={styles.gridBg} aria-hidden="true" />
      {/* Gradient overlay */}
      <div className={styles.gradientOverlay} aria-hidden="true" />

      <div className={`container ${styles.inner}`}>
        {/* Left column: text */}
        <div className={styles.textCol}>
          <h1 className={styles.heading}>
            {title ?? (
              <>
                Yuqori natijalar <br className={styles.desktopBreak} />
                Sherzod ustoz bilan <br className={styles.desktopBreak} />
                boshlanadi.
              </>
            )}
          </h1>
          <p className={styles.subheading}>
            {subtitle ??
              "Grammatika, IELTS va CEFR yo‘nalishlarida bilimlaringizni rivojlantiring. Maqsadingiz sari Sherzod ustoz bilan tayyorlaning."}
          </p>
          <div className={styles.ctaRow}>
            <button
              className={styles.ctaPrimary}
              onClick={onLeadOpen}
              type="button"
            >
              Kursga yozilish
            </button>
            <PublicLink href="/courses" className={styles.ctaSecondary}>
              Kurslarni ko&apos;rish
            </PublicLink>
          </div>
        </div>

        {/* Right column: portrait + circle */}
        <div
          className={`${styles.portraitCol} ${portraitUrl ? styles.hasPhoto : ""}`}
        >
          <div className={styles.portraitArt}>
            <div className={styles.yellowCircle} />
            <div
              className={`${styles.portraitWrap} ${portraitUrl ? styles.photoFrame : ""}`}
            >
              {portraitUrl ? (
                <img
                  src={portraitUrl}
                  alt="Sherzod ustoz"
                  width={600}
                  height={700}
                  className={styles.portraitImage}
                  fetchPriority="high"
                />
              ) : (
                <div
                  className={styles.portraitPlaceholder}
                  aria-label="Portret uchun joy"
                >
                  <svg viewBox="0 0 440 600" fill="none" aria-hidden="true">
                    <circle cx="220" cy="170" r="93" fill="#7B5A83" />
                    <path
                      d="M48 590v-87c0-137 76-217 172-217s172 80 172 217v87"
                      fill="#65446F"
                    />
                    <path d="M154 299l66 130 66-130" fill="#CAB7D1" />
                    <path
                      d="M154 299L104 430l116 160M286 299l50 131-116 160"
                      stroke="#AA8CB4"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
          {/* Teacher info card */}
          <div className={styles.teacherCard}>
            <p className={styles.teacherName}>Sherzod Allamurodov</p>
            <p className={styles.teacherRole}>Ingliz tili o&apos;qituvchisi</p>
            <p className={styles.teacherTags}>Grammatika · IELTS · CEFR</p>
          </div>
        </div>
      </div>
    </section>
  );
}
