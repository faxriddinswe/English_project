import type { Row } from "./config";
const weekdays = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];
export function groupSchedule(value: unknown): string {
  const rules = (Array.isArray(value) ? value : []) as Row[];
  return (
    rules
      .map((rule) => {
        const start = String(rule.local_time).slice(0, 5);
        const [hour, minute] = start.split(":").map(Number);
        const end = hour * 60 + minute + Number(rule.duration_minutes);
        const finish = String(
          rule.end_time ??
            `${String(Math.floor(end / 60) % 24).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`,
        );
        return `${weekdays[Number(rule.weekday)]} ${start}–${finish}${end >= 1440 ? " (ertasi kun)" : ""}`;
      })
      .join(" · ") || "Jadval kiritilmagan"
  );
}
