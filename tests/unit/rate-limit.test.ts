import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("permite hasta el límite", () => {
    const key = "test-allow-" + Date.now();
    const r1 = checkRateLimit(key, 2, 10000);
    const r2 = checkRateLimit(key, 2, 10000);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });

  it("bloquea al superar el límite", () => {
    const key = "test-block-" + Date.now();
    checkRateLimit(key, 1, 10000);
    const r2 = checkRateLimit(key, 1, 10000);
    expect(r2.allowed).toBe(false);
    expect(r2.retryAfterSeconds).toBeGreaterThan(0);
  });
});
