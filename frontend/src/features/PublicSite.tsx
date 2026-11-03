"use client";
import { useState } from "react";
import { formatValue, localizeText } from "@/lib/uz";
import { resultCards } from "@/lib/result-cards";
import { useSiteUpdates } from "@/hooks/useSiteUpdates";
import { formatMoney } from "@/lib/utils/money";
import { SiteHeader, PUBLIC_NAV_LINKS } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HeroSection } from "@/components/sections/HeroSection";
import { HomeIntroPreviews } from "@/components/sections/HomeIntroPreviews";
import { StatsSection } from "@/components/sections/StatsSection";
import { CourseDetails } from "@/features/courses/CourseDetails";
import { CoursesSection } from "@/components/sections/CoursesSection";
import { ResultsSection } from "@/components/sections/ResultsSection";
import {
  FAQSection,
  ContactBanner,
  ExtraSections,
} from "@/components/sections/PublicSections";
import {
  LeadApplicationModal,
  LeadApplicationForm,
} from "@/features/lead/LeadApplicationModal";
import { text, type Site, type Course } from "@/lib/api/public";

export function PublicSite({
  site,
  courses,
  variant = "home",
  unavailable = false,
  children,
  detailCourse,
  resultFilter,
  resultPage,
}: {
  site: Site;
  courses: Course[];
  variant?:
    | "home"
    | "courses"
    | "course-detail"
    | "results"
    | "about"
    | "faq"
    | "contact";
  detailCourse?: Course;
  unavailable?: boolean;
  children?: React.ReactNode;
  resultFilter?: "all" | "ielts" | "cefr";
  resultPage?: { total: number; page: number; pageSize: number };
}) {
  useSiteUpdates();
  const [open, setOpen] = useState(false),
    [courseId, setCourseId] = useState("");
  const content = site.content;
  const hero = content.find((x) => x.kind === "hero"),
    bio = content.find((x) => x.kind === "bio"),
    contact = content.find((x) => x.kind === "contact");
  const faqs = content.filter((x) => x.kind === "faq");
  const openLead = (slug?: string) => {
    setCourseId(
      courses.find((c) => c.slug === (slug ?? detailCourse?.slug))?.id ?? "",
    );
    setOpen(true);
  };
  const results = resultCards(content);
  const courseCards = courses.map((c, i) => ({
    id: c.id,
    name: localizeText(c.name),
    slug: c.slug,
    shortDescription: localizeText(c.short_description),
    features: c.features.map(localizeText),
    format: c.format ? formatValue(c.format, "format") : "",
    duration: c.duration,
    schedule: c.schedule,
    price: c.marketing_price ? formatMoney(c.marketing_price) : undefined,
    accentColor: (["yellow", "purple", "light-purple"] as const)[i % 3],
  }));
  const links = PUBLIC_NAV_LINKS;
  const confirmedStats = content
    .filter((x) => x.kind === "stat")
    .map((s) => ({ value: text(s, "value"), label: text(s, "label") }));
  const stats = confirmedStats.length
    ? confirmedStats
    : courses.length
      ? [{ value: String(courses.length), label: "Kurs yo‘nalishi" }]
      : [];
  return (
    <>
      <a className="skip-link" href="#main">
        Asosiy mazmunga o‘tish
      </a>
      <SiteHeader links={links} phone={text(contact, "phone")} />
      <main id="main" className={variant !== "home" ? "public-inner" : ""}>
        {unavailable && (
          <div className="service-notice" role="status">
            Ma’lumotlar serveri bilan aloqa yo‘q. Keyinroq qayta urinib ko‘ring.
          </div>
        )}
        {variant === "home" && (
          <>
            <HeroSection
              onLeadOpen={() => openLead()}
              title={hero?.title}
              subtitle={text(hero, "subheading") || undefined}
              portraitUrl={
                hero?.media_url ?? bio?.media_url ?? "/teacher/sherzod-hero.png"
              }
            />
            <StatsSection stats={stats} />
            <HomeIntroPreviews bio={bio} onLeadOpen={() => openLead()} />
            {results.length > 0 && (
              <ResultsSection
                results={[
                  ...results
                    .filter((result) => result.type === "ielts")
                    .slice(0, 2),
                  ...results
                    .filter((result) => result.type === "cefr")
                    .slice(0, 2),
                ]}
                preview
              />
            )}
            <CoursesSection
              courses={courseCards.slice(0, 3)}
              onEnroll={openLead}
              preview
            />
            <FAQSection items={faqs.slice(0, 3)} preview />
          </>
        )}
        {variant === "about" && (
          <ExtraSections
            items={content.filter((item) => item.kind === "bio")}
            courses={courses}
            results={content.filter((item) => item.kind === "result")}
            onLeadOpen={() => openLead()}
            pageHeading={!children}
          />
        )}
        {variant === "results" && (
          <ResultsSection
            results={results}
            serverFilter={resultFilter}
            pagination={resultPage}
            pageHeading
          />
        )}
        {variant === "course-detail" && detailCourse && (
          <CourseDetails
            course={detailCourse}
            courses={courses}
            onEnroll={openLead}
          />
        )}
        {variant === "courses" && children}
        {variant === "courses" && (
          <CoursesSection
            courses={courseCards}
            onEnroll={openLead}
            pageHeading={!children}
          />
        )}
        {variant === "courses" && !courses.length && (
          <p className="container empty-state">
            Kurslar haqida ma’lumot olish uchun ariza qoldiring.
          </p>
        )}
        {variant === "faq" && <FAQSection items={faqs} pageHeading />}
        {variant === "contact" && (
          <section id="contact" className="container contact-page-intro">
            <h1 className="section-heading">Bog‘lanish</h1>
            <LeadApplicationForm courses={courses} />
          </section>
        )}
        {variant !== "courses" && children}
        {variant !== "contact" && (
          <ContactBanner
            onOpen={() => openLead()}
            showDetails={variant === "home"}
          />
        )}
      </main>
      <SiteFooter contact={contact?.data} />
      {variant !== "contact" && (
        <LeadApplicationModal
          open={open}
          onOpenChange={setOpen}
          courseId={courseId}
          courses={courses}
        />
      )}
    </>
  );
}
