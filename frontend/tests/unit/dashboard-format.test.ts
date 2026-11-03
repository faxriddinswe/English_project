import { describe, expect, it } from "vitest";
import {
  changeMonth,
  money,
  receiptComparison,
} from "../../src/features/workspace/dashboard-format";

describe("dashboard exact financial labels", () => {
  it("preserves cents and large money amounts in labels", () => {
    expect(
      money("9999999999999999.99").replaceAll(/[\s\u00a0\u202f.,]/g, ""),
    ).toBe("999999999999999999so‘m");
    expect(receiptComparison("-20.00", "100.00")).toEqual({
      text: "-120% oldingi oyga nisbatan",
      direction: -1,
    });
    expect(receiptComparison("120.01", "100.00").text).toBe(
      "+20% oldingi oyga nisbatan",
    );
    expect(
      receiptComparison("9999999999999999.99", "9999999999999999.98").direction,
    ).toBe(1);
  });
  it("does not invent a growth percentage when the comparison month is zero", () => {
    expect(receiptComparison("10.00", "0.00").text).not.toContain("%");
    expect(receiptComparison("0.00", "0.00").text).not.toContain("NaN");
  });
  it("changes months safely across year boundaries", () => {
    expect(changeMonth("2026-01", -1)).toBe("2025-12");
    expect(changeMonth("2026-12", 1)).toBe("2027-01");
    expect(changeMonth("9998-12", 1)).toBe("9998-12");
  });
});
