/**
 * GitHub Webhook Handler
 *
 * Processes incoming GitHub webhook events and extracts
 * structured ContributionEvents for downstream processing.
 *
 * Supported events:
 * - pull_request (action: closed, merged: true)
 * - issues (action: closed)
 */

import { Webhooks } from "@octokit/webhooks";
import { config } from "../config.js";
import { ContributionEvent } from "../types.js";

export const webhooks = new Webhooks({
  secret: config.GITHUB_WEBHOOK_SECRET,
});

/**
 * Extract a ContributionEvent from a merged pull request.
 */
webhooks.on("pull_request.closed", async ({ payload }) => {
  // Only process merged PRs, not just closed ones
  if (!payload.pull_request.merged) return;

  const event: ContributionEvent = {
    number: payload.pull_request.number,
    repo: payload.repository.full_name,
    contributor: payload.pull_request.user.login,
    eventType: "pr_merged",
    title: payload.pull_request.title,
    url: payload.pull_request.html_url,
    timestamp: payload.pull_request.merged_at ?? new Date().toISOString(),
    labels: payload.pull_request.labels.map((l) => l.name),
    escrowId: extractEscrowId(payload.pull_request.body ?? ""),
  };

  // Emit for processing — decoupled from webhook receipt
  contributionEventEmitter(event);
});

/**
 * Extract a ContributionEvent from a closed issue.
 */
webhooks.on("issues.closed", async ({ payload }) => {
  const event: ContributionEvent = {
    number: payload.issue.number,
    repo: payload.repository.full_name,
    contributor: payload.issue.user?.login ?? "unknown",
    eventType: "issue_closed",
    title: payload.issue.title,
    url: payload.issue.html_url,
    timestamp: payload.issue.closed_at ?? new Date().toISOString(),
    labels: payload.issue.labels
      ? payload.issue.labels.map((l) => (typeof l === "string" ? l : l.name ?? ""))
      : [],
    escrowId: extractEscrowId(payload.issue.body ?? ""),
  };

  contributionEventEmitter(event);
});

/**
 * Extract an escrow ID from PR/issue body text.
 * Convention: "Escrow ID: <id>" or "escrow-id: <id>" anywhere in the body.
 */
function extractEscrowId(body: string): string | undefined {
  const match = body.match(/escrow[-\s]?id[:\s]+([a-zA-Z0-9]+)/i);
  return match?.[1];
}

// ── Event emitter (dependency injection for testability) ────────────────────

type ContributionEventHandler = (event: ContributionEvent) => Promise<void>;
let contributionEventEmitter: ContributionEventHandler = async () => {};

/**
 * Register the handler that processes contribution events.
 * Called at startup to wire up the processing pipeline.
 */
export function setContributionEventHandler(handler: ContributionEventHandler): void {
  contributionEventEmitter = handler;
}
