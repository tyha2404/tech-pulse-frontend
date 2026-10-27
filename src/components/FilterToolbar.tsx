import React, { useEffect, useId, useRef, useState } from 'react';
import { IconClose, IconFilter, IconSearch } from './icons';
import { Select } from './Select';
import type { Source } from '../types';

interface FilterToolbarProps {
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  topOnly: boolean;
  setTopOnly: (b: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearchSubmit: () => void;
  readStatus: 'all' | 'unread' | 'read';
  setReadStatus: (s: 'all' | 'unread' | 'read') => void;
  bookmarkedOnly: boolean;
  setBookmarkedOnly: (b: boolean) => void;
  viewHidden: boolean;
  setViewHidden: (b: boolean) => void;
  selectedSourceId: number | null;
  setSelectedSourceId: (id: number | null) => void;
  sources: Source[];
  sortBy: 'newest' | 'oldest' | 'score';
  setSortBy: (s: 'newest' | 'oldest' | 'score') => void;
  groupDuplicates: boolean;
  setGroupDuplicates: (b: boolean) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'AI', label: 'AI' },
  { id: 'Backend', label: 'Backend' },
  { id: 'Vietnam', label: 'Việt Nam' },
  { id: 'Global', label: 'Quốc tế' },
];

type View = 'all' | 'unread' | 'read' | 'saved' | 'hidden';

const VIEWS: { id: View; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'unread', label: 'Chưa đọc' },
  { id: 'read', label: 'Đã đọc' },
  { id: 'saved', label: 'Đã lưu' },
  { id: 'hidden', label: 'Đã ẩn' },
];

