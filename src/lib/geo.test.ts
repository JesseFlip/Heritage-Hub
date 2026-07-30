import { describe, expect, it } from "vitest";
import { haversineMi } from "./geo";

describe("haversineMi", () => {
  it("returns 0 for identical points", () => {
    const p = { lat: 32.7767, lng: -96.797 };
    expect(haversineMi(p, p)).toBe(0);
  });

  it("computes the known distance between Dallas and Fort Worth", () => {
    const dallas = { lat: 32.7767, lng: -96.797 };
    const fortWorth = { lat: 32.7555, lng: -97.3308 };
    const miles = haversineMi(dallas, fortWorth);
    // Straight-line distance is ~30 miles; allow generous tolerance for the
    // approximation without pinning to a single fragile decimal.
    expect(miles).toBeGreaterThan(25);
    expect(miles).toBeLessThan(35);
  });
});
