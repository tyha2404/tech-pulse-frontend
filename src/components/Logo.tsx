import React from 'react';

/** The TechPulse mark: one signal rising above the noise.
 *  Same geometry as public/favicon.svg and the PWA icons; keep them in sync. */
export const LogoMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
    <rect width="32" height="32" rx="8" className="fill-primary" />
    <g fill="none" strokeLinecap="round" strokeWidth="3.25">
      <path className="stroke-white/45" d="M8.5 19.5v3M13.5 17v5.5M23.5 18.5v4" />
      <path className="stroke-pulse" d="M18.5 8.5v14" />
    </g>
  </svg>
);

export const Logo: React.FC = () => (
  <span className="flex items-center gap-2">
    <LogoMark className="h-7 w-7" />
    <span className="text-ink text-[17px] font-bold tracking-[-0.02em]">TechPulse</span>
  </span>
);
