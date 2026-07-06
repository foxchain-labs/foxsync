/**
 * FoxPoints Calculator
 *
 * Determines how many FoxPoints to award based on PR/issue labels.
 * The rules mirror GrantFox's contribution tiers and complexity levels.
 */

import { PointsRule } from "../types.js";

/**
 * Label-to-points mapping.
 * Labels are matched case-insensitively. First match wins.
 */
const POINTS_RULES: PointsRule[] = [
  // Complexity labels
  { label: "complexity:critical",  points: 150 },
  { label: "complexity:high",      points: 80  },
  { label: "complexity:medium",    points: 40  },
  { label: "complexity:low",       points: 15  },
  // Type labels
  { label: "type:feature",         points: 60  },
  { label: "type:bug",             points: 30  },
  { label: "type:docs",            points: 10  },
  { label: "type:test",            points: 20  },
  { label: "type:refactor",        points: 25  },
  // Effort labels (fallback)
  { label: "effort:xl",            points: 100 },
  { label: "effort:l",             points: 60  },
  { label: "effort:m",             points: 30  },
  { label: "effort:s",             points: 10  },
];

/** Default points when no matching label is found. */
const DEFAULT_POINTS = 10;

/**
 * Calculate FoxPoints for a contribution based on its labels.
 *
 * @param labels - Array of label names from the PR/issue
 * @returns Points to award
 */
export function calculatePoints(labels: string[]): number {
  const normalizedLabels = labels.map((l) => l.toLowerCase().trim());

  for (const rule of POINTS_RULES) {
    if (normalizedLabels.some((l) => l === rule.label || l.includes(rule.label))) {
      return rule.points;
    }
  }

  return DEFAULT_POINTS;
}

/**
 * Get a human-readable reason for the points awarded.
 */
export function getPointsReason(labels: string[]): string {
  const normalizedLabels = labels.map((l) => l.toLowerCase().trim());

  for (const rule of POINTS_RULES) {
    if (normalizedLabels.some((l) => l === rule.label || l.includes(rule.label))) {
      return `Matched label: ${rule.label}`;
    }
  }

  return "Default points (no complexity label found)";
}
