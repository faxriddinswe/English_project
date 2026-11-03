import { afterEach, describe, expect, it, vi } from "vitest";
import { fieldLabel, formatValue } from "../../src/lib/uz";
describe("Uzbek display boundary", () => {
  it("translates state/field codes and never exposes an unknown technical field label", () => {
    expect(formatValue("NAMUNA feedback task", "title")).toBe(
      "NAMUNA feedback task",
    );
    expect(formatValue("Reading Family", "student_name")).toBe(
      "Reading Family",
    );
    expect(fieldLabel("updated_at")).toBe("Yangilangan vaqti");
    expect(fieldLabel("data.overall")).toBe("Umumiy ball");
    expect(fieldLabel("unexpected_internal_field")).toBeUndefined();
    expect(formatValue("accepted", "status")).toBe("Qabul qilingan");
    expect(formatValue("calendar_month", "billing_policy")).toBe(
      "Kalendar oyi bo‘yicha",
    );
    expect(formatValue("unknown_state", "status")).toBe("Holat belgilanmagan");
  });
  it("formats Tashkent time explicitly in Uzbek without locale fallback month tokens", () => {
    expect(formatValue("2026-10-31T20:30:00Z", "updated_at")).toBe(
      "01 noyabr 2026, 01:30",
    );
    expect(formatValue("600000.00", "amount")).toContain("so‘m");
    expect(formatValue("/courses", "source")).toBe("Kurslar sahifasi");
  });
});
describe("confirmed mutation notifications", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });
  it("emits an error rather than success when the initial security request cannot connect", async () => {
    const emit = vi.fn();
    vi.stubGlobal("window", { dispatchEvent: emit });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    const { mutation } = await import("../../src/lib/api/client");
    await expect(mutation("/teacher/groups", {})).rejects.toMatchObject({
      code: "network_error",
    });
    expect(emit).toHaveBeenCalledTimes(1);
    expect((emit.mock.calls[0][0] as CustomEvent).detail).toMatchObject({
      kind: "error",
      title: "Amal bajarilmadi.",
    });
  });
  it("announces a specific action only after the persistence response resolves", async () => {
    const emit = vi.fn();
    vi.stubGlobal("window", { dispatchEvent: emit });
    let resolve!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ token: "signed-test" }), {
            status: 200,
          }),
        )
        .mockImplementationOnce(
          () =>
            new Promise<Response>((r) => {
              resolve = r;
            }),
        ),
    );
    const { mutation } = await import("../../src/lib/api/client");
    const request = mutation("/teacher/payments", { amount: "100000.00" });
    await vi.waitFor(() => expect(resolve).toBeDefined());
    expect(emit).not.toHaveBeenCalled();
    resolve(new Response(JSON.stringify({ id: "persisted" }), { status: 201 }));
    await request;
    expect((emit.mock.calls[0][0] as CustomEvent).detail).toMatchObject({
      kind: "success",
      title: "To‘lov qo‘shildi.",
    });
  });
});

describe("cross-tab signed CSRF refresh", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });
  it("uses the current readable cookie on each write instead of a stale module token", async () => {
    const document = { cookie: "se_csrf=first-signed-token" };
    vi.stubGlobal("document", document);
    const fetcher = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ id: "saved" }), { status: 200 }),
        ),
      );
    vi.stubGlobal("fetch", fetcher);
    const { api } = await import("../../src/lib/api/client");
    await api("/teacher/settings", { method: "PUT", body: "{}" });
    document.cookie = "se_csrf=rotated-by-another-tab";
    await api("/teacher/settings", { method: "PUT", body: "{}" });
    expect(
      new Headers(fetcher.mock.calls[1][1].headers).get("X-CSRF-Token"),
    ).toBe("rotated-by-another-tab");
  });
  it("retries a pre-write csrf rejection once with the same payment key and body", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "old-token" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: "csrf_failed",
            message: "Sahifani yangilang",
          }),
          { status: 403 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "fresh-token" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "only-one-payment" }), {
          status: 201,
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    const { mutation } = await import("../../src/lib/api/client");
    await mutation(
      "/teacher/payments",
      { amount: "100000.00" },
      "POST",
      "stable-idempotency-key",
    );
    const first = fetcher.mock.calls[1][1],
      second = fetcher.mock.calls[3][1];
    expect(first.body).toBe(second.body);
    expect(new Headers(second.headers).get("Idempotency-Key")).toBe(
      "stable-idempotency-key",
    );
    expect(new Headers(second.headers).get("X-CSRF-Token")).toBe("fresh-token");
  });
});
