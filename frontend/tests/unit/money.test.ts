import { expect, it } from "vitest";
import { formatMoney } from "../../src/lib/utils/money";
it("preserves maximum PostgreSQL money precision without Number rounding", () => {
  const text = formatMoney("9999999999999999.99");
  expect(text.replace(/[\s\u00a0\u202f.,]/g, "")).toBe("999999999999999999");
  expect(text.endsWith("99")).toBe(true);
});
it("formats credit and adjustments without losing their sign", () => {
  expect(formatMoney("-100000.50")).toMatch(/^-100\s?000[,.]50$/);
  expect(formatMoney("200000.00")).toMatch(/^200\s?000$/);
  expect(formatMoney(null)).toBe("—");
});
