/** AI score tiers drive the visual weight of an article across the app. */
export type ScoreTier = 'high' | 'mid' | 'low' | 'none';

export function scoreTier(score: number | undefined): ScoreTier {
  if (!score) return 'none';
  if (score >= 8) return 'high';
  if (score >= 6) return 'mid';
  return 'low';
}
