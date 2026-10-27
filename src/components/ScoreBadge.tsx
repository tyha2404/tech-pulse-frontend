import React from 'react';
import { scoreTier, type ScoreTier } from '../utils/score';

// Square-cornered so it reads as data, not as one of the (pill-shaped) buttons.
const TIER_STYLE: Record<ScoreTier, string> = {
  high: 'bg-signal-50 text-signal-700 ring-signal-200 font-bold',
  mid: 'bg-wash text-ink-2 ring-rule font-semibold',
  low: 'text-muted ring-rule font-medium',
  none: 'text-faint ring-rule font-medium',
};

interface ScoreBadgeProps {
  score: number | undefined;
  className?: string;
}

/** The AI score of an article: a compact tag at the head of its meta line, colored by tier. */
export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, className = '' }) => {
  const tier = scoreTier(score);
  const value = tier === 'none' ? null : score!.toFixed(1);
  return (
    <span
      title={value ? `Điểm AI: ${value}/10` : 'Chưa được AI chấm điểm'}
      className={`score-numeral inline-flex h-[22px] min-w-[2.375rem] shrink-0 items-center justify-center rounded-md px-1.5 text-[13px] leading-none ring-1 ring-inset ${TIER_STYLE[tier]} ${className}`}
    >
      <span aria-hidden="true">{value ?? '–'}</span>
      <span className="sr-only">{value ? `Điểm AI ${value} trên 10` : 'Chưa chấm điểm'}</span>
    </span>
  );
};
