import React from 'react';
import {
  BookOpen,
  Search,
  Compass,
  Sparkles,
  Layers,
  Activity,
  HelpCircle,
  RefreshCw,
  ArrowDown,
} from 'lucide-react';

interface FeedHeaderProps {
  activeTab: 'feed' | 'semantic' | 'personalized' | 'radar' | 'sources' | 'admin';
  setActiveTab: (tab: 'feed' | 'semantic' | 'personalized' | 'radar' | 'sources' | 'admin') => void;
  techStacksCount: number;
  sourcesCount: number;
  crawlingAll: boolean;
  onCrawlAll: () => void;
  onOpenExplanation: () => void;
  pullDistance: number;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  activeTab,
  setActiveTab,
  techStacksCount,
  sourcesCount,
  crawlingAll,
  onCrawlAll,
  onOpenExplanation,
  pullDistance,
}) => {
  return (
    <>
      <header className="header-safe-pt sticky top-0 z-30 border-b border-[#e7e2d9] bg-[#fbf9f5]/95 px-3.5 pb-2.5 backdrop-blur-md sm:px-6 sm:pb-3.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#24292f] font-serif text-base font-bold text-white shadow-sm">
              TP
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-[#1c1f24] sm:text-xl">
                  TechPulse
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Bar */}
          <div className="hidden items-center rounded-lg border border-[#e2dcd0] bg-[#eee9df]/80 p-1 font-sans md:flex">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === 'feed'
                  ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
                  : 'text-[#6b6456] hover:text-[#1c1f24]'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> Bài đọc
            </button>
            <button
              onClick={() => setActiveTab('semantic')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === 'semantic'
                  ? 'bg-white font-semibold text-indigo-950 shadow-xs'
                  : 'text-[#6b6456] hover:text-[#1c1f24]'
              }`}
            >
              <Search className="h-3.5 w-3.5 text-indigo-600" /> Semantic Search
            </button>
            <button
              onClick={() => setActiveTab('personalized')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === 'personalized'
                  ? 'bg-white font-semibold text-rose-950 shadow-xs'
                  : 'text-[#6b6456] hover:text-[#1c1f24]'
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-rose-500" /> Dành cho bạn
            </button>
            <button
              onClick={() => setActiveTab('radar')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === 'radar'
                  ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
                  : 'text-[#6b6456] hover:text-[#1c1f24]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Radar Tech ({techStacksCount})
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === 'sources'
                  ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
                  : 'text-[#6b6456] hover:text-[#1c1f24]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Nguồn ({sourcesCount})
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
                activeTab === 'admin'
                  ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
                  : 'text-[#6b6456] hover:text-[#1c1f24]'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-emerald-600" /> Admin Health
            </button>
          </div>

          {/* Top Actions with Minimum Touch Target (44x44px on mobile) */}
          <div className="flex shrink-0 items-center gap-1.5 font-sans sm:gap-2">
            <button
              onClick={onOpenExplanation}
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg border border-[#e2dcd0] text-[#756e60] transition hover:bg-[#eee9df] hover:text-[#1c1f24]"
              title="Tìm hiểu về Điểm AI & Radar Tech Stack"
              aria-label="Về Điểm AI & Radar"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <button
              onClick={onCrawlAll}
              disabled={crawlingAll}
              className="flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg bg-[#2c313a] px-3 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-[#1a1d23] disabled:opacity-50 sm:px-3.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${crawlingAll ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {crawlingAll ? 'Đang cập nhật...' : 'Cập nhật tin mới'}
              </span>
              <span className="sm:hidden">{crawlingAll ? 'Đang cào' : 'Cập nhật'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs - Optimized for iPhone 15 Pro (393px width, min touch target 44px) */}
        <nav
          aria-label="Điều hướng chính"
          className="no-scrollbar mt-2 flex items-center justify-between gap-1 overflow-x-auto border-t border-[#e7e2d9]/70 pt-1.5 font-sans text-[11px] md:hidden"
        >
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex min-h-[44px] flex-1 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-2 text-center font-medium transition ${
              activeTab === 'feed'
                ? 'bg-[#eee9df] font-bold text-[#1c1f24] shadow-2xs'
                : 'text-[#6b6456] hover:bg-[#f4efe6]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span>Bài đọc</span>
          </button>
          <button
            onClick={() => setActiveTab('semantic')}
            className={`flex min-h-[44px] flex-1 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-2 text-center font-medium transition ${
              activeTab === 'semantic'
                ? 'bg-[#eee9df] font-bold text-[#1c1f24] shadow-2xs'
                : 'text-[#6b6456] hover:bg-[#f4efe6]'
            }`}
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
            <span>Search</span>
          </button>
          <button
            onClick={() => setActiveTab('personalized')}
            className={`flex min-h-[44px] flex-1 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-2 text-center font-medium transition ${
              activeTab === 'personalized'
                ? 'bg-[#eee9df] font-bold text-[#1c1f24] shadow-2xs'
                : 'text-[#6b6456] hover:bg-[#f4efe6]'
            }`}
          >
            <Compass className="h-3.5 w-3.5 shrink-0 text-rose-500" />
            <span>Gợi ý</span>
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`flex min-h-[44px] flex-1 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-2 text-center font-medium transition ${
              activeTab === 'radar'
                ? 'bg-[#eee9df] font-bold text-[#1c1f24] shadow-2xs'
                : 'text-[#6b6456] hover:bg-[#f4efe6]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>Radar</span>
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`flex min-h-[44px] flex-1 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-2 text-center font-medium transition ${
              activeTab === 'sources'
                ? 'bg-[#eee9df] font-bold text-[#1c1f24] shadow-2xs'
                : 'text-[#6b6456] hover:bg-[#f4efe6]'
            }`}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span>Nguồn</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex min-h-[44px] flex-1 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-2 text-center font-medium transition ${
              activeTab === 'admin'
                ? 'bg-[#eee9df] font-bold text-[#1c1f24] shadow-2xs'
                : 'text-[#6b6456] hover:bg-[#f4efe6]'
            }`}
          >
            <Activity className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span>Admin</span>
          </button>
        </nav>
      </header>

      {/* Pull-To-Refresh Indicator */}
      {(pullDistance > 0 || crawlingAll) && activeTab === 'feed' && (
        <div
          style={{ height: `${crawlingAll ? 48 : pullDistance}px` }}
          className="flex items-center justify-center overflow-hidden transition-all duration-200"
        >
          <div className="flex items-center gap-2 rounded-full border border-[#ded7ca] bg-white px-3.5 py-1.5 font-sans text-xs font-medium text-[#2c313a] shadow-xs">
            {crawlingAll ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#4b5563]" />
                <span>Đang cào & cập nhật bài mới từ các nguồn...</span>
              </>
            ) : pullDistance >= 60 ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
                <span>Thả tay để kích hoạt cào bài mới ngay</span>
              </>
            ) : (
              <>
                <ArrowDown className="h-3.5 w-3.5 text-[#8c8475]" />
                <span>Kéo xuống để cập nhật tin mới</span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
