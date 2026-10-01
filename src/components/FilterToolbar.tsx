import React from 'react';
import { Flame, Search, Bookmark, Layers, ArrowUpDown, Eye, EyeOff, X } from 'lucide-react';
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
  return (
    <div className="mb-5 space-y-2.5 border-b border-[#e7e2d9] pb-3.5 font-sans">
      {/* Row 1: Categories scrollable full-bleed & Search full-width on mobile */}
      <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar -mx-3 flex items-center gap-1.5 overflow-x-auto px-3 pb-0.5 sm:mx-0 sm:px-0">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'AI', label: 'Trí tuệ nhân tạo (AI)' },
            { id: 'Backend', label: 'Backend & Kiến trúc' },
            { id: 'Vietnam', label: 'Tin Việt Nam' },
            { id: 'Global', label: 'Báo Quốc tế' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === tab.id
                  ? 'bg-[#2c313a] text-white shadow-xs'
                  : 'bg-[#eee9df] text-[#554e42] hover:bg-[#e4ded2]'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={() => setTopOnly(!topOnly)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs whitespace-nowrap transition ${
              topOnly
                ? 'border-amber-300 bg-amber-100 font-semibold text-amber-900 shadow-xs'
                : 'border-[#dcd5c7] bg-transparent text-[#6b6456] hover:bg-[#eee9df]'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-amber-600" />
            <span>Bài tinh tuyển (≥7.5)</span>
          </button>
        </div>

        {/* Search Box - Full width on mobile, fixed width on tablet/desktop */}
        <div className="relative w-full sm:w-60 sm:shrink-0">
          <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-[#8c8475]" />
          <input
            type="text"
            placeholder="Tìm chủ đề, công nghệ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
            className="w-full rounded-full border border-[#dcd5c7] bg-white py-1.5 pr-4 pl-8.5 text-xs text-[#2c313a] placeholder-[#9c9485] focus:border-[#7c7465] focus:outline-none"
          />
        </div>
      </div>

      {/* Row 2: Read Status Segmented Control (Full width on mobile) */}
      <div className="flex w-full items-center rounded-lg border border-[#e2dcd0] bg-[#eee9df]/80 p-0.5 text-xs">
        <button
          onClick={() => {
            setViewHidden(false);
            setBookmarkedOnly(false);
            setReadStatus('all');
          }}
          className={`flex-1 cursor-pointer rounded py-1.5 text-center transition ${
            !viewHidden && !bookmarkedOnly && readStatus === 'all'
              ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
              : 'text-[#6b6456] hover:text-[#1c1f24]'
          }`}
        >
          Tất cả bài
        </button>
        <button
          onClick={() => {
            setViewHidden(false);
            setBookmarkedOnly(false);
            setReadStatus('unread');
          }}
          className={`flex-1 cursor-pointer rounded py-1.5 text-center transition ${
            !viewHidden && !bookmarkedOnly && readStatus === 'unread'
              ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
              : 'text-[#6b6456] hover:text-[#1c1f24]'
          }`}
        >
          Chưa đọc
        </button>
        <button
          onClick={() => {
            setViewHidden(false);
            setBookmarkedOnly(false);
            setReadStatus('read');
          }}
          className={`flex-1 cursor-pointer rounded py-1.5 text-center transition ${
            !viewHidden && !bookmarkedOnly && readStatus === 'read'
              ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
              : 'text-[#6b6456] hover:text-[#1c1f24]'
          }`}
        >
          Đã đọc
        </button>
        <button
          onClick={() => {
            setViewHidden(false);
            setBookmarkedOnly(true);
          }}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-1 rounded py-1.5 text-center transition ${
            !viewHidden && bookmarkedOnly
              ? 'bg-amber-100 font-semibold text-amber-900 shadow-xs'
              : 'text-[#6b6456] hover:text-[#1c1f24]'
          }`}
        >
          <Bookmark
            className="h-3 w-3 text-amber-700"
            fill={bookmarkedOnly ? 'currentColor' : 'none'}
          />
          <span>Đã lưu</span>
        </button>
      </div>

      {/* Row 3: Secondary Filters Grid (Fit 100% width on mobile) */}
      <div className="grid grid-cols-2 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:pt-0.5">
        {/* Source Selector Dropdown */}
        <div className="col-span-1 flex items-center rounded-lg border border-[#ded7ca] bg-white px-2 py-1 text-[#6b6456]">
          <Layers className="mr-1.5 h-3.5 w-3.5 shrink-0 text-[#8c8475]" />
          <select
            value={selectedSourceId || ''}
            onChange={(e) => setSelectedSourceId(e.target.value ? Number(e.target.value) : null)}
            className="w-full cursor-pointer bg-transparent text-xs font-medium text-[#2c313a] focus:outline-none"
          >
            <option value="">Tất cả nguồn ({sources.length})</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.articles_count || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="col-span-1 flex items-center rounded-lg border border-[#ded7ca] bg-white px-2 py-1 text-[#6b6456]">
          <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 shrink-0 text-[#8c8475]" />
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="w-full cursor-pointer bg-transparent text-xs font-medium text-[#2c313a] focus:outline-none"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="score">Điểm AI cao</option>
          </select>
        </div>

        {/* Group Duplicates Toggle */}
        <button
          onClick={() => setGroupDuplicates(!groupDuplicates)}
          className={`col-span-1 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-center transition sm:py-1 ${
            groupDuplicates
              ? 'border-indigo-200 bg-indigo-50/80 font-medium text-indigo-900 shadow-xs'
              : 'border-[#ded7ca] bg-white text-[#6b6456] hover:bg-[#eee9df]'
          }`}
          title={
            groupDuplicates
              ? 'Đang gộp bài viết trùng từ nhiều báo khác nhau'
              : 'Đang hiển thị dạng phẳng (không gộp tin trùng)'
          }
        >
          <Layers className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
          <span className="truncate">{groupDuplicates ? 'Gộp tin trùng' : 'Hiện tất cả'}</span>
        </button>

        {/* View Hidden Toggle */}
        <button
          onClick={() => setViewHidden(!viewHidden)}
          className={`col-span-1 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-center transition sm:py-1 ${
            viewHidden
              ? 'border-rose-300 bg-rose-50 font-semibold text-rose-800 shadow-xs'
              : 'border-[#ded7ca] bg-white text-[#6b6456] hover:bg-[#eee9df]'
          }`}
          title={viewHidden ? 'Quay lại bản tin bình thường' : 'Xem danh sách bài bạn đã ẩn'}
        >
          {viewHidden ? (
            <>
              <Eye className="h-3.5 w-3.5 shrink-0 text-rose-700" />
              <span className="truncate">Xem bài ẩn</span>
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5 shrink-0 text-[#8c8475]" />
              <span className="truncate">Bài đã ẩn</span>
            </>
          )}
        </button>
      </div>

      {/* Active Source Filter Tag */}
      {selectedSourceId && (
        <div className="flex items-center gap-2 pt-1 font-sans">
          <span className="text-xs text-[#756e60]">Đang lọc theo:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-0.5 text-xs font-semibold text-indigo-900 shadow-xs">
            {sources.find((s) => s.id === selectedSourceId)?.name || 'Nguồn tin'}
            <button
              onClick={() => setSelectedSourceId(null)}
              className="cursor-pointer rounded-full p-0.5 hover:bg-indigo-200 hover:text-indigo-950"
              title="Bỏ lọc theo nguồn này"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}
    </div>
  );
};
