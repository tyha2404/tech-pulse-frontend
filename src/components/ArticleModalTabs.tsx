import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  Sparkles,
  Code2,
  MessageSquare,
  Compass,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Link2,
  Download,
  FileText,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import type { Article, RelatedArticleItem } from '../types';
import { apiClient, generateArticleBlueprint, exportArticleMarkdown } from '../api';
import { generateArticleMarkdown, downloadMarkdownFile } from '../utils/markdownExport';

const ArticleChatCopilot = lazy(() =>
  import('./ArticleChatCopilot').then((m) => ({ default: m.ArticleChatCopilot }))
);

interface ArticleModalTabsProps {
  article: Article;
  onSummarize: (id: number) => Promise<void>;
  summarizing: boolean;
  onSelectRelatedArticle?: (articleId: number) => void;
  onArticleUpdated?: (updated: Article) => void;
}

export const ArticleModalTabs: React.FC<ArticleModalTabsProps> = ({
  article,
  onSummarize,
  summarizing,
  onSelectRelatedArticle,
  onArticleUpdated,
}) => {
  const [tab, setTab] = useState<'briefing' | 'chat' | 'learning'>('briefing');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [exportingMarkdown, setExportingMarkdown] = useState(false);
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false);
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

  const handleCopy = (text: string, type: 'code' | 'summary' | 'markdown') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (type === 'summary') {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } else if (type === 'markdown') {
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    }
  };

  const handleExportMarkdown = async () => {
    setExportingMarkdown(true);
    try {
      let mdText = '';
      try {
        mdText = await exportArticleMarkdown(article.id);
      } catch {
        // Fallback to client-side Markdown generator
        mdText = generateArticleMarkdown(article);
      }
      const filename = `${article.vietnamese_title || article.title || 'article'}`;
      downloadMarkdownFile(filename, mdText);
    } catch (err) {
      console.error('Export markdown error:', err);
      // Fallback
      const mdText = generateArticleMarkdown(article);
      downloadMarkdownFile(article.vietnamese_title || article.title, mdText);
    } finally {
      setExportingMarkdown(false);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      let mdText = '';
      try {
        mdText = await exportArticleMarkdown(article.id);
      } catch {
        mdText = generateArticleMarkdown(article);
      }
      handleCopy(mdText, 'markdown');
    } catch {
      handleCopy(generateArticleMarkdown(article), 'markdown');
    }
  };

  const handleGenerateBlueprint = async () => {
    setGeneratingBlueprint(true);
    try {
      const updatedArticle = await generateArticleBlueprint(article.id);
      if (onArticleUpdated) {
        onArticleUpdated(updatedArticle);
      }
    } catch (err: any) {
      console.error('Lỗi tạo blueprint:', err);
      alert(
        'Không thể tạo blueprint: ' + (err?.response?.data?.detail || err?.message || String(err))
      );
    } finally {
      setGeneratingBlueprint(false);
    }
  };

  const tradeoffs = article.architectural_tradeoffs;
  const blueprint = article.nestjs_blueprint;
  const hasBlueprint = Boolean(
    blueprint &&
    (blueprint.code_snippet ||
      blueprint.suggested_module_structure ||
      blueprint.architectural_pattern)
  );
  const learning = article.learning_path;

  return (
    <div className="flex flex-col">
      {/* Modernized Streamlined Navigation Tabs */}
      <div className="no-scrollbar flex items-center justify-between border-b border-[#e7e2d9] bg-[#fbf9f5] px-2.5 py-2 font-sans text-xs sm:px-6">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setTab('briefing')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap transition sm:px-3 ${
              tab === 'briefing'
                ? 'bg-white font-semibold text-[#1c1f24] shadow-xs ring-1 ring-[#e7e2d9]'
                : 'text-[#6b6456] hover:bg-[#eee8dc]/60 hover:text-[#1c1f24]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            Tổng quan & Kiến trúc
          </button>

          <button
            onClick={() => setTab('chat')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap transition sm:px-3 ${
              tab === 'chat'
                ? 'bg-white font-semibold text-indigo-900 shadow-xs ring-1 ring-indigo-200'
                : 'font-medium text-indigo-800 hover:bg-indigo-50/70 hover:text-indigo-950'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
            Chat Copilot
          </button>

          <button
            onClick={() => setTab('learning')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap transition sm:px-3 ${
              tab === 'learning'
                ? 'bg-white font-semibold text-[#1c1f24] shadow-xs ring-1 ring-[#e7e2d9]'
                : 'text-[#6b6456] hover:bg-[#eee8dc]/60 hover:text-[#1c1f24]'
            }`}
          >
            <Compass className="h-3.5 w-3.5 text-purple-700" />
            Lộ trình & Liên quan
          </button>
        </div>

        {/* Global Markdown / Obsidian Action Buttons */}
        <div className="hidden items-center gap-2 sm:flex">
          <button
            onClick={handleCopyMarkdown}
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-[#e2dcd0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#554e42] shadow-2xs transition hover:bg-[#eee9df] hover:text-[#1c1f24]"
            title="Sao chép toàn bộ bài dưới dạng Markdown (Frontmatter) cho Obsidian / Notion"
          >
            {copiedMarkdown ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3 text-[#756e60]" />
            )}
            <span>{copiedMarkdown ? 'Đã sao chép MD' : 'Copy Markdown'}</span>
          </button>
          <button
            onClick={handleExportMarkdown}
            disabled={exportingMarkdown}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/80 px-2.5 py-1 text-[11px] font-medium text-purple-900 shadow-2xs transition hover:bg-purple-100 disabled:opacity-50"
            title="Tải file .md chuẩn Obsidian kèm YAML Frontmatter"
          >
            <Download
              className={`h-3 w-3 text-purple-700 ${exportingMarkdown ? 'animate-bounce' : ''}`}
            />
            <span>{exportingMarkdown ? 'Đang xuất...' : 'Xuất Obsidian .md'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content Area */}
      <div className="p-3.5 text-[#2c313a] sm:p-6">
        {/* ================= TAB 1: EXECUTIVE BRIEFING (TỔNG QUAN + TRADEOFFS + ON-DEMAND BLUEPRINT) ================= */}
        {tab === 'briefing' && (
          <div className="space-y-6">
            {/* Top Toolbar for Mobile / Quick Action */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#ede7dc] bg-[#fbf9f5] p-2 sm:hidden">
              <div className="text-[11px] font-medium text-[#756e60]">Second Brain / PKM:</div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[10px] font-medium text-[#554e42] shadow-2xs"
                >
                  {copiedMarkdown ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedMarkdown ? 'Đã chép MD' : 'Copy MD'}</span>
                </button>
                <button
                  onClick={handleExportMarkdown}
                  disabled={exportingMarkdown}
                  className="flex items-center gap-1 rounded bg-purple-100 px-2 py-1 text-[10px] font-medium text-purple-900"
                >
                  <Download className="h-3 w-3" />
                  <span>Tải .md</span>
                </button>
              </div>
            </div>

            {/* Section 1: Executive Summary */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-sans text-xs font-bold tracking-wider text-[#756e60] uppercase">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Tóm tắt cốt lõi cho kỹ sư:
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSummarize(article.id)}
                    disabled={summarizing}
                    className="flex cursor-pointer items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 font-sans text-[11px] font-medium text-indigo-900 transition hover:bg-indigo-100 disabled:opacity-50"
                  >
                    <Sparkles
                      className={`h-3 w-3 text-indigo-600 ${summarizing ? 'animate-spin' : ''}`}
                    />
                    {summarizing ? 'Đang phân tích sâu...' : 'Phân tích lại bằng AI'}
                  </button>
                  <button
                    onClick={() => handleCopy(article.vietnamese_summary || '', 'summary')}
                    className="flex cursor-pointer items-center gap-1 rounded bg-[#eee9df] px-2 py-0.5 font-sans text-[11px] text-[#6b6456] transition hover:bg-[#e4ded2] hover:text-[#1c1f24]"
                  >
                    {copiedSummary ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedSummary ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-[#e7e2d9] bg-white p-4 font-serif text-[15px] leading-relaxed text-[#2c313a]">
                {article.vietnamese_summary ||
                  'Chưa có tóm tắt. Vui lòng bấm "Phân tích lại bằng AI".'}
              </div>
            </div>

            {/* Section 2: Key Takeaways */}
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

            {/* Section 3: Tech Stack Box */}
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

            {/* Section 4: Architectural Tradeoffs (INLINE SEAMLESS VIEW) */}
            <div className="space-y-4 pt-2 font-sans text-xs">
              <div className="flex items-center justify-between border-t border-[#ede7dc] pt-5">
                <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#756e60] uppercase">
                  ⚖️ Đánh giá phản biện & Đánh đổi kiến trúc (Architectural Tradeoffs):
                </h3>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-blue-900">
                <p className="font-medium">
                  Mọi quyết định kỹ thuật đều có sự đánh đổi giữa hiệu năng, độ phức tạp và chi phí
                  vận hành:
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
                      <li className="text-[#756e60] italic">
                        Bấm "Phân tích lại bằng AI" để trích xuất đầy đủ ưu điểm.
                      </li>
                    )}
                  </ul>
                </div>

                {/* Cons */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
                  <h4 className="flex items-center gap-1.5 font-bold text-rose-900">
                    <AlertTriangle className="h-4 w-4 text-rose-700" /> Nhược điểm & Chi phí phải
                    trả
                  </h4>
                  <ul className="mt-2.5 list-inside list-disc space-y-1.5 text-[#2c313a]">
                    {tradeoffs?.cons && tradeoffs.cons.length > 0 ? (
                      tradeoffs.cons.map((c, i) => <li key={i}>{c}</li>)
                    ) : (
                      <li className="text-[#756e60] italic">
                        Bấm "Phân tích lại bằng AI" để xem các nhược điểm kỹ thuật.
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* When NOT to use & Scalability Bottlenecks */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4">
                  <h4 className="flex items-center gap-1.5 font-bold text-amber-950">
                    🛑 Khi nào KHÔNG NÊN áp dụng?
                  </h4>
                  <ul className="mt-2.5 list-inside list-disc space-y-1.5 text-[#3b3223]">
                    {tradeoffs?.when_not_to_use && tradeoffs.when_not_to_use.length > 0 ? (
                      tradeoffs.when_not_to_use.map((w, i) => <li key={i}>{w}</li>)
                    ) : (
                      <li className="text-[#756e60] italic">
                        Chưa có dữ liệu chống lạm dụng kiến trúc. Hãy bấm phân tích lại.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4">
                  <h4 className="flex items-center gap-1.5 font-bold text-purple-950">
                    ⚡ Điểm nghẽn khi Scale (Scalability)
                  </h4>
                  <ul className="mt-2.5 list-inside list-disc space-y-1.5 text-[#2c313a]">
                    {tradeoffs?.scalability_bottlenecks &&
                    tradeoffs.scalability_bottlenecks.length > 0 ? (
                      tradeoffs.scalability_bottlenecks.map((b, i) => <li key={i}>{b}</li>)
                    ) : (
                      <li className="text-[#756e60] italic">
                        Chưa phát hiện điểm nghẽn. Hãy bấm phân tích lại.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 5: ON-DEMAND ARCHITECTURAL BLUEPRINT */}
            <div className="border-t border-[#ede7dc] pt-6 font-sans">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#756e60] uppercase">
                  <Code2 className="h-3.5 w-3.5 text-indigo-700" /> Kịch bản Kiến trúc & Blueprint
                  (On-Demand):
                </h3>
                {hasBlueprint && (
                  <button
                    onClick={handleGenerateBlueprint}
                    disabled={generatingBlueprint}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-900 transition hover:bg-indigo-100 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${generatingBlueprint ? 'animate-spin' : ''}`} />
                    <span>{generatingBlueprint ? 'Đang tạo lại...' : 'Làm mới Blueprint'}</span>
                  </button>
                )}
              </div>

              {hasBlueprint ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 text-indigo-900">
                    <div>
                      <p className="font-bold">🧱 Kiến trúc đề xuất:</p>
                      <p className="mt-0.5 text-[11px] text-indigo-800">
                        {blueprint?.architectural_pattern ||
                          'Hexagonal Architecture / Modular Service Pattern'}
                      </p>
                    </div>
                    {blueprint?.code_snippet && (
                      <button
                        onClick={() => handleCopy(blueprint.code_snippet || '', 'code')}
                        className="flex cursor-pointer items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-medium text-indigo-900 shadow-2xs transition hover:bg-indigo-100"
                      >
                        {copiedCode ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
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
                      <span className="font-bold text-[#475569]">🗄️ Tích hợp Cơ sở dữ liệu:</span>
                      <p className="mt-1 text-[#2c313a]">{blueprint.database_integration}</p>
                    </div>
                  )}

                  {blueprint?.code_snippet && (
                    <div className="rounded-xl border border-[#24292f] bg-[#1e2329] p-4 text-white">
                      <div className="mb-2 flex items-center justify-between text-[11px] text-[#9ca3af]">
                        <span>typescript (Module Implementation)</span>
                        <button
                          onClick={() => handleCopy(blueprint.code_snippet || '', 'code')}
                          className="cursor-pointer hover:text-white"
                        >
                          {copiedCode ? 'Copied!' : 'Copy Code'}
                        </button>
                      </div>
                      <pre className="max-h-96 overflow-x-auto overflow-y-auto font-mono text-[11px] leading-relaxed text-[#e5e7eb]">
                        {blueprint.code_snippet}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 p-6 text-center">
                  <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-xs">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-[#1c1f24]">
                    Tạo Blueprint Kiến trúc Thực Chiến theo Yêu Cầu
                  </h4>
                  <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#64748b]">
                    Tiết kiệm tài nguyên AI: Blueprint và mã nguồn mẫu NestJS/TypeScript chỉ được
                    tạo khi bạn chủ động yêu cầu cho bài viết này.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={handleGenerateBlueprint}
                      disabled={generatingBlueprint}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-950 disabled:opacity-50"
                    >
                      <Code2 className={`h-4 w-4 ${generatingBlueprint ? 'animate-spin' : ''}`} />
                      <span>
                        {generatingBlueprint
                          ? 'AI đang tổng hợp mã nguồn kiến trúc...'
                          : 'Tạo kiến trúc / Blueprint ngay'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: CHAT COPILOT ================= */}
        {tab === 'chat' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8 text-sm text-[#756e60]">
                <Sparkles className="mr-2 h-4 w-4 animate-spin text-amber-600" />
                Đang tải AI Chat Copilot...
              </div>
            }
          >
            <ArticleChatCopilot
              articleId={article.id}
              articleTitle={article.vietnamese_title || article.title}
            />
          </Suspense>
        )}

        {/* ================= TAB 3: LEARNING PATH & RELATED ================= */}
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
                    <li className="text-[#756e60] italic">
                      TypeScript nâng cao, Node.js Event Loop, NestJS DI cơ bản.
                    </li>
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-[#e7e2d9] bg-white p-4">
                <h4 className="flex items-center gap-1.5 font-bold text-[#1c1f24]">
                  🚀 Chủ đề nên nghiên cứu tiếp theo:
                </h4>
                <ul className="mt-2.5 list-inside list-disc space-y-1.5 text-[#475569]">
                  {learning?.recommended_next_topics &&
                  learning.recommended_next_topics.length > 0 ? (
                    learning.recommended_next_topics.map((item, idx) => <li key={idx}>{item}</li>)
                  ) : (
                    <li className="text-[#756e60] italic">
                      PostgreSQL Vector Indexing, Hybrid Search Reranking.
                    </li>
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
                <div className="mt-3 py-2 text-center text-[#756e60] italic">
                  Đang tìm bài viết liên quan...
                </div>
              ) : relatedArticles.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {relatedArticles.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectRelatedArticle && onSelectRelatedArticle(rel.id)}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-[#e7e2d9] bg-white p-2.5 transition hover:border-indigo-300 hover:bg-indigo-50/40"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="line-clamp-1 font-serif text-[13px] font-semibold text-[#1c1f24]">
                          {rel.vietnamese_title || rel.title}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#756e60]">
                          <span>{rel.source_name || 'Tech'}</span>
                          <span>•</span>
                          <span>Điểm: {rel.relevance_score.toFixed(1)}</span>
                          {rel.tags && rel.tags.length > 0 && (
                            <span className="hidden sm:inline-block">
                              ({rel.tags.slice(0, 3).join(', ')})
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-indigo-800">
                        Xem bài →
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-[#756e60] italic">
                  Chưa có bài viết tương đồng trong hệ thống.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Source link footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e7e2d9] pt-3 font-sans">
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold break-words text-indigo-900 underline hover:text-indigo-950"
          >
            <span>Đọc bài gốc tại {article.source_name}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>

          <button
            onClick={handleExportMarkdown}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-purple-900 hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Tải Markdown cho Obsidian</span>
          </button>
        </div>
      </div>
    </div>
  );
};
