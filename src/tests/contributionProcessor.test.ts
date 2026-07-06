/**
 * Tests for the contribution processor pipeline.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ContributionEvent } from "../types.js";

// Mock external dependencies
vi.mock("../stellar/reputationClient.js", () => ({
  awardFoxPoints: vi.fn().mockResolvedValue("mock-tx-hash-abc123"),
}));

vi.mock("../services/grantfoxSync.js", () => ({
  syncToGrantFox: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("fs", () => ({
  readFileSync: vi.fn(() => "[]"),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => false),
}));

const { processContributionEvent } = await import("../services/contributionProcessor.js");
const { registerContributor } = await import("../github/contributorRegistry.js");
const { awardFoxPoints } = await import("../stellar/reputationClient.js");

const VALID_STELLAR = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";

const mockEvent: ContributionEvent = {
  number: 42,
  repo: "GrantChain/grant-fox",
  contributor: "testuser",
  eventType: "pr_merged",
  title: "feat: add milestone tracking",
  url: "https://github.com/GrantChain/grant-fox/pull/42",
  timestamp: new Date().toISOString(),
  labels: ["complexity:high"],
};

describe("processContributionEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails gracefully when contributor has no Stellar address", async () => {
    const result = await processContributionEvent({
      ...mockEvent,
      contributor: "unregistered-user-9999",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("no registered Stellar address");
    expect(awardFoxPoints).not.toHaveBeenCalled();
  });

  it("awards FoxPoints for a registered contributor", async () => {
    registerContributor("testuser", VALID_STELLAR);

    const result = await processContributionEvent(mockEvent);

    expect(result.success).toBe(true);
    expect(result.foxPointsAwarded).toBe(80); // complexity:high = 80
    expect(result.stellarTxHash).toBe("mock-tx-hash-abc123");
    expect(awardFoxPoints).toHaveBeenCalledWith(VALID_STELLAR, 80);
  });

  it("calculates default points when no matching labels", async () => {
    registerContributor("testuser", VALID_STELLAR);

    const result = await processContributionEvent({
      ...mockEvent,
      labels: [],
    });

    expect(result.foxPointsAwarded).toBe(10); // default
  });

  it("returns error result when Stellar call fails", async () => {
    registerContributor("testuser", VALID_STELLAR);
    vi.mocked(awardFoxPoints).mockRejectedValueOnce(new Error("RPC error"));

    const result = await processContributionEvent(mockEvent);

    expect(result.success).toBe(false);
    expect(result.error).toContain("On-chain");
  });

  it("handles issue_closed events", async () => {
    registerContributor("testuser", VALID_STELLAR);

    const result = await processContributionEvent({
      ...mockEvent,
      eventType: "issue_closed",
      labels: ["type:bug"],
    });

    expect(result.success).toBe(true);
    expect(result.foxPointsAwarded).toBe(30); // type:bug = 30
  });
});
