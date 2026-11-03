import Link from "next/link";
import { PublicSite } from "@/features/PublicSite";
import {
  publicFetch,
  type Site,
  type Course,
  type ContentItem,
  type Page,
} from "@/lib/api/public";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "O‘quvchilar natijalari",
  alternates: { canonical: "/results" },
};
export default async function Results({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const q = await searchParams;
  const page =
    /^\d+$/.test(q.page ?? "") && Number.isSafeInteger(Number(q.page))
      ? Math.max(1, Number(q.page))
      : 1;
  const type = ["ielts", "cefr"].includes(q.type ?? "") ? q.type! : "";
  const [site, courses, results] = await Promise.all([
    publicFetch<Site>("/site"),
    publicFetch<{ items: Course[] }>("/courses"),
    publicFetch<Page<ContentItem>>(
      `/results?page=${page}&page_size=60&type=${type}`,
    ),
  ]);
  return (
    <PublicSite
      variant="results"
      resultPage={{
        total: results.total,
        page: results.page,
        pageSize: results.page_size,
      }}
      resultFilter={type === "ielts" || type === "cefr" ? type : "all"}
      site={{
        ...site,
        content: [
          ...site.content.filter((x) => x.kind !== "result"),
          ...results.items,
        ],
      }}
      courses={courses.items}
    >
      <nav className="pagination container" aria-label="Natijalar sahifalari">
        {page > 1 && (
          <Link href={`/results?page=${page - 1}&type=${type}`}>← Oldingi</Link>
        )}
        {page * results.page_size < results.total && (
          <Link href={`/results?page=${page + 1}&type=${type}`}>Keyingi →</Link>
        )}
      </nav>
    </PublicSite>
  );
}
