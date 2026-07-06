/**
 * Contributor Registry
 *
 * Maps GitHub usernames to Stellar addresses.
 * In production this would be backed by a database (PostgreSQL, Redis, etc.).
 * For this reference implementation we use an in-memory store with a JSON
 * persistence layer — easy to swap out.
 *
 * Contributors register their Stellar address via the GrantFox platform, which
 * calls the /register endpoint on this service.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { ContributorMapping } from "../types.js";

const REGISTRY_PATH = "./data/contributors.json";

/** Load the registry from disk (or return empty). */
function loadRegistry(): Map<string, ContributorMapping> {
  if (!existsSync(REGISTRY_PATH)) return new Map();
  try {
    const raw = readFileSync(REGISTRY_PATH, "utf-8");
    const arr: ContributorMapping[] = JSON.parse(raw);
    return new Map(arr.map((c) => [c.githubUsername.toLowerCase(), c]));
  } catch {
    return new Map();
  }
}

/** Persist the registry to disk. */
function saveRegistry(registry: Map<string, ContributorMapping>): void {
  const arr = Array.from(registry.values());
  try {
    // Ensure data directory exists
    writeFileSync(REGISTRY_PATH, JSON.stringify(arr, null, 2));
  } catch (err) {
    console.error("Failed to persist contributor registry:", err);
  }
}

const registry = loadRegistry();

/**
 * Register or update a contributor's Stellar address.
 */
export function registerContributor(
  githubUsername: string,
  stellarAddress: string
): ContributorMapping {
  if (!stellarAddress.startsWith("G") || stellarAddress.length !== 56) {
    throw new Error("Invalid Stellar address format");
  }

  const mapping: ContributorMapping = {
    githubUsername: githubUsername.toLowerCase(),
    stellarAddress,
    registeredAt: new Date().toISOString(),
  };

  registry.set(githubUsername.toLowerCase(), mapping);
  saveRegistry(registry);
  return mapping;
}

/**
 * Look up a contributor's Stellar address by GitHub username.
 * Returns null if not registered.
 */
export function getStellarAddress(githubUsername: string): string | null {
  return registry.get(githubUsername.toLowerCase())?.stellarAddress ?? null;
}

/**
 * Get all registered contributors.
 */
export function getAllContributors(): ContributorMapping[] {
  return Array.from(registry.values());
}

/**
 * Check if a GitHub username is registered.
 */
export function isRegistered(githubUsername: string): boolean {
  return registry.has(githubUsername.toLowerCase());
}
