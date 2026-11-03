import { formatMoney } from "../../lib/utils/money";

export const MONTHS = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "Iyn",
  "Iyl",
  "Avg",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
];
export const money = (value: unknown) => `${formatMoney(value)} so‘m`;
export const monthLabel = (value: string) =>
  `${MONTHS[Number(value.slice(5, 7)) - 1] ?? ""} ${value.slice(0, 4)}`;
export const shortMoney = (amount: number) => {
  const abs = Math.abs(amount);
  const [scale, label] =
    abs >= 1e9
      ? ([1e9, "mlrd"] as const)
      : abs >= 1e6
        ? ([1e6, "mln"] as const)
        : abs >= 1e3
          ? ([1e3, "ming"] as const)
          : ([1, ""] as const);
  return `${new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 1 }).format(amount / scale)}${label ? " " + label : ""}`;
};
export function changeMonth(month: string, offset: number) {
  const [year, number] = month.split("-").map(Number);
  const total = year * 12 + number - 1 + offset;
  const nextYear = Math.floor(total / 12);
  return nextYear < 2 || nextYear > 9998
    ? month
    : `${String(nextYear).padStart(4, "0")}-${String((total % 12) + 1).padStart(2, "0")}`;
}
function minor(value: string) {
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  return (
    (BigInt(whole || "0") * 100n + BigInt(fraction.padEnd(2, "0"))) *
    (negative ? -1n : 1n)
  );
}
export function receiptComparison(current: string, previous?: string) {
  if (previous === undefined)
    return { text: "Tanlangan kalendar oyi", direction: 0 };
  const now = minor(current),
    before = minor(previous),
    delta = now - before;
  if (before === 0n)
    return {
      text:
        now === 0n
          ? "Oldingi oyda ham tushum yo‘q"
          : "Oldingi oyda tushum yo‘q",
      direction: Number(delta > 0n) - Number(delta < 0n),
    };
  const tenths = (delta * 1000n) / (before < 0n ? -before : before);
  return {
    text: `${tenths > 0n ? "+" : ""}${Number(tenths) / 10}% oldingi oyga nisbatan`,
    direction: Number(delta > 0n) - Number(delta < 0n),
  };
}
