import React, { useLayoutEffect, useRef } from 'react';
import {
  IconArrowDown,
  IconFeed,
  IconForYou,
  IconHelp,
  IconRadar,
  IconRefresh,
  IconSearch,
  IconSources,
  IconSpinner,
  IconSystem,
} from './icons';
import type { Icon as IconType } from './icons';
import { Logo } from './Logo';
import { ThemeControl } from './ThemeControl';

export type AppTab = 'feed' | 'semantic' | 'personalized' | 'radar' | 'sources' | 'admin';

interface FeedHeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  crawlingAll: boolean;
  onCrawlAll: () => void;
  onOpenExplanation: () => void;
  pullDistance: number;
}

const TABS: { id: AppTab; label: string; short: string; icon: IconType }[] = [
  { id: 'feed', label: 'Bản tin', short: 'Bản tin', icon: IconFeed },
  { id: 'personalized', label: 'Dành cho bạn', short: 'Cho bạn', icon: IconForYou },
  { id: 'semantic', label: 'Tìm theo ngữ nghĩa', short: 'Tìm', icon: IconSearch },
  { id: 'radar', label: 'Radar công nghệ', short: 'Radar', icon: IconRadar },
  { id: 'sources', label: 'Nguồn tin', short: 'Nguồn', icon: IconSources },
  { id: 'admin', label: 'Hệ thống', short: 'Hệ thống', icon: IconSystem },
];

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  activeTab,
  setActiveTab,
  crawlingAll,
  onCrawlAll,
  onOpenExplanation,
  pullDistance,
}) => {
  const headerRef = useRef<HTMLElement>(null);

  // Đo chiều cao thật của header (gồm safe-area inset) và publish ra --app-header-h
  // để các date group header sticky bám đúng ngay dưới header.
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const apply = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 0) {
        document.documentElement.style.setProperty('--app-header-h', `${h}px`);
      }
    };

    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(el);

    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className="header-safe-pt border-rule bg-paper/95 sticky top-0 z-30 border-b px-4 backdrop-blur-md sm:px-6"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 pb-2.5 xl:pb-0">
          <button
            onClick={() => setActiveTab('feed')}
            aria-label="TechPulse, về Bản tin"
            className="-ml-1 cursor-pointer rounded-lg p-1"
          >
            <Logo />
          </button>

          <nav aria-label="Điều hướng chính" className="hidden self-stretch xl:flex">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`-mb-px cursor-pointer border-b-2 px-3 pt-4 pb-3.5 text-[13px] whitespace-nowrap transition-colors ${
                    active
                      ? 'border-accent-600 text-accent-700 font-semibold'
                      : 'text-muted hover:text-ink border-transparent font-medium'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5">
            <ThemeControl />
            <button
              onClick={onOpenExplanation}
              className="text-muted hover:bg-wash hover:text-ink flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors"
              title="Điểm AI được tính thế nào?"
              aria-label="Điểm AI được tính thế nào?"
            >
              <IconHelp className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={onCrawlAll}
              aria-label={crawlingAll ? 'Đang cập nhật tin' : 'Cập nhật tin'}
              disabled={crawlingAll}
              className="bg-primary hover:bg-primary-hover flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-white transition-colors disabled:cursor-wait disabled:opacity-70"
            >
              <IconRefresh className={`h-4 w-4 ${crawlingAll ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {crawlingAll ? 'Đang cập nhật' : 'Cập nhật tin'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile tab bar: bottom of the screen, within thumb reach */}
      <nav
        aria-label="Điều hướng chính"
        className="border-rule bg-paper/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md xl:hidden"
      >
        <div className="grid grid-cols-6">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-[58px] cursor-pointer flex-col items-center justify-center gap-1 text-[10.5px] leading-none transition-colors ${
                  active ? 'text-ink font-semibold' : 'text-muted font-medium'
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="bg-accent-600 absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-b-full"
                  />
                )}
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.1 : 1.6} />
                <span className="whitespace-nowrap">{tab.short}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || crawlingAll) && activeTab === 'feed' && (
        <div
          role="status"
          style={{ height: `${crawlingAll ? 44 : pullDistance}px` }}
          className="text-muted flex items-center justify-center overflow-hidden text-[13px] transition-[height] duration-200"
        >
          <span className="flex items-center gap-2">
            {crawlingAll ? (
              <>
                <IconSpinner className="h-4 w-4 animate-spin" />
                Đang lấy bài mới từ các nguồn…
              </>
            ) : pullDistance >= 60 ? (
              <>
                <IconRefresh className="text-signal-600 h-4 w-4" />
                Thả tay để cập nhật
              </>
            ) : (
              <>
                <IconArrowDown className="h-4 w-4" />
                Kéo xuống để cập nhật
              </>
            )}
          </span>
        </div>
      )}
    </>
  );
};
