import { PublicLink as Link } from "@/components/ui/PublicLink";
import { SectionPreviewHeading } from "./SectionPreviewHeading";
import { TeacherAboutSection } from "./TeacherAboutSection";
import { CertificateLightbox } from "@/components/ui/CertificateLightbox";
import { text, type ContentItem, type Course } from "@/lib/api/public";

export function FAQSection({
  items,
  pageHeading = false,
  preview = false,
}: {
  items: ContentItem[];
  pageHeading?: boolean;
  preview?: boolean;
}) {
  const Heading = pageHeading ? "h1" : "h2";
  return (
    <section
      id="faq"
      className={`section-py container ${preview ? "home-faq-preview" : ""}`}
      data-home-preview={preview ? "faq" : undefined}
    >
      {preview ? (
        <SectionPreviewHeading
          title="Ko‘p beriladigan savollar"
          href="/faq"
          label="Barcha savollar"
        />
      ) : (
        <>
          <Heading className="section-heading">
            Ko‘p beriladigan savollar
          </Heading>
          <p className="section-intro">Savollaringizga javob toping.</p>
        </>
      )}
      <div className="faq-list">
        {items.map((item) => (
          <details key={item.id} className="faq-item">
            <summary>
              {item.title}
              <span className="faq-plus" aria-hidden="true" />
            </summary>
            <p>{text(item, "body")}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
export function ContactBanner({
  onOpen,
  showDetails = false,
}: {
  onOpen: () => void;
  showDetails?: boolean;
}) {
  return (
    <section
      id="contact"
      className="container contact-banner"
      data-home-preview={showDetails ? "contact" : undefined}
    >
      <h2>
        Savollaringiz bormi?
        <br />
        Sherzod ustoz bilan bog‘laning.
      </h2>
      <div className="contact-banner-actions">
        <button className="button" onClick={onOpen}>
          Ariza qoldirish
        </button>
        {showDetails && (
          <Link className="contact-details-link" href="/contact">
            Bog‘lanish bo‘limiga <span aria-hidden="true">↗</span>
          </Link>
        )}
      </div>
    </section>
  );
}
export function ExtraSections({
  items,
  pageHeading = false,
  courses = [],
  results = [],
  onLeadOpen,
}: {
  items: ContentItem[];
  pageHeading?: boolean;
  courses?: Course[];
  results?: ContentItem[];
  onLeadOpen?: () => void;
}) {
  const bio = items.find((x) => x.kind === "bio");
  const testimonials = items.filter((x) => x.kind === "testimonial");
  const gallery = items.filter((x) => x.kind === "gallery");
  return (
    <>
      {bio && (
        <TeacherAboutSection
          bio={bio}
          courses={courses}
          results={results}
          pageHeading={pageHeading}
          onLeadOpen={onLeadOpen}
        />
      )}
      {testimonials.length > 0 && (
        <section className="container section-py">
          <h2 className="section-heading">O‘quvchilar fikrlari</h2>
          <div className="testimonial-grid">
            {testimonials.map((t) => (
              <figure className="panel" key={t.id}>
                <blockquote>{text(t, "body")}</blockquote>
                <figcaption>{text(t, "student_name")}</figcaption>
                {text(t, "video_url") && (
                  <a
                    className="button secondary small"
                    href={text(t, "video_url")}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Video fikr ↗
                  </a>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}
      {gallery.length > 0 && (
        <section id="gallery" className="container section-py">
          <h2 className="section-heading">Darslardan lavhalar</h2>
          <div className="gallery-grid">
            {gallery.map((g) => (
              <div key={g.id}>
                {g.media_url && (
                  <CertificateLightbox
                    src={g.media_url}
                    name={text(g, "alt", g.title)}
                  />
                )}
                {text(g, "video_url") && (
                  <a
                    className="button secondary small"
                    href={text(g, "video_url")}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Videoni ko‘rish ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
