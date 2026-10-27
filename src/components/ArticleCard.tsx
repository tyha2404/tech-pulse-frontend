import React, { useEffect, useRef, useState } from 'react';
import {
  IconBookmark,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconMore,
  IconThumbsDown,
  IconThumbsUp,
} from './icons';
import type { Article } from '../types';
import { generateArticleMarkdown, downloadMarkdownFile } from '../utils/markdownExport';
import { scoreTier } from '../utils/score';
import { ScoreBadge } from './ScoreBadge';

interface ArticleCardProps {
  article: Article;
  onOpen: (article: Article) => void;
  onFeedback: (e: React.MouseEvent, articleId: number, type: 'like' | 'dislike') => void;
  feedbackState?: string;
  onToggleBookmark: (articleId: number, currentBookmarked: boolean, e: React.MouseEvent) => void;
  onToggleHidden: (articleId: number, currentHidden: boolean, e: React.MouseEvent) => void;
  onFilterSource?: (sourceId: number) => void;
}

const iconButton =
  'relative z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors';

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
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const tier = scoreTier(article.relevance_score);
    const title = article.vietnamese_title || article.title;

    useEffect(() => {
      if (!menuOpen) return;
      const close = (e: MouseEvent | KeyboardEvent) => {
        if (
          e instanceof KeyboardEvent
            ? e.key === 'Escape'
            : !menuRef.current?.contains(e.target as Node)
        )
          setMenuOpen(false);
      };
      document.addEventListener('mousedown', close);
      document.addEventListener('keydown', close);
      return () => {
        document.removeEventListener('mousedown', close);
        document.removeEventListener('keydown', close);
      };
    }, [menuOpen]);

    const publishedTime = article.published_at
      ? new Date(article.published_at).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    return (
      <article
        className={`group relative py-5 ${article.is_read ? 'opacity-75 hover:opacity-100' : ''}`}
      >
        <div className="min-w-0">
          <h2
            className={`text-[17px] leading-snug font-semibold tracking-[-0.01em] text-pretty break-words sm:text-[19px] ${
              article.is_read ? 'text-muted' : 'text-ink'
            }`}
          >
            {/* Stretched button: the whole item opens the article, other controls sit above it */}
            <button
              onClick={() => onOpen(article)}
              className="group-hover:decoration-rule-strong focus-visible:after:outline-accent-600 cursor-pointer text-left group-hover:underline group-hover:underline-offset-4 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:outline-2"
            >
              {title}
            </button>
          </h2>

          {article.vietnamese_summary && (
            <p className="reading-font text-ink-2 mt-1.5 line-clamp-3 text-[15px] leading-[1.6]">
              {article.vietnamese_summary}
            </p>
          )}

          {tier === 'high' && article.key_takeaways?.length > 0 && (
            <ul className="reading-font border-signal-200 text-ink-2 mt-3 space-y-1 border-l-2 pl-3 text-[14px] leading-[1.55]">
              {article.key_takeaways.slice(0, 3).map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          )}

          {article.related_articles && article.related_articles.length > 0 && (
            <p className="text-muted mt-2.5 text-[13px]">
              Cũng đưa tin:{' '}
              {article.related_articles.map((rel, i) => (
                <React.Fragment key={rel.id}>
                  {i > 0 && ', '}
                  <a
                    href={rel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={rel.vietnamese_title || rel.title}
                    className="text-ink-2 decoration-rule-strong hover:text-accent-700 hover:decoration-accent-300 relative z-10 font-medium underline underline-offset-2"
                  >
                    {rel.source_name || 'Nguồn khác'}
                  </a>
                </React.Fragment>
              ))}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-muted flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
              <ScoreBadge score={article.relevance_score} />
              {article.source_id && onFilterSource ? (
                <button
                  onClick={() => onFilterSource(article.source_id!)}
                  title={`Chỉ xem bài từ ${article.source_name || 'nguồn này'}`}
                  className="text-ink-2 hover:text-accent-700 relative z-10 max-w-full cursor-pointer truncate text-left font-medium hover:underline"
                >
                  {article.source_name || 'Bản tin'}
                </button>
              ) : (
                <span className="text-ink-2 font-medium">{article.source_name || 'Bản tin'}</span>
              )}
              {publishedTime && <span>{publishedTime}</span>}
              <span>{article.reading_time_minutes || 1} phút đọc</span>
              {article.is_read && <span>Đã đọc</span>}
            </div>

            <div className="-mr-2 flex shrink-0 items-center">
              <button
                onClick={(e) => onToggleBookmark(article.id, article.is_bookmarked, e)}
                className={`${iconButton} ${
                  article.is_bookmarked
                    ? 'text-ochre-600'
                    : 'text-faint hover:bg-wash hover:text-ink'
                }`}
                aria-pressed={article.is_bookmarked}
                aria-label={article.is_bookmarked ? 'Bỏ lưu' : 'Lưu để đọc sau'}
                title={article.is_bookmarked ? 'Bỏ lưu' : 'Lưu để đọc sau'}
              >
                <IconBookmark
                  className="h-[18px] w-[18px]"
                  fill={article.is_bookmarked ? 'currentColor' : 'none'}
                />
              </button>
              <button
                onClick={(e) => onFeedback(e, article.id, 'like')}
                className={`${iconButton} ${
                  feedbackState === 'like'
                    ? 'text-signal-700'
                    : 'text-faint hover:bg-wash hover:text-ink'
                }`}
                aria-pressed={feedbackState === 'like'}
                aria-label="Bài hữu ích"
                title="Bài hữu ích: gợi ý thêm bài tương tự"
              >
                <IconThumbsUp
                  className="h-[18px] w-[18px]"
                  fill={feedbackState === 'like' ? 'currentColor' : 'none'}
                />
              </button>
              <button
                onClick={(e) => onFeedback(e, article.id, 'dislike')}
                className={`${iconButton} ${
                  feedbackState === 'dislike'
                    ? 'text-danger-600'
                    : 'text-faint hover:bg-wash hover:text-ink'
                }`}
                aria-pressed={feedbackState === 'dislike'}
                aria-label="Bài không liên quan"
                title="Bài không liên quan: bớt gợi ý bài tương tự"
              >
                <IconThumbsDown
                  className="h-[18px] w-[18px]"
                  fill={feedbackState === 'dislike' ? 'currentColor' : 'none'}
                />
              </button>

              <div ref={menuRef} className="relative z-10">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Thao tác khác"
                  className={`${iconButton} text-faint hover:bg-wash hover:text-ink ${menuOpen ? 'bg-wash text-ink' : ''}`}
                >
                  <IconMore className="h-[18px] w-[18px]" />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="border-rule bg-surface shadow-ink/10 absolute right-0 bottom-full mb-1 w-56 overflow-hidden rounded-xl border py-1 text-[14px] shadow-lg"
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        downloadMarkdownFile(title, generateArticleMarkdown(article));
                        setMenuOpen(false);
                      }}
                      className="text-ink hover:bg-wash flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left"
                    >
                      <IconDownload className="text-muted h-4 w-4" /> Tải Markdown (Obsidian)
                    </button>
                    <button
                      role="menuitem"
                      onClick={(e) => {
                        setMenuOpen(false);
                        onToggleHidden(article.id, article.is_hidden, e);
                      }}
                      className="text-ink hover:bg-wash flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left"
                    >
                      {article.is_hidden ? (
                        <>
                          <IconEye className="text-muted h-4 w-4" /> Hiện lại bài này
                        </>
                      ) : (
                        <>
                          <IconEyeOff className="text-muted h-4 w-4" /> Ẩn bài này
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }
);

ArticleCard.displayName = 'ArticleCard';
