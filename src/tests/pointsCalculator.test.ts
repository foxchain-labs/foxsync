/**
 * Tests for the FoxPoints calculator.
 */

import { describe, it, expect } from "vitest";
import { calculatePoints, getPointsReason } from "../github/pointsCalculator.js";

describe("calculatePoints", () => {
  it("returns default points when no labels match", () => {
    expect(calculatePoints([])).toBe(10);
    expect(calculatePoints(["unrelated", "label"])).toBe(10);
  });

  it("awards correct points for complexity labels", () => {
    expect(calculatePoints(["complexity:critical"])).toBe(150);
    expect(calculatePoints(["complexity:high"])).toBe(80);
    expect(calculatePoints(["complexity:medium"])).toBe(40);
    expect(calculatePoints(["complexity:low"])).toBe(15);
  });

  it("awards correct points for type labels", () => {
    expect(calculatePoints(["type:feature"])).toBe(60);
    expect(calculatePoints(["type:bug"])).toBe(30);
    expect(calculatePoints(["type:docs"])).toBe(10);
    expect(calculatePoints(["type:test"])).toBe(20);
  });

  it("is case-insensitive", () => {
    expect(calculatePoints(["Complexity:High"])).toBe(80);
    expect(calculatePoints(["TYPE:FEATURE"])).toBe(60);
  });

  it("uses the first matching rule when multiple labels match", () => {
    // complexity:critical comes first in rules, should win over type:feature
    const points = calculatePoints(["complexity:critical", "type:feature"]);
    expect(points).toBe(150);
  });
});

describe("getPointsReason", () => {
  it("returns a reason string for matched labels", () => {
    const reason = getPointsReason(["complexity:high"]);
    expect(reason).toContain("complexity:high");
  });

  it("returns default reason for unmatched labels", () => {
    const reason = getPointsReason([]);
    expect(reason).toContain("Default");
  });
});
