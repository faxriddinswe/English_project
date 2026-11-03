import styles from "./SiteFooter.module.css";

export function SiteFooter({
  contact = {},
}: {
  contact?: Record<string, unknown>;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={`container ${styles.inner}`}>
        <p className={styles.copy}>
          © {year} Sherzod English. Barcha huquqlar himoyalangan.
        </p>
        <nav className={styles.links} aria-label="Footer havolalar">
          <a href="/privacy" className={styles.link}>
            Maxfiylik siyosati
          </a>
        </nav>
        <div className={styles.socials} aria-label="Ijtimoiy tarmoqlar">
          {/* Social links — faqat haqiqiy havolalar berilganda ko'rsatiladi */}
          {(typeof contact.telegram === "string"
            ? contact.telegram
            : undefined) && (
            <a
              href={
                typeof contact.telegram === "string"
                  ? contact.telegram
                  : undefined
              }
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className={styles.socialIcon}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.7 8.03c-.13.6-.47.74-.95.46l-2.63-1.94-1.27 1.22c-.14.14-.26.26-.53.26l.19-2.69 4.88-4.41c.21-.19-.05-.29-.33-.1L7.25 14.4l-2.59-.81c-.56-.18-.57-.56.12-.83l10.11-3.9c.47-.17.88.12.75.94z" />
              </svg>
            </a>
          )}
          {(typeof contact.instagram === "string"
            ? contact.instagram
            : undefined) && (
            <a
              href={
                typeof contact.instagram === "string"
                  ? contact.instagram
                  : undefined
              }
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={styles.socialIcon}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          )}
          {(typeof contact.youtube === "string"
            ? contact.youtube
            : undefined) && (
            <a
              href={
                typeof contact.youtube === "string"
                  ? contact.youtube
                  : undefined
              }
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className={styles.socialIcon}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.2 5 12 5 12 5s-4.2 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.3.9C6.8 19 12 19 12 19s4.2 0 7-.2c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM9.7 14.5V9.3l5.4 2.6-5.4 2.6z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
