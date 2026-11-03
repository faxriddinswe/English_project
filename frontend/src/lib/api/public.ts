import { localizeText } from "@/lib/uz";
export interface ContentItem {
  id: string;
  kind: string;
  title: string;
  data: Record<string, unknown>;
  media_url: string | null;
  sort_order: number;
}
export interface Course {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  audience: string;
  level: string;
  features: string[];
  duration: string;
  lessons_per_week: number | null;
  lesson_minutes: number | null;
  format: string;
  schedule: string;
  marketing_price: string | null;
  image_url: string | null;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
export interface Site {
  brand: string;
  content: ContentItem[];
}
export async function publicFetch<T>(path: string): Promise<T> {
  const origin = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000";
  const response = await fetch(`${origin}/api/v1/public${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Public API unavailable");
  return response.json() as Promise<T>;
}
export const text = (
  item: ContentItem | undefined,
  key: string,
  fallback = "",
) =>
  typeof item?.data[key] === "string"
    ? ["body", "subheading", "label"].includes(key)
      ? localizeText(item.data[key] as string)
      : (item.data[key] as string)
    : fallback;
