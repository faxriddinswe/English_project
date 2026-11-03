import { notFound } from "next/navigation";
import { PublicSite } from "@/features/PublicSite";
import { publicFetch, type Site, type Course } from "@/lib/api/public";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title:
      slug === "general-english"
        ? "Grammatika"
        : slug === "ielts"
          ? "IELTS"
          : slug === "cefr"
            ? "SEFR"
            : "Kurs haqida",
    alternates: { canonical: `/courses/${slug}` },
  };
}
export default async function CourseDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [site, courses] = await Promise.all([
    publicFetch<Site>("/site"),
    publicFetch<{ items: Course[] }>("/courses"),
  ]);
  const course = courses.items.find((c) => c.slug === slug);
  if (!course) notFound();
  return (
    <PublicSite
      variant="course-detail"
      site={site}
      courses={courses.items}
      detailCourse={course}
    />
  );
}
