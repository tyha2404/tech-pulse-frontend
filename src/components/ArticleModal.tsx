import React, { Suspense, lazy } from 'react';
import { X, Bookmark, Eye, EyeOff, Sparkles, Download } from 'lucide-react';
import type { Article } from '../types';
import { generateArticleMarkdown, downloadMarkdownFile } from '../utils/markdownExport';
import { exportArticleMarkdown } from '../api';

const ArticleModalTabs = lazy(() =>
  import('./ArticleModalTabs').then((m) => ({ default: m.ArticleModalTabs }))
);

interface ArticleModalProps {
  article: Article;
  onClose: () => void;
  onToggleBookmark: (articleId: number, currentBookmarked: boolean) => void;
  onToggleHidden: (articleId: number, currentHidden: boolean) => void;
  onSummarize: (articleId: number) => Promise<void>;
  summarizing: boolean;
  onSelectRelatedArticle: (articleId: number) => void;
  onArticleUpdated: (updated: Article) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  onToggleBookmark,
  onToggleHidden,
  onSummarize,
  summarizing,
  onSelectRelatedArticle,
  onArticleUpdated,
}) => {
  const handleQuickExport = async () => {
    try {
      let md = '';
      try {
        md = await exportArticleMarkdown(article.id);
      } catch {
        md = generateArticleMarkdown(article);
      }
      downloadMarkdownFile(article.vietnamese_title || article.title, md);
    } catch {
      downloadMarkdownFile(
        article.vietnamese_title || article.title,
        generateArticleMarkdown(article)
      );
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex cursor-pointer items-end justify-center bg-black/60 p-0 backdrop-blur-xs sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-bottom-0 flex h-[100dvh] w-full max-w-4xl cursor-default flex-col overflow-hidden rounded-t-2xl border-0 border-[#e7e2d9] bg-[#fbf9f5] shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border"
      >
        {/* Masthead Header with iPhone 15 Pro Dynamic Island Safe Area Top */}
        <div
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.75rem)' }}
          className="flex shrink-0 items-start justify-between gap-2.5 border-b border-[#e7e2d9] bg-white px-3.5 pb-3 sm:px-6 sm:pb-4"
        >
          <div className="min-w-0 flex-1 pr-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5 font-sans">
              <span className="rounded bg-[#f4efe6] px-2 py-0.5 text-[10px] font-semibold text-[#635d52] sm:text-[11px]">
                {article.source_name}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold sm:text-[11px] ${
                  article.relevance_score >= 8.0
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : article.relevance_score >= 6.0
                      ? 'border border-amber-200 bg-amber-50 text-amber-800'
                      : 'bg-stone-100 text-stone-600'
                }`}
              >
                Điểm AI: {article.relevance_score.toFixed(1)}/10
              </span>
            </div>
            <h2 className="font-serif text-base leading-snug font-bold break-words text-[#1c1f24] sm:text-xl">
              {article.vietnamese_title || article.title}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-1 font-sans sm:gap-1.5">
            {/* Quick Export Markdown button in header */}
            <button
              onClick={handleQuickExport}
              className="flex min-h-[40px] cursor-pointer items-center gap-1 rounded-lg border border-purple-200 bg-purple-50/70 p-2 text-xs font-medium text-purple-900 transition hover:bg-purple-100 sm:px-2.5 sm:py-1.5"
              title="Xuất bài viết sang file Markdown cho Obsidian"
              aria-label="Xuất file Markdown"
            >
              <Download className="h-4 w-4 text-purple-700" />
              <span className="hidden sm:inline">Xuất Obsidian</span>
            </button>

            {/* Bookmark Button */}
            <button
              onClick={() => onToggleBookmark(article.id, article.is_bookmarked)}
              className={`flex min-h-[40px] cursor-pointer items-center gap-1 rounded-lg border p-2 text-xs font-medium transition sm:px-2.5 sm:py-1.5 ${
                article.is_bookmarked
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-[#ded7ca] bg-white text-[#6b6456] hover:bg-amber-50 hover:text-amber-800'
              }`}
              title={article.is_bookmarked ? 'Bỏ lưu bài này' : 'Lưu bài vào đọc sau'}
              aria-label="Lưu bài viết"
            >
              <Bookmark
                className="h-4 w-4"
                fill={article.is_bookmarked ? 'currentColor' : 'none'}
              />
              <span className="hidden sm:inline">
                {article.is_bookmarked ? 'Đã lưu' : 'Lưu bài'}
              </span>
            </button>

            {/* Hide Button */}
            <button
              onClick={() => onToggleHidden(article.id, article.is_hidden)}
              className={`flex min-h-[40px] cursor-pointer items-center gap-1 rounded-lg border p-2 text-xs font-medium transition sm:px-2.5 sm:py-1.5 ${
                article.is_hidden
                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                  : 'border-[#ded7ca] bg-white text-[#6b6456] hover:bg-rose-50 hover:text-rose-700'
              }`}
              title={article.is_hidden ? 'Bỏ ẩn bài này' : 'Ẩn bài viết này'}
              aria-label="Ẩn bài viết"
            >
              {article.is_hidden ? (
                <>
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Bỏ ẩn</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span className="hidden sm:inline">Ẩn bài</span>
                </>
              )}
            </button>

            {/* Close Button - 44x44px touch target */}
            <button
              onClick={onClose}
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg text-[#756e60] transition hover:bg-[#f4efe6] hover:text-[#1c1f24]"
              title="Đóng trang đọc"
              aria-label="Đóng modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Reading Content with Modernized Tabs - iOS Momentum Scrolling and Home Indicator Safe Area */}
        <div
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)' }}
          className="ios-scroll flex-1 overflow-y-auto overscroll-contain"
        >
          <Suspense
            fallback={
              <div className="flex h-64 items-center justify-center p-8 text-sm text-[#756e60]">
                <Sparkles className="mr-2 h-5 w-5 animate-spin text-amber-600" />
                Đang tải chi tiết phân tích AI & kịch bản kỹ thuật...
              </div>
            }
          >
            <ArticleModalTabs
              article={article}
              onSummarize={onSummarize}
              summarizing={summarizing}
              onSelectRelatedArticle={onSelectRelatedArticle}
              onArticleUpdated={onArticleUpdated}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};
