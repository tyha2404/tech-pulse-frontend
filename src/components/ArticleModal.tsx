import React, { Suspense, lazy } from 'react';
import { X, Bookmark, Eye, EyeOff, RefreshCw, Download } from 'lucide-react';
import type { Article } from '../types';
import { generateArticleMarkdown, downloadMarkdownFile } from '../utils/markdownExport';
import { exportArticleMarkdown } from '../api';
import { scoreTier } from '../utils/score';

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

  const tier = scoreTier(article.relevance_score);
  const title = article.vietnamese_title || article.title;
  const headerButton =
    'flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium transition-colors sm:px-3';

  return (
    <div
      onClick={onClose}
      className="bg-ink-deep/50 fixed inset-0 z-50 flex items-end justify-center p-0 backdrop-blur-xs sm:items-center sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-paper shadow-ink/20 flex h-[100dvh] w-full max-w-3xl cursor-default flex-col overflow-hidden shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
      >
        <div
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.75rem)' }}
          className="border-rule bg-surface shrink-0 border-b px-4 pb-4 sm:px-7 sm:pt-5"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onToggleBookmark(article.id, article.is_bookmarked)}
                aria-pressed={article.is_bookmarked}
                className={`${headerButton} ${
                  article.is_bookmarked
                    ? 'text-ochre-700'
                    : 'text-muted hover:bg-wash hover:text-ink'
                }`}
              >
                <Bookmark
                  className="h-[18px] w-[18px]"
                  fill={article.is_bookmarked ? 'currentColor' : 'none'}
                />
                {article.is_bookmarked ? 'Đã lưu' : 'Lưu'}
              </button>
              <button
                onClick={handleQuickExport}
                title="Tải file Markdown cho Obsidian"
                className={`${headerButton} text-muted hover:bg-wash hover:text-ink`}
              >
                <Download className="h-[18px] w-[18px]" />
                Markdown
              </button>
              <button
                onClick={() => onToggleHidden(article.id, article.is_hidden)}
                className={`${headerButton} text-muted hover:bg-wash hover:text-ink`}
              >
                {article.is_hidden ? (
                  <Eye className="h-[18px] w-[18px]" />
                ) : (
                  <EyeOff className="h-[18px] w-[18px]" />
                )}
                {article.is_hidden ? 'Hiện lại' : 'Ẩn'}
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:bg-wash hover:text-ink -mr-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-colors"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4">
            <div
              className={`score-numeral pt-0.5 leading-none ${
                tier === 'high'
                  ? 'text-signal-700 text-[34px] font-bold'
                  : tier === 'mid'
                    ? 'text-ink-2 text-[28px] font-semibold'
                    : 'text-muted text-[22px] font-medium'
              }`}
            >
              <span aria-hidden="true">
                {tier === 'none' ? '–' : article.relevance_score.toFixed(1)}
              </span>
              <span className="sr-only">
                {tier === 'none'
                  ? 'Chưa chấm điểm'
                  : `Điểm AI ${article.relevance_score.toFixed(1)} trên 10`}
              </span>
            </div>
            <div className="min-w-0">
              <h2
                id="article-modal-title"
                className="text-ink text-[19px] leading-snug font-semibold tracking-[-0.01em] text-pretty break-words sm:text-[22px]"
              >
                {title}
              </h2>
              <p className="text-muted mt-1.5 text-[13px]">
                <span className="text-ink-2 font-medium">{article.source_name}</span>
                {article.reading_time_minutes ? ` · ${article.reading_time_minutes} phút đọc` : ''}
              </p>
            </div>
          </div>
        </div>

        <div
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)' }}
          className="ios-scroll flex-1 overflow-y-auto overscroll-contain"
        >
          <Suspense
            fallback={
              <div
                role="status"
                className="text-muted flex h-64 items-center justify-center gap-2 text-[14px]"
              >
                <RefreshCw className="h-4 w-4 animate-spin" />
                Đang tải phân tích…
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
