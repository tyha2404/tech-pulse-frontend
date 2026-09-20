import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ArrowUpRight,
} from 'lucide-react';
import type { Article } from '../types';
import { searchSemanticArticles, sendArticleFeedback } from '../api';

interface SemanticSearchBarProps {
  onSelectArticle: (article: Article) => void;
}

export const SemanticSearchBar: React.FC<SemanticSearchBarProps> = ({ onSelectArticle }) => {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [minScore] = useState(0.0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Article[]>([]);
  const [searched, setSearched] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState<Record<number, string>>({});

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setSearched(true);
      const data = await searchSemanticArticles({
        query: query.trim(),
        topic: topic !== 'all' ? topic : undefined,
        min_score: minScore,
        limit: 20,
      });
      setResults(data);
    } catch (err) {
      console.error('Semantic search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (
    e: React.MouseEvent,
    articleId: number,
    type: 'like' | 'dislike'
  ) => {
    e.stopPropagation();
    try {
      setFeedbackMap((prev) => ({ ...prev, [articleId]: type }));
      await sendArticleFeedback(articleId, type);
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const TOPIC_SUGGESTIONS = [
    'Tất cả',
    'AI / LLM & Agents',
    'Backend & NestJS',
    'PostgreSQL & pgvector',
    'Distributed Systems',
    'Microservices & Message Queue',
  ];

  return (
    <div className="animate-fadeIn mx-auto max-w-5xl space-y-6 pb-12 font-serif">
      {/* Search Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e7e2d9] bg-gradient-to-r from-[#fbf9f5] via-[#f7f3ea] to-[#f4eee2] p-6 shadow-2xs md:flex-row md:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-2.5 py-0.5 font-sans text-[11px] font-semibold text-indigo-900">
            <Sparkles className="h-3.5 w-3.5 text-indigo-700" />
            pgvector Semantic Search Engine
          </div>
          <h2 className="font-serif text-xl font-bold text-[#1c1f24] sm:text-2xl">
            Tìm Kiếm Ngữ Nghĩa & Khái Niệm Kỹ Thuật
          </h2>
          <p className="mt-1 font-sans text-xs text-[#635c50]">
            Truy vấn theo bản chất bài toán, kiến trúc hệ thống hoặc ý nghĩa kỹ thuật mà không cần
            khớp chính xác từng từ khóa.
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="relative font-sans">
        <div className="flex items-center rounded-2xl border border-[#ded7ca] bg-white p-2 shadow-xs transition focus-within:border-[#2c313a] focus-within:ring-2 focus-within:ring-[#2c313a]/10">
          <Search className="ml-3 h-4 w-4 shrink-0 text-[#8c8475]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="VD: Cách tối ưu deadlock trong PostgreSQL, mô hình Agentic RAG, async job queue NestJS..."
            className="w-full bg-transparent px-3 py-2 text-xs font-medium text-[#1c1f24] placeholder-[#9c9485] focus:outline-none sm:text-sm"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#2c313a] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1a1d23] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            <span>Tìm kiếm</span>
          </button>
        </div>
      </form>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 font-sans text-xs">
        <span className="mr-1 flex items-center gap-1 text-[11px] font-medium text-[#8c8475]">
          <SlidersHorizontal className="h-3 w-3" /> Gợi ý chủ đề:
        </span>
        {TOPIC_SUGGESTIONS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setQuery(t === 'Tất cả' ? '' : t);
              if (t !== 'Tất cả') {
                setTopic(t);
              }
            }}
            className="cursor-pointer rounded-full border border-[#ded7ca] bg-[#eee9df] px-3 py-1 text-[11px] font-medium text-[#554e42] transition hover:bg-[#e4ded2]"
          >
            {t}
          </button>
        ))}
      </div>

      {/* Results Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 font-sans text-[#756e60]">
          <Loader2 className="mb-2.5 h-6 w-6 animate-spin text-[#4b5563]" />
          <p className="text-xs font-medium">
            Đang tính toán vector similarity & truy vấn pgvector...
          </p>
        </div>
      ) : searched && results.length === 0 ? (
        <div className="rounded-xl border border-[#e7e2d9] bg-white p-10 text-center shadow-xs">
          <p className="font-serif text-sm font-semibold text-[#1c1f24]">
            Không tìm thấy bài viết nào phù hợp
          </p>
          <p className="mt-1 font-sans text-xs text-[#756e60]">
            Hãy thử câu truy vấn khái niệm khác hoặc mở rộng từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((art) => (
            <article
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="group relative cursor-pointer rounded-xl border border-[#e7e2d9] bg-white p-5 shadow-xs transition hover:border-[#cfc7b8] hover:bg-[#fcfbf9]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Meta Badges */}
                  <div className="flex flex-wrap items-center gap-2 font-sans">
                    {art.similarity_score !== undefined && (
                      <span className="flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-900">
                        <Sparkles className="h-3 w-3 text-indigo-700" />
                        {Math.round(art.similarity_score * 100)}% Trùng khớp
                      </span>
                    )}
                    <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-900">
                      ⭐ {art.relevance_score.toFixed(1)}/10
                    </span>
                    <span className="rounded bg-[#f4efe6] px-2 py-0.5 text-[11px] font-semibold text-[#756e60]">
                      {art.source_name || 'TechPulse'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-base font-bold text-[#1c1f24] transition group-hover:text-indigo-950 md:text-lg">
                    {art.vietnamese_title || art.title}
                  </h3>

                  {/* Summary */}
                  <p className="line-clamp-2 font-serif text-[13px] leading-relaxed text-[#4a4f59]">
                    {art.vietnamese_summary || 'Xem bài viết chi tiết để biết thêm thông tin.'}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 font-sans">
                    {(art.tags || []).slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-[#e2dcd0] bg-[#f4f1ea] px-2 py-0.5 font-mono text-[10px] text-[#334155]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Feedback & Link Actions */}
                <div
                  className="flex shrink-0 items-center gap-1.5 self-start font-sans"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => handleFeedback(e, art.id, 'like')}
                    className={`cursor-pointer rounded-md p-1.5 transition ${
                      feedbackMap[art.id] === 'like'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-[#8c8475] hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                    title="Hữu ích"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleFeedback(e, art.id, 'dislike')}
                    className={`cursor-pointer rounded-md p-1.5 transition ${
                      feedbackMap[art.id] === 'dislike'
                        ? 'bg-rose-100 text-rose-800'
                        : 'text-[#8c8475] hover:bg-rose-50 hover:text-rose-700'
                    }`}
                    title="Không liên quan"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-[#e2dcd0] bg-[#f4efe6] p-1.5 text-[#756e60] transition hover:bg-[#eae4d7] hover:text-[#1c1f24]"
                    title="Mở link gốc"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
