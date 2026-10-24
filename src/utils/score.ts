/**
 * Single source of truth for match-score banding.
 *
 * Every surface that shows a match score used to roll its own thresholds:
 * the analysis page banded at 80/60, the dashboard badge at 85/70, and the
 * detail modal and PDF export at 80/65. The same score could therefore be
 * rendered in three different colours depending on where you looked.
 *
 * All components now derive their colours and labels from `getScoreTheme`.
 */

/** Lower bound of each tier, in ascending order. */
export const SCORE_THRESHOLDS = {
  strong: 80,
  moderate: 60,
} as const;

export type ScoreTier = 'strong' | 'moderate' | 'developing';

export interface ScoreTheme {
  /** Long, descriptive label (analysis page banner, detail modal). */
  label: string;
  /** Short label (dashboard table cells). */
  shortLabel: string;
  /** Text colour for the score value. */
  text: string;
  /** Surface background colour. */
  bg: string;
  /** Border colour for the surface. */
  border: string;
  /** Full class string for a pill/badge. */
  badgeClass: string;
}

export const SCORE_TIERS: Record<ScoreTier, ScoreTheme> = {
  strong: {
    label: 'Strong Qualification Match',
    shortLabel: 'Strong match',
    text: 'text-emerald-800',
    bg: 'bg-emerald-50/70',
    border: 'border-emerald-200/80',
    badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
  },
  moderate: {
    label: 'Moderate Match · High Potential',
    shortLabel: 'Good match',
    text: 'text-[#722f37]',
    bg: 'bg-[#e8dcc6]/45',
    border: 'border-[#b7a89a]/60',
    badgeClass: 'bg-[#e8dcc6]/60 text-[#722f37] border border-[#b7a89a]/50',
  },
  developing: {
    label: 'Developing Alignment · Skill Gaps Found',
    shortLabel: 'Needs work',
    text: 'text-rose-800',
    bg: 'bg-rose-50/70',
    border: 'border-rose-200/80',
    badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200/80',
  },
};

/** Which tier a score falls into. */
export function getScoreTier(score: number): ScoreTier {
  if (score >= SCORE_THRESHOLDS.strong) return 'strong';
  if (score >= SCORE_THRESHOLDS.moderate) return 'moderate';
  return 'developing';
}

/** The full colour + label set for a score. */
export function getScoreTheme(score: number): ScoreTheme {
  return SCORE_TIERS[getScoreTier(score)];
}
