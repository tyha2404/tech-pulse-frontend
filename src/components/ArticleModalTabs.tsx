import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Scale,
  Code2,
  MessageSquare,
  Compass,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Link2,
} from 'lucide-react';
import type { Article, RelatedArticleItem } from '../types';
import { ArticleChatCopilot } from './ArticleChatCopilot';
import { apiClient } from '../api';

interface ArticleModalTabsProps {
  article: Article;
  onSummarize: (id: number) => Promise<void>;
  summarizing: boolean;
  onSelectRelatedArticle?: (articleId: number) => void;
}

export const ArticleModalTabs: React.FC<ArticleModalTabsProps> = ({
  article,
  onSummarize,
  summarizing,
  onSelectRelatedArticle,
}) => {
  const [tab, setTab] = useState<'overview' | 'tradeoffs' | 'blueprint' | 'chat' | 'learning'>('overview');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticleItem[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchRelated = async () => {
      try {
        setLoadingRelated(true);
        const res = await apiClient.get(`/articles/${article.id}/related`);
        if (isMounted) {
          setRelatedArticles(res.data);
        }
      } catch (err) {
        console.error('Failed to load related articles', err);
      } finally {
        if (isMounted) setLoadingRelated(false);
      }
    };
    fetchRelated();
    return () => {
      isMounted = false;
    };
  }, [article.id]);

  const handleCopy = (text: string, type: 'code' | 'summary') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  const tradeoffs = article.architectural_tradeoffs;
  const blueprint = article.nestjs_blueprint;
  const learning = article.learning_path;

  return (
    <div className="flex flex-col">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#e7e2d9] bg-[#fbf9f5] px-3 sm:px-6 py-2 font-sans text-xs scrollbar-none">
        <button
          onClick={() => setTab('overview')}
          className={`cursor-pointer whitespace-nowrap flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 font-medium transition ${
            tab === 'overview'
              ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
              : 'text-[#6b6456] hover:bg-[#eee8dc]/60 hover:text-[#1c1f24]'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          Tổng quan
        </button>

        <button
          onClick={() => setTab('tradeoffs')}
          className={`cursor-pointer whitespace-nowrap flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 font-medium transition ${
            tab === 'tradeoffs'
              ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
              : 'text-[#6b6456] hover:bg-[#eee8dc]/60 hover:text-[#1c1f24]'
          }`}
        >
          <Scale className="h-3.5 w-3.5 text-emerald-700" />
          Đánh đổi kiến trúc
        </button>

        <button
          onClick={() => setTab('blueprint')}
          className={`cursor-pointer whitespace-nowrap flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 font-medium transition ${
            tab === 'blueprint'
              ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
              : 'text-[#6b6456] hover:bg-[#eee8dc]/60 hover:text-[#1c1f24]'
          }`}
        >
          <Code2 className="h-3.5 w-3.5 text-indigo-700" />
          NestJS Blueprint
        </button>

        <button
          onClick={() => setTab('chat')}
          className={`cursor-pointer whitespace-nowrap flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 font-medium transition ${
            tab === 'chat'
              ? 'bg-white font-semibold text-indigo-900 shadow-xs ring-1 ring-indigo-200'
              : 'text-indigo-800 hover:bg-indigo-50/70 hover:text-indigo-950 font-medium'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
          Chat Copilot
        </button>

        <button
          onClick={() => setTab('learning')}
          className={`cursor-pointer whitespace-nowrap flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 font-medium transition ${
            tab === 'learning'
              ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
              : 'text-[#6b6456] hover:bg-[#eee8dc]/60 hover:text-[#1c1f24]'
          }`}
        >
          <Compass className="h-3.5 w-3.5 text-purple-700" />
          Lộ trình & Liên quan
        </button>
      </div>

      {/* Main Tab Content Area */}
      <div className="p-4 sm:p-6 text-[#2c313a]">
        {/* TAB 1: OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-sans text-xs font-bold tracking-wider text-[#756e60] uppercase">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Tóm tắt cốt lõi cho kỹ sư:
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSummarize(article.id)}
                    disabled={summarizing}
                    className="cursor-pointer flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 font-sans text-[11px] font-medium text-indigo-900 transition hover:bg-indigo-100 disabled:opacity-50"
                  >
                    <Sparkles
                      className={`h-3 w-3 text-indigo-600 ${summarizing ? 'animate-spin' : ''}`}
                    />
                    {summarizing ? 'Đang phân tích sâu...' : 'Phân tích lại bằng AI'}
                  </button>
                  <button
                    onClick={() => handleCopy(article.vietnamese_summary || '', 'summary')}
                    className="cursor-pointer flex items-center gap-1 rounded bg-[#eee9df] px-2 py-0.5 font-sans text-[11px] text-[#6b6456] transition hover:bg-[#e4ded2] hover:text-[#1c1f24]"
                  >
                    {copiedSummary ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedSummary ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-[#e7e2d9] bg-white p-4 font-serif text-[15px] leading-relaxed text-[#2c313a]">
                {article.vietnamese_summary || 'Chưa có tóm tắt. Vui lòng bấm "Phân tích lại bằng AI".'}
              </div>
            </div>

            {/* Key Takeaways */}
            {article.key_takeaways && article.key_takeaways.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 font-sans text-xs font-bold tracking-wider text-[#756e60] uppercase">
                  💡 Bài học & Điểm kỹ thuật đáng chú ý:
                </h3>
                <ul className="list-inside list-disc space-y-2 rounded-xl border border-[#e7e2d9] bg-white p-4 font-serif text-[14px] leading-relaxed text-[#333d4b]">
                  {article.key_takeaways.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tech Stack Box */}
            {article.new_tech_stacks && article.new_tech_stacks.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 font-sans text-xs font-bold tracking-wider text-[#756e60] uppercase">
                  ⚡ Công nghệ mới xuất hiện trong bài:
                </h3>
                <div className="grid grid-cols-1 gap-2.5 font-sans sm:grid-cols-2">
                  {article.new_tech_stacks.map((ts, idx) => (
                    <div key={idx} className="rounded-xl border border-[#e7e2d9] bg-white p-3.5">
                      <div className="font-mono text-xs font-bold text-[#0f172a]">{ts.name}</div>
                      <div className="mt-1 font-serif text-[12px] text-[#64748b]">{ts.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ARCHITECTURAL TRADEOFFS */}
        {tab === 'tradeoffs' && (
          <div className="space-y-4 font-sans text-xs">
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-blue-900">
              <p className="font-medium">
                ⚖️ <strong>Đánh giá phản biện (Critical Review):</strong> Mọi quyết định kỹ thuật đều có sự đánh đổi giữa hiệu năng, độ phức tạp và chi phí vận hành. Dưới đây là phân tích khách quan cho hệ thống thực tế:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Pros */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <h4 className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Ưu điểm & Điểm vượt trội
                </h4>
                <ul className="mt-2.5 list-inside list-disc space-y-1.5 text-[#2c313a]">
                  {tradeoffs?.pros && tradeoffs.pros.length > 0 ? (
                    tradeoffs.pros.map((p, i) => <li key={i}>{p}</li>)
                  ) : (
                    <li className="italic text-[#756e60]">Bấm "Phân tích lại bằng AI" để trích xuất đầy đủ ưu điểm.</li>
                  )}
                </ul>
              </div>

              {/* Cons */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
                <h4 className="flex items-center gap-1.5 font-bold text-rose-900">
                  <AlertTriangle className="h-4 w-4 text-rose-700" /> Nhược điểm & Chi phí phải trả
                </h4>
                <ul className="mt-2.5 list-inside list-disc space-y-1.5 text-[#2c313a]">
                  {tradeoffs?.cons && tradeoffs.cons.length > 0 ? (
                    tradeoffs.cons.map((c, i) => <li key={i}>{c}</li>)
                  ) : (
                    <li className="italic text-[#756e60]">Bấm "Phân tích lại bằng AI" để xem các nhược điểm kỹ thuật.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* When NOT to use */}
            <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4">
              <h4 className="flex items-center gap-1.5 font-bold text-amber-950">
                🛑 Khi nào KHÔNG NÊN áp dụng? (Tránh Over-engineering)
              </h4>
              <ul className="mt-2.5 list-inside list-disc space-y-1.5 text-[#3b3223]">
                {tradeoffs?.when_not_to_use && tradeoffs.when_not_to_use.length > 0 ? (
                  tradeoffs.when_not_to_use.map((w, i) => <li key={i}>{w}</li>)
                ) : (
                  <li className="italic text-[#756e60]">Chưa có dữ liệu chống lạm dụng kiến trúc. Hãy bấm phân tích lại.</li>
                )}
              </ul>
            </div>

            {/* Scalability Bottlenecks */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4">
              <h4 className="flex items-center gap-1.5 font-bold text-purple-950">
                ⚡ Điểm nghẽn khi Scale (Scalability Bottlenecks)
              </h4>
              <ul className="mt-2.5 list-inside list-disc space-y-1.5 text-[#2c313a]">
                {tradeoffs?.scalability_bottlenecks && tradeoffs.scalability_bottlenecks.length > 0 ? (
                  tradeoffs.scalability_bottlenecks.map((b, i) => <li key={i}>{b}</li>)
                ) : (
                  <li className="italic text-[#756e60]">Chưa phát hiện điểm nghẽn. Hãy bấm phân tích lại.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: NESTJS BLUEPRINT */}
        {tab === 'blueprint' && (
          <div className="space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 text-indigo-900">
              <div>
                <p className="font-bold">🧱 Kiến trúc đề xuất cho NestJS:</p>
                <p className="mt-0.5 text-[11px] text-indigo-800">
                  {blueprint?.architectural_pattern || 'Hexagonal Architecture / Modular Service Pattern'}
                </p>
              </div>
              {blueprint?.code_snippet && (
                <button
                  onClick={() => handleCopy(blueprint.code_snippet || '', 'code')}
                  className="cursor-pointer flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-medium text-indigo-900 shadow-2xs transition hover:bg-indigo-100"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedCode ? 'Đã sao chép' : 'Sao chép mã'}
                </button>
              )}
            </div>

            {blueprint?.suggested_module_structure && (
              <div className="rounded-xl border border-[#e7e2d9] bg-white p-3.5">
                <span className="font-bold text-[#475569]">📁 Cấu trúc Module gợi ý:</span>
                <code className="mt-1 block rounded bg-[#f4efe6] px-2 py-1 font-mono text-[11px] text-[#2c313a]">
                  {blueprint.suggested_module_structure}
                </code>
              </div>
            )}

            {blueprint?.database_integration && (
              <div className="rounded-xl border border-[#e7e2d9] bg-white p-3.5">
                <span className="font-bold text-[#475569]">🗄️ Tích hợp Cơ sở dữ liệu (Prisma / pgvector / Cache):</span>
                <p className="mt-1 text-[#2c313a]">{blueprint.database_integration}</p>
              </div>
            )}

            {/* Code Snippet Box */}
            <div className="rounded-xl border border-[#24292f] bg-[#1e2329] p-4 text-white">
              <div className="mb-2 flex items-center justify-between text-[11px] text-[#9ca3af]">
                <span>typescript (NestJS Service / Module)</span>
                {blueprint?.code_snippet && (
                  <button
                    onClick={() => handleCopy(blueprint.code_snippet || '', 'code')}
                    className="cursor-pointer hover:text-white"
                  >
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                )}
              </div>
              <pre className="max-h-96 overflow-x-auto overflow-y-auto font-mono text-[11px] leading-relaxed text-[#e5e7eb]">
                {blueprint?.code_snippet ||
                  `// Bấm "Phân tích lại bằng AI" để AI sinh code mẫu NestJS chuyên biệt cho bài viết này.\n@Injectable()\nexport class ExampleService {\n  // Implementation pattern\n}`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 4: CHAT COPILOT */}
        {tab === 'chat' && (
          <ArticleChatCopilot articleId={article.id} articleTitle={article.vietnamese_title || article.title} />
        )}

        {/* TAB 5: LEARNING PATH & RELATED */}
        {tab === 'learning' && (
          <div className="space-y-5 font-sans text-xs">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#e7e2d9] bg-white p-4">
                <h4 className="flex items-center gap-1.5 font-bold text-[#1c1f24]">
                  🎯 Kiến thức tiên quyết cần nắm (Prerequisites):
                </h4>
                <ul className="mt-2.5 list-inside list-disc space-y-1.5 text-[#475569]">
                  {learning?.prerequisites && learning.prerequisites.length > 0 ? (
                    learning.prerequisites.map((item, idx) => <li key={idx}>{item}</li>)
                  ) : (
                    <li className="italic text-[#756e60]">TypeScript nâng cao, Node.js Event Loop, NestJS DI cơ bản.</li>
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-[#e7e2d9] bg-white p-4">
                <h4 className="flex items-center gap-1.5 font-bold text-[#1c1f24]">
                  🚀 Chủ đề nên nghiên cứu tiếp theo:
                </h4>
                <ul className="mt-2.5 list-inside list-disc space-y-1.5 text-[#475569]">
                  {learning?.recommended_next_topics && learning.recommended_next_topics.length > 0 ? (
                    learning.recommended_next_topics.map((item, idx) => <li key={idx}>{item}</li>)
                  ) : (
                    <li className="italic text-[#756e60]">PostgreSQL Vector Indexing, Hybrid Search Reranking.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Knowledge Graph: Related Articles */}
            <div className="rounded-xl border border-[#e7e2d9] bg-[#fbf9f5] p-4">
              <h4 className="flex items-center gap-1.5 font-bold text-[#1c1f24]">
                <Link2 className="h-4 w-4 text-indigo-700" />
                Bài viết liên quan trong TechPulse (Knowledge Graph):
              </h4>
              <p className="mt-0.5 text-[11px] text-[#756e60]">
                Các bài viết cùng chia sẻ công nghệ và chủ đề kiến trúc với bài này:
              </p>

              {loadingRelated ? (
                <div className="mt-3 py-2 text-center text-[#756e60] italic">Đang tìm bài viết liên quan...</div>
              ) : relatedArticles.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {relatedArticles.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectRelatedArticle && onSelectRelatedArticle(rel.id)}
                      className="cursor-pointer flex items-center justify-between rounded-lg border border-[#e7e2d9] bg-white p-2.5 transition hover:border-indigo-300 hover:bg-indigo-50/40"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-serif text-[13px] font-semibold text-[#1c1f24] line-clamp-1">
                          {rel.vietnamese_title || rel.title}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#756e60]">
                          <span>{rel.source_name || 'Tech'}</span>
                          <span>•</span>
                          <span>Điểm: {rel.relevance_score.toFixed(1)}</span>
                          {rel.tags && rel.tags.length > 0 && (
                            <span className="hidden sm:inline-block">({rel.tags.slice(0, 3).join(', ')})</span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-indigo-800">Xem bài →</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-[#756e60] italic">Chưa có bài viết tương đồng trong hệ thống.</div>
              )}
            </div>
          </div>
        )}

        {/* Source link footer */}
        <div className="mt-6 border-t border-[#e7e2d9] pt-3 font-sans">
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-900 underline hover:text-indigo-950"
          >
            Đọc toàn văn bài viết gốc tại {article.source_name} ({article.url}) <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
