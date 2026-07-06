/**
 * GrantFox Platform Sync
 *
 * Notifies the GrantFox API about confirmed contributions
 * so the platform UI shows up-to-date contribution history.
 */

import { ContributionEvent } from "../types.js";
import { config } from "../config.js";

interface GrantFoxContributionPayload {
  github_username: string;
  repo: string;
  pr_or_issue_number: number;
  event_type: string;
  title: string;
  url: string;
  fox_points: number;
  stellar_tx_hash: string;
  timestamp: string;
  labels: string[];
  escrow_id?: string;
}

/**
 * POST the contribution event to the GrantFox platform API.
 */
export async function syncToGrantFox(
  event: ContributionEvent,
  foxPoints: number,
  stellarTxHash: string
): Promise<void> {
  if (!config.GRANTFOX_API_URL || !config.GRANTFOX_API_KEY) return;

  const payload: GrantFoxContributionPayload = {
    github_username: event.contributor,
    repo: event.repo,
    pr_or_issue_number: event.number,
    event_type: event.eventType,
    title: event.title,
    url: event.url,
    fox_points: foxPoints,
    stellar_tx_hash: stellarTxHash,
    timestamp: event.timestamp,
    labels: event.labels,
    escrow_id: event.escrowId,
  };

  const response = await fetch(
    `${config.GRANTFOX_API_URL}/v1/contributions/sync`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.GRANTFOX_API_KEY}`,
        "User-Agent": "grantfox-webhook-sync/0.1.0",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000), // 10s timeout
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `GrantFox API returned ${response.status}: ${text.slice(0, 200)}`
    );
  }
}