const SORT_LABELS = { newest: 'Mới nhất', oldest: 'Cũ nhất', score: 'Điểm cao nhất' } as const;
type SortKey = keyof typeof SORT_LABELS;

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  selectedCategory,
  setSelectedCategory,
  topOnly,
  setTopOnly,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  readStatus,
  setReadStatus,
  bookmarkedOnly,
  setBookmarkedOnly,
  viewHidden,
  setViewHidden,
  selectedSourceId,
  setSelectedSourceId,
  sources,
  sortBy,
  setSortBy,
  groupDuplicates,
  setGroupDuplicates,
}) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const panelId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closePanel = () => {
    setPanelOpen(false);
    triggerRef.current?.focus();
  };

  // Popover: close on outside click, or on Escape (returning focus to the trigger)
  useEffect(() => {
    if (!panelOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) setPanelOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setPanelOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [panelOpen]);

  const view: View = viewHidden
    ? 'hidden'
    : bookmarkedOnly
      ? 'saved'
      : readStatus === 'all'
        ? 'all'
        : readStatus;

  const setView = (next: View) => {
    setViewHidden(next === 'hidden');
    setBookmarkedOnly(next === 'saved');
    setReadStatus(next === 'unread' || next === 'read' ? next : 'all');
  };

  const sourceName = sources.find((s) => s.id === selectedSourceId)?.name;

  // Filters living in the popover, shown as removable chips when active
  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (view !== 'all')
    activeChips.push({
      key: 'view',
      label: VIEWS.find((v) => v.id === view)!.label,
      clear: () => setView('all'),
    });
  if (selectedSourceId)
    activeChips.push({
      key: 'source',
      label: sourceName || 'Một nguồn',
      clear: () => setSelectedSourceId(null),
    });
  if (sortBy !== 'newest')
    activeChips.push({
      key: 'sort',
      label: SORT_LABELS[sortBy],
      clear: () => setSortBy('newest'),
    });
  if (!groupDuplicates)
    activeChips.push({
      key: 'dupes',
      label: 'Không gộp tin trùng',
      clear: () => setGroupDuplicates(true),
    });

  const chipBase =
    'flex h-9 shrink-0 cursor-pointer items-center rounded-full px-3.5 text-[13px] whitespace-nowrap transition-colors';

  return (
    <div className="mb-2 space-y-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div
          role="group"
          aria-label="Chủ đề"
          className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0 xl:shrink-0"
        >
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              aria-pressed={selectedCategory === c.id}
              className={`${chipBase} ${
                selectedCategory === c.id
                  ? 'bg-primary font-semibold text-white'
                  : 'text-ink-2 hover:bg-wash font-medium'
              }`}
            >
              {c.label}
            </button>
          ))}
          <span aria-hidden="true" className="bg-rule mx-1 h-5 w-px shrink-0" />
          <button
            onClick={() => setTopOnly(!topOnly)}
            aria-pressed={topOnly}
            title="Chỉ hiện bài được AI chấm từ 7.5 điểm"
            className={`${chipBase} gap-1.5 border ${
              topOnly
                ? 'border-signal-600 bg-signal-50 text-signal-800 font-semibold'
                : 'border-rule text-ink-2 hover:bg-wash font-medium'
            }`}
          >
            <span className="score-numeral">≥ 7.5 điểm</span>
          </button>
        </div>

        <div className="flex items-center gap-2 xl:min-w-0 xl:flex-1 xl:justify-end">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
            className="relative min-w-0 flex-1 md:w-60 md:flex-none xl:w-auto xl:max-w-60 xl:flex-1"
          >
            <IconSearch className="text-muted pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
            <label className="sr-only" htmlFor={`${panelId}-q`}>
              Tìm trong bản tin
            </label>
            <input
              id={`${panelId}-q`}
              type="search"
              placeholder="Tìm trong tiêu đề…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-rule bg-surface text-ink placeholder:text-faint focus:border-ink-2 h-10 w-full rounded-full border pr-4 pl-10 text-[16px] focus:outline-none md:h-9 md:text-[13px]"
            />
          </form>

          <div ref={popoverRef} className="relative shrink-0">
            <button
              ref={triggerRef}
              onClick={() => setPanelOpen((o) => !o)}
              aria-haspopup="dialog"
              aria-expanded={panelOpen}
              aria-controls={panelId}
              className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors md:h-9 ${
                panelOpen || activeChips.length
                  ? 'border-ink text-ink'
                  : 'border-rule text-ink-2 hover:bg-wash'
              } ${panelOpen ? 'bg-wash' : ''}`}
            >
              <IconFilter className="h-4 w-4" />
              Bộ lọc
              {activeChips.length > 0 && (
                <span className="score-numeral bg-primary flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white">
                  {activeChips.length}
                </span>
              )}
            </button>

            {panelOpen && (
              <div
                id={panelId}
                role="dialog"
                aria-label="Bộ lọc"
                className="border-rule bg-surface shadow-ink/10 absolute top-full right-0 z-40 mt-2 flex max-h-[calc(100dvh-var(--app-header-h)-var(--app-tabbar-h)-8rem)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border shadow-lg"
              >
                <div className="no-scrollbar space-y-4 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <label
                        htmlFor={`${panelId}-view`}
                        className="text-muted mb-1.5 block text-[13px] font-medium"
                      >
                        Trạng thái
                      </label>
                      <Select
                        id={`${panelId}-view`}
                        label="Trạng thái"
                        value={view}
                        onChange={setView}
                        options={VIEWS.map((v) => ({ value: v.id, label: v.label }))}
                      />
                    </div>
                    <div className="min-w-0">
                      <label
                        htmlFor={`${panelId}-sort`}
                        className="text-muted mb-1.5 block text-[13px] font-medium"
                      >
                        Sắp xếp
                      </label>
                      <Select
                        id={`${panelId}-sort`}
                        label="Sắp xếp"
                        value={sortBy}
                        onChange={setSortBy}
                        options={(Object.keys(SORT_LABELS) as SortKey[]).map((id) => ({
                          value: id,
                          label: SORT_LABELS[id],
                        }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`${panelId}-src`}
                      className="text-muted mb-1.5 block text-[13px] font-medium"
                    >
                      Nguồn
                    </label>
                    {/* 0 stands for "every source"; real source ids start at 1 */}
                    <Select
                      id={`${panelId}-src`}
                      label="Nguồn"
                      value={selectedSourceId ?? 0}
                      onChange={(id) => setSelectedSourceId(id || null)}
                      options={[
                        { value: 0, label: `Tất cả ${sources.length} nguồn` },
                        ...sources.map((s) => ({
                          value: s.id,
                          label: s.name,
                          hint: String(s.articles_count || 0),
                        })),
                      ]}
                    />
                  </div>

                  <label className="text-ink-2 flex cursor-pointer items-start gap-3 text-[13px] leading-snug">
                    <input
                      type="checkbox"
                      checked={groupDuplicates}
                      onChange={(e) => setGroupDuplicates(e.target.checked)}
                      className="accent-ink mt-px h-4 w-4 shrink-0 cursor-pointer"
                    />
                    Gộp bài cùng chủ đề từ nhiều báo thành một
                  </label>
                </div>

                <div className="border-rule flex shrink-0 items-center justify-between border-t px-4 py-3">
                  <button
                    onClick={() => activeChips.forEach((chip) => chip.clear())}
                    disabled={activeChips.length === 0}
                    className="text-ink-2 hover:text-ink cursor-pointer text-[13px] font-medium underline-offset-2 hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-40"
                  >
                    Đặt lại
                  </button>
                  <button
                    onClick={closePanel}
                    className="bg-primary hover:bg-primary-hover h-8 cursor-pointer rounded-full px-4 text-[13px] font-semibold text-white transition-colors"
                  >
                    Xong
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="bg-wash text-ink inline-flex h-8 items-center gap-1 rounded-full pr-1 pl-3 text-[13px] font-medium"
            >
              {chip.label}
              <button
                onClick={chip.clear}
                aria-label={`Bỏ lọc: ${chip.label}`}
                className="text-muted hover:bg-wash-strong hover:text-ink flex h-6 w-6 cursor-pointer items-center justify-center rounded-full"
              >
                <IconClose className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
