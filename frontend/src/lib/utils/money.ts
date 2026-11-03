// Preserve all NUMERIC(18,2) digits; Number would round large UZS balances.
const integerFormat = new Intl.NumberFormat("uz-UZ");
const separator =
  new Intl.NumberFormat("uz-UZ")
    .formatToParts(1.1)
    .find((p) => p.type === "decimal")?.value ?? ",";
export function formatMoney(value: unknown): string {
  const raw = String(value ?? "");
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(raw)) return "—";
  const negative = raw.startsWith("-"),
    [whole, fraction = ""] = raw.replace(/^-/, "").split(".");
  const digits = integerFormat.format(BigInt(whole));
  const cents = fraction.padEnd(2, "0");
  return (
    (negative ? "-" : "") + digits + (cents === "00" ? "" : separator + cents)
  );
}
