import { afterEach, describe, expect, it, vi } from "vitest";
describe("API failure and mutation contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });
  it("never reports success when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    const { api } = await import("../../src/lib/api/client");
    await expect(api("/student/billing")).rejects.toMatchObject({
      code: "network_error",
      status: 0,
    });
  });
  it("adds CSRF, credentials and a stable payment idempotency key", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "signed-test-token" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "persisted-payment" }), {
          status: 201,
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    const { mutation } = await import("../../src/lib/api/client");
    const result = await mutation(
      "/teacher/payments",
      { amount: "300000" },
      "POST",
      "same-key-on-retry",
    );
    expect(result).toEqual({ id: "persisted-payment" });
    const options = fetcher.mock.calls[1][1] as RequestInit;
    expect(new Headers(options.headers).get("X-CSRF-Token")).toBe(
      "signed-test-token",
    );
    expect(new Headers(options.headers).get("Idempotency-Key")).toBe(
      "same-key-on-retry",
    );
    expect(options.credentials).toBe("same-origin");
  });
  it("keeps backend field errors and does not turn a 422 into success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "validation_error",
            message: "Maydonlarni tekshiring",
            field_errors: { phone: "Invalid phone" },
          }),
          { status: 422 },
        ),
      ),
    );
    const { api } = await import("../../src/lib/api/client");
    await expect(api("/public/leads")).rejects.toMatchObject({
      status: 422,
      fieldErrors: { phone: "Ma’lumotni tekshiring va qayta urinib ko‘ring." },
    });
  });
});
