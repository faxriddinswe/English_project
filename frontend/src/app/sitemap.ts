import type { MetadataRoute } from "next";
import { publicFetch, type Course } from "@/lib/api/public";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const courses = await publicFetch<{ items: Course[] }>("/courses").catch(
    () => ({ items: [] }),
  );
  return [
    "/",
    "/about",
    "/faq",
    "/contact",
    "/courses",
    "/results",
    "/privacy",
    ...courses.items.map((c) => `/courses/${c.slug}`),
  ].map((path) => ({ url: base + path }));
}
