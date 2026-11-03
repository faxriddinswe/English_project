import { PublicSite } from "@/features/PublicSite";
import { publicFetch, type Site, type Course } from "@/lib/api/public";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Ko‘p beriladigan savollar",
  description:
    "Sherzod English kurslari va yozilish tartibi bo‘yicha savollar.",
  alternates: { canonical: "/faq" },
};
export default async function Page() {
  const [site, courses] = await Promise.allSettled([
    publicFetch<Site>("/site"),
    publicFetch<{ items: Course[] }>("/courses"),
  ]);
  return (
    <PublicSite
      variant="faq"
      site={
        site.status === "fulfilled"
          ? site.value
          : { brand: "Sherzod English", content: [] }
      }
      courses={courses.status === "fulfilled" ? courses.value.items : []}
      unavailable={site.status === "rejected" || courses.status === "rejected"}
    />
  );
}
