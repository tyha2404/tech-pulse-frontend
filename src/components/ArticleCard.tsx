import React from 'react';
import {
  Clock,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Eye,
  EyeOff,
  Sparkles,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import type { Article } from '../types';
import { generateArticleMarkdown, downloadMarkdownFile } from '../utils/markdownExport';

interface ArticleCardProps {
  article: Article;
  onOpen: (article: Article) => void;
  onFeedback: (e: React.MouseEvent, articleId: number, type: 'like' | 'dislike') => void;
  feedbackState?: string;
  onToggleBookmark: (articleId: number, currentBookmarked: boolean, e: React.MouseEvent) => void;
  onToggleHidden: (articleId: number, currentHidden: boolean, e: React.MouseEvent) => void;
  onFilterSource?: (sourceId: number) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = React.memo(
  ({
    article,
    onOpen,
    onFeedback,
    feedbackState,
    onToggleBookmark,
    onToggleHidden,
    onFilterSource,
  }) => {
    const handleQuickExport = (e: React.MouseEvent) => {
      e.stopPropagation();
      const md = generateArticleMarkdown(article);
      downloadMarkdownFile(article.vietnamese_title || article.title, md);
    };

    return (
      <article
        onClick={() => onOpen(article)}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 shadow-xs transition sm:p-6 ${
          article.is_read
            ? 'border-[#ede7dc] bg-[#faf8f4] opacity-80 hover:border-[#cfc7b8] hover:opacity-100'
            : 'border-[#e7e2d9] bg-white hover:border-[#cfc7b8] hover:bg-[#fcfbf9]'
        }`}
      >
        {/* Header meta - Mobile Friendly */}
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 font-sans">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span
              onClick={(e) => {
                if (article.source_id && onFilterSource) {
                  e.stopPropagation();
                  onFilterSource(article.source_id);
                }
              }}
              className="cursor-pointer rounded-md bg-[#f4efe6] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[#756e60] uppercase transition hover:bg-[#e7e1d5] hover:text-[#1c1f24]"
              title={`Bấm để chỉ xem các bài từ ${article.source_name || 'nguồn này'}`}
            >
              {article.source_name || 'Bản tin'}
            </span>
            <span className="text-[11px] text-[#8c8475]">
              {article.published_at
                ? new Date(article.published_at).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Mới cập nhật'}
            </span>
            <span className="text-[11px] text-[#a8a193]">·</span>
            <span className="flex items-center gap-0.5 text-[11px] text-[#8c8475]">
              <Clock className="inline h-3 w-3 shrink-0" />{' '}
              {article.reading_time_minutes ||
                Math.max(1, Math.ceil((article.vietnamese_summary?.length || 300) / 350))}{' '}
              phút
            </span>
          </div>

          <div className="flex items-center gap-1">
            {article.relevance_score > 0 && (
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  article.relevance_score >= 8.0
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : article.relevance_score >= 6.0
                      ? 'border border-amber-200 bg-amber-50 text-amber-800'
                      : 'bg-stone-100 text-stone-600'
                }`}
              >
                {article.relevance_score.toFixed(1)}/10
              </span>
            )}

            {/* Quick Feedback Actions (Min touch target 38x38px on mobile) */}
            <button
              onClick={(e) => onFeedback(e, article.id, 'like')}
              className={`flex min-h-[38px] min-w-[38px] cursor-pointer items-center justify-center rounded-lg transition ${
                feedbackState === 'like'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'text-[#8c8475] hover:bg-emerald-50 hover:text-emerald-700'
              }`}
              title="Đánh giá bài viết hay"
              aria-label="Thích bài viết"
            >
              <ThumbsUp className="h-4 w-4" />
            </button>

            <button
              onClick={(e) => onFeedback(e, article.id, 'dislike')}
              className={`flex min-h-[38px] min-w-[38px] cursor-pointer items-center justify-center rounded-lg transition ${
                feedbackState === 'dislike'
                  ? 'bg-rose-100 text-rose-800'
                  : 'text-[#8c8475] hover:bg-rose-50 hover:text-rose-700'
              }`}
              title="Bài viết không liên quan"
              aria-label="Không thích bài viết"
            >
              <ThumbsDown className="h-4 w-4" />
            </button>

            {/* Quick action: Bookmark */}
            <button
              onClick={(e) => onToggleBookmark(article.id, article.is_bookmarked, e)}
              className={`flex min-h-[38px] min-w-[38px] cursor-pointer items-center justify-center rounded-lg transition ${
                article.is_bookmarked
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'text-[#8c8475] hover:bg-amber-50 hover:text-amber-700'
              }`}
              title={article.is_bookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết vào đọc sau'}
              aria-label="Lưu bài viết"
            >
              <Bookmark
                className="h-4 w-4"
                fill={article.is_bookmarked ? 'currentColor' : 'none'}
              />
            </button>

            {/* Quick action: Export Markdown */}
            <button
              onClick={handleQuickExport}
              className="flex min-h-[38px] min-w-[38px] cursor-pointer items-center justify-center rounded-lg text-[#8c8475] transition hover:bg-purple-50 hover:text-purple-700"
              title="Xuất file Markdown cho Obsidian"
              aria-label="Xuất file Markdown"
            >
              <Download className="h-4 w-4" />
            </button>

            {/* Quick action: Hide / Unhide */}
            <button
              onClick={(e) => onToggleHidden(article.id, article.is_hidden, e)}
              className={`flex min-h-[38px] min-w-[38px] cursor-pointer items-center justify-center rounded-lg transition ${
                article.is_hidden
                  ? 'text-rose-700 hover:bg-rose-100'
                  : 'text-[#8c8475] hover:bg-rose-50 hover:text-rose-600'
              }`}
              title={article.is_hidden ? 'Bỏ ẩn bài viết này' : 'Không thích / Ẩn bài viết'}
              aria-label="Ẩn bài viết"
            >
              {article.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Article Title */}
        <h2
          className={`mb-2 font-serif text-base leading-snug font-bold break-words transition sm:text-lg md:text-xl ${
            article.is_read
              ? 'text-[#474e5a] group-hover:text-indigo-950'
              : 'text-[#1a1d20] group-hover:text-indigo-950'
          }`}
        >
          {article.vietnamese_title || article.title}
        </h2>

        {/* Editorial Summary */}
        <p
          className={`mb-3 font-serif text-[13px] leading-relaxed break-words sm:text-[14px] ${
            article.is_read ? 'text-[#646a75]' : 'text-[#4a4f59]'
          }`}
        >
          {article.vietnamese_summary || article.title}
        </p>

        {/* Key Takeaways Preview (3 bullet points) */}
        {article.key_takeaways && article.key_takeaways.length > 0 && (
          <div className="mb-3 rounded-xl border border-[#eee8dd] bg-[#faf8f5] p-3 text-xs">
            <div className="mb-1.5 flex items-center gap-1 font-sans text-[10px] font-bold tracking-wider text-[#635c50] uppercase">
              <Sparkles className="h-3 w-3 text-amber-600" /> Điểm cốt lõi kỹ thuật:
            </div>
            <ul className="space-y-1 font-serif text-[#3f4651]">
              {article.key_takeaways.slice(0, 3).map((point, pIdx) => (
                <li key={pIdx} className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-700">•</span>
                  <span className="break-words">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Story Cluster Coverage Badges (Google News Style) */}
        {article.related_articles && article.related_articles.length > 0 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mb-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-2.5 text-xs"
          >
            <div className="flex flex-wrap items-center gap-1.5 font-sans">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-900">
                📰 Cùng chủ đề trên {article.related_articles.length} báo khác:
              </span>
              {article.related_articles.map((rel) => (
                <a
                  key={rel.id}
                  href={rel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={rel.vietnamese_title || rel.title}
                  className="inline-flex max-w-[200px] items-center gap-1 truncate rounded border border-indigo-200 bg-white px-2 py-1 text-[11px] font-medium text-indigo-800 shadow-2xs transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-950"
                >
                  <span className="truncate">{rel.source_name || 'Nguồn khác'}</span>
                  <ArrowUpRight className="h-3 w-3 shrink-0 text-indigo-600" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Bottom row: Tech tags & Read CTA */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0ece3] pt-3 font-sans">
          <div className="flex flex-wrap items-center gap-1.5">
            {article.new_tech_stacks &&
              article.new_tech_stacks.length > 0 &&
              article.new_tech_stacks.slice(0, 3).map((ts, idx) => (
                <span
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(article);
                  }}
                  className="rounded-md border border-[#e2dcd0] bg-[#f4f1ea] px-2 py-0.5 font-mono text-[11px] text-[#334155] transition hover:bg-[#e9e4d9]"
                >
                  ⚡ {ts.name}
                </span>
              ))}
          </div>

          <div className="flex items-center gap-2">
            {article.is_read && <span className="text-[11px] text-[#8c8475] italic">Đã đọc</span>}
            <span className="flex items-center gap-1 text-xs font-semibold text-[#2c313a] group-hover:text-indigo-800">
              Mở chi tiết <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </article>
    );
  }
);

ArticleCard.displayName = 'ArticleCard';
