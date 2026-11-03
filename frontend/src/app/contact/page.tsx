import { PublicSite } from "@/features/PublicSite";
import { publicFetch, type Site, type Course } from "@/lib/api/public";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Bog‘lanish",
  description:
    "Kursga ariza yoki savolingizni Sherzod English orqali yuboring.",
  alternates: { canonical: "/contact" },
};
export default async function Page() {
  const [site, courses] = await Promise.allSettled([
    publicFetch<Site>("/site"),
    publicFetch<{ items: Course[] }>("/courses"),
  ]);
  return (
    <PublicSite
      variant="contact"
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
