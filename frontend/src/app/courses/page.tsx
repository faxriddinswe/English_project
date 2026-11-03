import { PublicSite } from "@/features/PublicSite";
import { publicFetch, type Site, type Course } from "@/lib/api/public";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Kurslar",
  description: "Grammatika, IELTS va CEFR yo‘nalishlari.",
  alternates: { canonical: "/courses" },
};
export default async function Courses() {
  const [site, courses] = await Promise.all([
    publicFetch<Site>("/site"),
    publicFetch<{ items: Course[] }>("/courses"),
  ]);
  return <PublicSite variant="courses" site={site} courses={courses.items} />;
}
