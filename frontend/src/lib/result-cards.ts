import { text, type ContentItem } from "@/lib/api/public";
export function resultCards(content: ContentItem[]) {
  return content
    .filter((x) => x.kind === "result")
    .map((r) =>
      r.data.type === "ielts"
        ? {
            type: "ielts" as const,
            id: r.id,
            isSample: r.data.is_sample === true,
            studentName: text(r, "student_name"),
            examDate: text(r, "exam_date"),
            listening: Number(r.data.listening),
            reading: Number(r.data.reading),
            writing: Number(r.data.writing),
            speaking: Number(r.data.speaking),
            overall: Number(r.data.overall),
            certificateUrl: r.media_url ?? undefined,
          }
        : {
            type: "cefr" as const,
            id: r.id,
            isSample: r.data.is_sample === true,
            studentName: text(r, "student_name"),
            examDate: text(r, "exam_date"),
            cefrScore: text(r, "cefr_score"),
            level: text(r, "level") as "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
            certificateUrl: r.media_url ?? undefined,
          },
    );
}
