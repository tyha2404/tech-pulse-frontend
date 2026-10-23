import React, { useState } from 'react';
import { Search, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { primaryButton } from '../utils/ui';
import { scoreTier } from '../utils/score';
import type { Article } from '../types';
import { searchSemanticArticles, sendArticleFeedback } from '../api';

interface SemanticSearchBarProps {
  onSelectArticle: (article: Article) => void;
}

const SUGGESTIONS = [
  'Agent nhiều bước với LLM',
  'Tối ưu truy vấn PostgreSQL',
  'Hàng đợi job trong NestJS',
  'Vector search và RAG',
  'Hệ thống phân tán',
];

export const SemanticSearchBar: React.FC<SemanticSearchBarProps> = ({ onSelectArticle }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Article[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<number, string>>({});

  const runSearch = async (text: string) => {
    if (!text.trim()) return;
    try {
      setLoading(true);
      setSearched(true);
      setError(null);
      setResults(await searchSemanticArticles({ query: text.trim(), limit: 20 }));
    } catch (err) {
      console.error('Semantic search error:', err);
      setError('Không tìm được: backend không phản hồi. Kiểm tra backend rồi thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (articleId: number, type: 'like' | 'dislike') => {
    try {
      setFeedbackMap((prev) => ({ ...prev, [articleId]: type }));
      await sendArticleFeedback(articleId, type);
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  return (
    <div>
      <PageHeader
        title="Tìm theo ngữ nghĩa"
        description="Mô tả vấn đề bằng lời của bạn. TechPulse tìm bài có cùng ý nghĩa, kể cả khi không trùng từ khoá."
      />

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
        className="border-rule bg-surface focus-within:border-ink-2 flex items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-4"
      >
        <Search className="text-muted h-5 w-5 shrink-0" />
        <label htmlFor="semantic-q" className="sr-only">
          Bạn muốn tìm hiểu gì?
        </label>
        <input
          id="semantic-q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ví dụ: cách tránh deadlock khi nhiều worker cùng ghi"
          className="text-ink placeholder:text-faint h-10 min-w-0 flex-1 bg-transparent text-[16px] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={`${primaryButton} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tìm'}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-muted mr-1 text-[13px]">Thử:</span>
        {SUGGESTIONS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setQuery(t);
              runSearch(t);
            }}
            className="border-rule text-ink-2 hover:bg-wash h-8 cursor-pointer rounded-full border px-3 text-[13px] transition-colors"
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {loading ? (
          <p
            role="status"
            className="text-muted flex items-center justify-center gap-2 py-16 text-[14px]"
          >
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tìm bài cùng ý nghĩa…
          </p>
        ) : error ? (
          <p role="alert" className="text-danger-700 py-12 text-center text-[15px]">
            {error}
          </p>
        ) : searched && results.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-ink text-[16px] font-semibold">Không có bài nào khớp</p>
            <p className="text-muted mt-1 text-[14px]">
              Thử mô tả vấn đề theo cách khác, hoặc ngắn gọn hơn.
            </p>
          </div>
        ) : (
          results.length > 0 && (
            <>
              <p className="text-muted mb-1 text-[13px]">
                {results.length} bài, khớp nhất ở trên cùng
              </p>
              <ul className="divide-rule border-rule divide-y border-y">
                {results.map((art) => (
                  <li
                    key={art.id}
                    className="group relative grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 py-4 sm:grid-cols-[4rem_minmax(0,1fr)]"
                  >
                    <span
                      className={`score-numeral pt-0.5 text-[20px] leading-none ${
                        scoreTier(art.relevance_score) === 'high'
                          ? 'text-signal-700 font-bold'
                          : 'text-ink-2 font-semibold'
                      }`}
                      title={`Điểm AI ${art.relevance_score.toFixed(1)}/10`}
                    >
                      {art.relevance_score.toFixed(1)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-ink text-[16px] leading-snug font-semibold">
                        <button
                          onClick={() => onSelectArticle(art)}
                          className="group-hover:decoration-rule-strong cursor-pointer text-left group-hover:underline group-hover:underline-offset-4 after:absolute after:inset-0 after:content-['']"
                        >
                          {art.vietnamese_title || art.title}
                        </button>
                      </h3>
                      {art.vietnamese_summary && (
                        <p className="reading-font text-ink-2 mt-1 line-clamp-2 text-[14px] leading-[1.6]">
                          {art.vietnamese_summary}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-muted text-[13px]">
                          <span className="text-ink-2 font-medium">
                            {art.source_name || 'Không rõ nguồn'}
                          </span>
                          {art.similarity_score != null && (
                            <span className="ml-3">
                              Độ khớp {Math.round(art.similarity_score * 100)}%
                            </span>
                          )}
                        </p>
                        <div className="relative z-10 -mr-2 flex items-center">
                          <button
                            onClick={() => handleFeedback(art.id, 'like')}
                            aria-pressed={feedbackMap[art.id] === 'like'}
                            aria-label="Bài hữu ích"
                            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors ${
                              feedbackMap[art.id] === 'like'
                                ? 'text-signal-700'
                                : 'text-faint hover:bg-wash hover:text-ink'
                            }`}
                          >
                            <ThumbsUp
                              className="h-[18px] w-[18px]"
                              fill={feedbackMap[art.id] === 'like' ? 'currentColor' : 'none'}
                            />
                          </button>
                          <button
                            onClick={() => handleFeedback(art.id, 'dislike')}
                            aria-pressed={feedbackMap[art.id] === 'dislike'}
                            aria-label="Bài không liên quan"
                            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors ${
                              feedbackMap[art.id] === 'dislike'
                                ? 'text-danger-600'
                                : 'text-faint hover:bg-wash hover:text-ink'
                            }`}
                          >
                            <ThumbsDown
                              className="h-[18px] w-[18px]"
                              fill={feedbackMap[art.id] === 'dislike' ? 'currentColor' : 'none'}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )
        )}
      </div>
    </div>
  );
};
