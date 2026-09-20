import React, { useState } from 'react';
import { Search, Sparkles, SlidersHorizontal, Loader2, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
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

  const handleFeedback = async (e: React.MouseEvent, articleId: number, type: 'like' | 'dislike') => {
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Search Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          pgvector Semantic Search Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Tìm Kiếm Ngữ Nghĩa Kỹ Thuật
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Tìm kiếm bài viết theo khái niệm kỹ thuật (concept), kiến trúc hệ thống hoặc bài toán thực tế mà không cần trùng khớp chính xác từ khóa.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center rounded-2xl bg-slate-900 border border-slate-700/80 shadow-lg focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition p-1.5">
          <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="VD: Cách tối ưu deadlock trong PostgreSQL, mô hình Agentic RAG, async job queue NestJS..."
            className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shrink-0 shadow-sm shadow-indigo-500/30"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Tìm kiếm
          </button>
        </div>
      </form>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-500 font-medium mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Gợi ý:
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
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition text-[11px]"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Results Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-500 mb-2.5" />
          <p className="text-xs font-medium">Đang tính toán vector similarity & tìm bài viết phù hợp...</p>
        </div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-14 bg-slate-900/60 border border-slate-800 rounded-xl">
          <p className="text-sm font-semibold text-slate-300">Không tìm thấy bài viết nào phù hợp</p>
          <p className="text-xs text-slate-500 mt-1">Hãy thử câu truy vấn khác hoặc điều chỉnh từ khóa mô tả.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((art) => (
            <div
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="group bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 transition cursor-pointer shadow-sm relative"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {art.similarity_score !== undefined && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold flex items-center gap-1 font-mono">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        {Math.round(art.similarity_score * 100)}% Match
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-bold font-mono">
                      ⭐ {art.relevance_score.toFixed(1)}/10
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {art.source_name || 'TechPulse'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                    {art.vietnamese_title || art.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {art.vietnamese_summary || 'Xem nội dung bài viết để biết thêm chi tiết.'}
                  </p>

                  {/* Tags & Tech */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {(art.tags || []).slice(0, 4).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-medium font-mono">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1.5 self-start shrink-0">
                  <button
                    onClick={(e) => handleFeedback(e, art.id, 'like')}
                    className={`p-1.5 rounded-lg border transition ${
                      feedbackMap[art.id] === 'like'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
                    }`}
                    title="Hữu ích"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleFeedback(e, art.id, 'dislike')}
                    className={`p-1.5 rounded-lg border transition ${
                      feedbackMap[art.id] === 'dislike'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
                    }`}
                    title="Không liên quan"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700 transition"
                    title="Mở link gốc"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
