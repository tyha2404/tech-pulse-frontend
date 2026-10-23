import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Shared heading for every non-feed screen: sentence-case title, one-line purpose, actions. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => (
  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-prose">
      <h1 className="text-ink text-[24px] leading-tight font-semibold tracking-[-0.015em] sm:text-[28px]">
        {title}
      </h1>
      {description && (
        <p className="text-muted mt-1.5 text-[14px] leading-relaxed">{description}</p>
      )}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
