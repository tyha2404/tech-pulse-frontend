import React, { useId, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
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

  // Filters living in the panel, shown as removable chips when active
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
          className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0"
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

        <div className="flex items-center gap-2">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
            className="relative min-w-0 flex-1 md:w-60 md:flex-none"
          >
            <Search className="text-muted pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
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
          <button
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
            aria-controls={panelId}
            className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors md:h-9 ${
              panelOpen || activeChips.length
                ? 'border-ink text-ink'
                : 'border-rule text-ink-2 hover:bg-wash'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
            {activeChips.length > 0 && (
              <span className="score-numeral bg-primary flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white">
                {activeChips.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {panelOpen && (
        <div
          id={panelId}
          className="border-rule bg-surface grid gap-4 rounded-2xl border p-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-x-6"
        >
          <span className="text-muted text-[13px] font-medium">Trạng thái</span>
          <div
            role="radiogroup"
            aria-label="Trạng thái bài"
            className="no-scrollbar -mt-2 flex gap-1 overflow-x-auto sm:mt-0"
          >
            {VIEWS.map((v) => (
              <button
                key={v.id}
                role="radio"
                aria-checked={view === v.id}
                onClick={() => setView(v.id)}
                className={`${chipBase} h-8 px-3 ${
                  view === v.id
                    ? 'bg-primary font-semibold text-white'
                    : 'text-ink-2 hover:bg-wash font-medium'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <label htmlFor={`${panelId}-src`} className="text-muted text-[13px] font-medium">
            Nguồn
          </label>
          <select
            id={`${panelId}-src`}
            value={selectedSourceId || ''}
            onChange={(e) => setSelectedSourceId(e.target.value ? Number(e.target.value) : null)}
            className="border-rule bg-surface text-ink -mt-2 h-10 w-full cursor-pointer rounded-lg border px-3 text-[16px] sm:mt-0 sm:max-w-xs sm:text-[13px]"
          >
            <option value="">Tất cả {sources.length} nguồn</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.articles_count || 0})
              </option>
            ))}
          </select>

          <label htmlFor={`${panelId}-sort`} className="text-muted text-[13px] font-medium">
            Sắp xếp
          </label>
          <select
            id={`${panelId}-sort`}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'score')}
            className="border-rule bg-surface text-ink -mt-2 h-10 w-full cursor-pointer rounded-lg border px-3 text-[16px] sm:mt-0 sm:max-w-xs sm:text-[13px]"
          >
            {Object.entries(SORT_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>

          <span className="text-muted text-[13px] font-medium">Tin trùng</span>
          <label className="text-ink-2 -mt-2 flex cursor-pointer items-center gap-3 text-[13px] sm:mt-0">
            <input
              type="checkbox"
              checked={groupDuplicates}
              onChange={(e) => setGroupDuplicates(e.target.checked)}
              className="accent-ink h-4 w-4 cursor-pointer"
            />
            Gộp bài cùng chủ đề từ nhiều báo thành một
          </label>
        </div>
      )}

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
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
