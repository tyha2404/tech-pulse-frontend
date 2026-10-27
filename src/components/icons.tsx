import React from 'react';

/* oxlint-disable react/only-export-components -- icons are built by a factory; this file holds no state for fast refresh to preserve */

// TechPulse icon set: 24px grid, round caps and joins, 1.75 stroke by default.
// Same pen as the logo mark (components/Logo.tsx). Icons inherit color via currentColor;
// pass `fill="currentColor"` to show the active state of outline icons (bookmark, thumbs).

export type IconProps = React.SVGProps<SVGSVGElement>;
export type Icon = React.FC<IconProps>;

const createIcon = (name: string, children: React.ReactNode): Icon => {
  const Component: Icon = ({ strokeWidth = 1.75, fill = 'none', ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
  Component.displayName = name;
  return Component;
};

// Small solid dots (ellipsis, the "i" of alerts) stay filled whatever the outline state.
const Dot = ({ cx, cy, r = 1.25 }: { cx: number; cy: number; r?: number }) => (
  <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
);

/* ---------- Navigation ---------- */

/** Bản tin: the feed itself, a score tick beside each title line. */
export const IconFeed = createIcon(
  'IconFeed',
  <>
    <path d="M4 5v3M4 10.5v3M4 16v3" />
    <path d="M8.5 6.5H20M8.5 12H17M8.5 17.5H19" />
  </>
);

/** Dành cho bạn */
export const IconForYou = createIcon(
  'IconForYou',
  <>
    <circle cx="12" cy="8" r="3.75" />
    <path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" />
  </>
);

export const IconSearch = createIcon(
  'IconSearch',
  <>
    <circle cx="10.75" cy="10.75" r="6.25" />
    <path d="m15.5 15.5 4.5 4.5" />
  </>
);

/** Radar công nghệ: rings with a sweep and one contact. */
export const IconRadar = createIcon(
  'IconRadar',
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5a4.5 4.5 0 1 0 4.5 4.5" />
    <path d="m12 12 6-6" />
    <Dot cx={15.25} cy={15.25} />
  </>
);

/** Nguồn tin: the feed (RSS) glyph. */
export const IconSources = createIcon(
  'IconSources',
  <>
    <path d="M5 11a8 8 0 0 1 8 8" />
    <path d="M5 4.5A14.5 14.5 0 0 1 19.5 19" />
    <Dot cx={6} cy={18} r={1.5} />
  </>
);

/** Hệ thống: a gauge. */
export const IconSystem = createIcon(
  'IconSystem',
  <>
    <path d="M4.2 17.5a8.5 8.5 0 1 1 15.6 0" />
    <path d="m12 14 3.5-4.5" />
    <Dot cx={12} cy={14} r={1.5} />
  </>
);

/* ---------- Actions ---------- */

export const IconRefresh = createIcon(
  'IconRefresh',
  <>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.5 4.5v4.25h-4.25" />
  </>
);

export const IconSpinner = createIcon(
  'IconSpinner',
  <>
    <circle cx="12" cy="12" r="7.5" opacity="0.25" />
    <path d="M19.5 12A7.5 7.5 0 0 0 12 4.5" />
  </>
);

export const IconPlus = createIcon('IconPlus', <path d="M12 5v14M5 12h14" />);

export const IconClose = createIcon('IconClose', <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />);

export const IconCheck = createIcon('IconCheck', <path d="m5 12.5 4.5 4.5L19 7.5" />);

export const IconChevronDown = createIcon('IconChevronDown', <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />);

export const IconArrowDown = createIcon(
  'IconArrowDown',
  <path d="M12 4.5v15M6.5 14l5.5 5.5 5.5-5.5" />
);

export const IconTrash = createIcon(
  'IconTrash',
  <>
    <path d="M4.5 7h15M9.5 7V4.75h5V7" />
    <path d="m6.5 7 .9 12.25h9.2L17.5 7" />
    <path d="M10.25 11v4.5M13.75 11v4.5" />
  </>
);

export const IconBookmark = createIcon('IconBookmark', <path d="M7 4.5h10v15.25l-5-3.5-5 3.5z" />);

const thumb = (
  <>
    <path d="M7.5 10.5v9H5a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 5 10.5z" />
    <path d="m7.5 10.5 3.4-6a1.9 1.9 0 0 1 3.5 1.3l-.8 3.7h4.6a2 2 0 0 1 2 2.35l-1.15 6a2 2 0 0 1-1.97 1.65H7.5" />
  </>
);

/** Bài hữu ích */
export const IconThumbsUp = createIcon('IconThumbsUp', thumb);

/** Bài không liên quan: the same hand, flipped. */
export const IconThumbsDown = createIcon(
  'IconThumbsDown',
  <g transform="matrix(1 0 0 -1 0 24)">{thumb}</g>
);

export const IconMore = createIcon(
  'IconMore',
  <>
    <Dot cx={6} cy={12} r={1.4} />
    <Dot cx={12} cy={12} r={1.4} />
    <Dot cx={18} cy={12} r={1.4} />
  </>
);

export const IconDownload = createIcon(
  'IconDownload',
  <>
    <path d="M12 4.5v10.5M7.25 10.5 12 15.25l4.75-4.75" />
    <path d="M5 19.5h14" />
  </>
);

export const IconEye = createIcon(
  'IconEye',
  <>
    <path d="M2.75 12C4.75 8 8 5.75 12 5.75S19.25 8 21.25 12C19.25 16 16 18.25 12 18.25S4.75 16 2.75 12z" />
    <circle cx="12" cy="12" r="2.75" />
  </>
);

export const IconEyeOff = createIcon(
  'IconEyeOff',
  <>
    <path d="M9.5 6.2A8.6 8.6 0 0 1 12 5.75c4 0 7.25 2.25 9.25 6.25a13 13 0 0 1-2.4 3.3M15.3 17.4a8.4 8.4 0 0 1-3.3.85c-4 0-7.25-2.25-9.25-6.25a12.6 12.6 0 0 1 3.4-4.2" />
    <path d="M10.1 10.1a2.75 2.75 0 0 0 3.8 3.8" />
    <path d="m4 4 16 16" />
  </>
);

export const IconFilter = createIcon('IconFilter', <path d="M4 7h16M7 12h10M10 17h4" />);

export const IconSend = createIcon(
  'IconSend',
  <>
    <path d="M20 4 4.5 10.5l6.5 2.5 2.5 6.5z" />
    <path d="m11 13 4-4" />
  </>
);

export const IconCopy = createIcon(
  'IconCopy',
  <>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
  </>
);

export const IconExternal = createIcon(
  'IconExternal',
  <>
    <path d="M13.5 4.5h6v6M19.5 4.5l-8.5 8.5" />
    <path d="M17.5 14v3.5a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2H10" />
  </>
);

export const IconCode = createIcon('IconCode', <path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5" />);

/* ---------- Status & help ---------- */

export const IconHelp = createIcon(
  'IconHelp',
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.35" />
    <Dot cx={12} cy={16.6} r={1.1} />
  </>
);

export const IconAlert = createIcon(
  'IconAlert',
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.75v5" />
    <Dot cx={12} cy={16.1} r={1.1} />
  </>
);

export const IconCheckCircle = createIcon(
  'IconCheckCircle',
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.25 12.25 2.5 2.5 5-5" />
  </>
);

/* ---------- Theme ---------- */

export const IconSun = createIcon(
  'IconSun',
  <>
    <circle cx="12" cy="12" r="3.75" />
    <path d="M12 3v1.75M12 19.25V21M3 12h1.75M19.25 12H21M5.6 5.6l1.25 1.25M17.15 17.15l1.25 1.25M5.6 18.4l1.25-1.25M17.15 6.85l1.25-1.25" />
  </>
);

export const IconMoon = createIcon(
  'IconMoon',
  <path d="M19.5 14.25A7.75 7.75 0 1 1 9.75 4.5a6.25 6.25 0 0 0 9.75 9.75z" />
);

export const IconMonitor = createIcon(
  'IconMonitor',
  <>
    <rect x="3.5" y="4.5" width="17" height="11.5" rx="2" />
    <path d="M12 16v3.5M8.5 19.5h7" />
  </>
);
