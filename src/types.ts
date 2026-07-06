/**
 * Domain types for the webhook sync service.
 */

/** A contribution event processed from a GitHub webhook. */
export interface ContributionEvent {
  /** GitHub PR or issue number */
  number: number;
  /** Repo full name (owner/repo) */
  repo: string;
  /** GitHub username of the contributor */
  contributor: string;
  /** Type of event that triggered this */
  eventType: "pr_merged" | "issue_closed";
  /** PR/issue title */
  title: string;
  /** URL of the PR/issue */
  url: string;
  /** When the event occurred */
  timestamp: string;
  /** Labels on the PR/issue (used for tier detection) */
  labels: string[];
  /** Linked GrantFox escrow ID, if any (from PR body / label) */
  escrowId?: string;
}

/** Result of processing a contribution event. */
export interface ProcessingResult {
  success: boolean;
  event: ContributionEvent;
  foxPointsAwarded?: number;
  stellarTxHash?: string;
  grantfoxSynced?: boolean;
  error?: string;
}

/** FoxPoints awarded based on label/complexity. */
export interface PointsRule {
  label: string;
  points: number;
}

/** A contributor's Stellar address mapping (stored in a local registry). */
export interface ContributorMapping {
  githubUsername: string;
  stellarAddress: string;
  registeredAt: string;
}
