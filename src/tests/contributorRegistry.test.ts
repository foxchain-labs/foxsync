/**
 * Tests for the contributor registry.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock fs to avoid disk I/O in tests
vi.mock("fs", () => ({
  readFileSync: vi.fn(() => "[]"),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => false),
}));

// Re-import after mocking
const { registerContributor, getStellarAddress, isRegistered } = await import(
  "../github/contributorRegistry.js"
);

describe("contributorRegistry", () => {
  const validAddress = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";

  it("registers a contributor and retrieves their address", () => {
    registerContributor("alice", validAddress);
    expect(getStellarAddress("alice")).toBe(validAddress);
  });

  it("is case-insensitive for usernames", () => {
    registerContributor("Bob", validAddress);
    expect(getStellarAddress("bob")).toBe(validAddress);
    expect(getStellarAddress("BOB")).toBe(validAddress);
  });

  it("returns null for unregistered contributors", () => {
    expect(getStellarAddress("unknown-user-xyz")).toBeNull();
  });

  it("correctly reports registration status", () => {
    registerContributor("charlie", validAddress);
    expect(isRegistered("charlie")).toBe(true);
    expect(isRegistered("dave")).toBe(false);
  });

  it("rejects invalid Stellar addresses", () => {
    expect(() => registerContributor("eve", "invalid")).toThrow();
    expect(() => registerContributor("eve", "SINVALID")).toThrow();
  });

  it("allows updating a contributor's address", () => {
    const address2 = "GBVV3LKAVHMNVDV7EPNQFUSWIGQWNVFQQUOEDQIJWABWBAUQF73TH4MI";
    registerContributor("frank", validAddress);
    registerContributor("frank", address2);
    expect(getStellarAddress("frank")).toBe(address2);
  });
});
