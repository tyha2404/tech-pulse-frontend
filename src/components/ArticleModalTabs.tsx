import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  IconCheck,
  IconCode,
  IconCopy,
  IconDownload,
  IconExternal,
  IconRefresh,
  IconSpinner,
} from './icons';
import type { Article, RelatedArticleItem } from '../types';
import { apiClient, generateArticleBlueprint, exportArticleMarkdown } from '../api';
import { generateArticleMarkdown, downloadMarkdownFile } from '../utils/markdownExport';
import { ScoreBadge } from './ScoreBadge';

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
  const [blueprintError, setBlueprintError] = useState<string | null>(null);

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
        mdText = generateArticleMarkdown(article);
      }
      const filename = `${article.vietnamese_title || article.title || 'article'}`;
      downloadMarkdownFile(filename, mdText);
    } catch (err) {
      console.error('Export markdown error:', err);
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
    setBlueprintError(null);
    try {
      const updatedArticle = await generateArticleBlueprint(article.id);
      if (onArticleUpdated) {
        onArticleUpdated(updatedArticle);
      }
    } catch (err: any) {
      console.error('Lỗi tạo blueprint:', err);
      setBlueprintError(
        `Không tạo được blueprint: ${err?.response?.data?.detail || err?.message || String(err)}. Thử lại sau ít phút.`
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

  const hasTradeoffs = Boolean(
    tradeoffs &&
    [
      tradeoffs.pros,
      tradeoffs.cons,
      tradeoffs.when_not_to_use,
      tradeoffs.scalability_bottlenecks,
    ].some((list) => list && list.length > 0)
  );
  const tradeoffGroups = [
    { label: 'Ưu điểm', items: tradeoffs?.pros },
    { label: 'Nhược điểm và chi phí', items: tradeoffs?.cons },
    { label: 'Không nên dùng khi', items: tradeoffs?.when_not_to_use },
    { label: 'Điểm nghẽn khi mở rộng', items: tradeoffs?.scalability_bottlenecks },
  ].filter((g) => g.items && g.items.length > 0);

  const TABS = [
    { id: 'briefing', label: 'Phân tích' },
    { id: 'chat', label: 'Hỏi đáp với AI' },
    { id: 'learning', label: 'Học tiếp' },
  ] as const;

  const sectionTitle = 'text-[15px] font-semibold text-ink';
  const quietButton =
    'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted transition-colors hover:bg-wash hover:text-ink disabled:cursor-wait disabled:opacity-60';
  const bulletList =
    'space-y-1.5 pl-5 text-[15px] leading-[1.6] text-ink-2 marker:text-faint list-disc';

  return (
    <div className="flex flex-col">
      <div
        role="tablist"
        aria-label="Nội dung bài"
        className="border-rule flex gap-1 border-b px-4 sm:px-7"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px cursor-pointer border-b-2 px-2 py-3 text-[14px] whitespace-nowrap transition-colors sm:px-3 ${
              tab === t.id
                ? 'border-ink text-ink font-semibold'
                : 'text-muted hover:text-ink border-transparent font-medium'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="text-ink px-4 py-6 sm:px-7">
        {tab === 'briefing' && (
          <div className="space-y-9">
            <section>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className={sectionTitle}>Tóm tắt</h3>
                <div className="-mr-3 flex items-center">
                  <button
                    onClick={() => handleCopy(article.vietnamese_summary || '', 'summary')}
                    className={quietButton}
                  >
                    {copiedSummary ? (
                      <IconCheck className="text-signal-600 h-4 w-4" />
                    ) : (
                      <IconCopy className="h-4 w-4" />
                    )}
                    {copiedSummary ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                  <button
                    onClick={() => onSummarize(article.id)}
                    disabled={summarizing}
                    className={quietButton}
                  >
                    <IconRefresh className={`h-4 w-4 ${summarizing ? 'animate-spin' : ''}`} />
                    {summarizing ? 'Đang phân tích…' : 'Phân tích lại'}
                  </button>
                </div>
              </div>
              <p className="reading-font text-ink max-w-prose text-[17px] leading-[1.65] break-words">
                {article.vietnamese_summary ||
                  'Bài này chưa có tóm tắt. Bấm Phân tích lại để AI đọc và tóm tắt.'}
              </p>
            </section>

            {article.key_takeaways && article.key_takeaways.length > 0 && (
              <section>
                <h3 className={`${sectionTitle} mb-3`}>Điểm kỹ thuật đáng chú ý</h3>
                <ul className="reading-font border-signal-200 text-ink-2 max-w-prose space-y-2 border-l-2 pl-4 text-[16px] leading-[1.6]">
                  {article.key_takeaways.map((item, idx) => (
                    <li key={idx} className="break-words">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {article.new_tech_stacks && article.new_tech_stacks.length > 0 && (
              <section>
                <h3 className={`${sectionTitle} mb-3`}>Công nghệ xuất hiện trong bài</h3>
                <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {article.new_tech_stacks.map((ts, idx) => (
                    <div key={idx}>
                      <dt className="text-ink text-[14px] font-semibold">
                        {ts.name}
                        {ts.category && (
                          <span className="text-muted ml-2 font-normal">{ts.category}</span>
                        )}
                      </dt>
                      {ts.desc && (
                        <dd className="text-ink-2 mt-0.5 text-[14px] leading-relaxed">{ts.desc}</dd>
                      )}
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section>
              <h3 className={`${sectionTitle} mb-3`}>Đánh đổi kiến trúc</h3>
              {hasTradeoffs ? (
                <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                  {tradeoffGroups.map((g) => (
                    <div key={g.label}>
                      <h4 className="text-muted mb-1.5 text-[13px] font-semibold">{g.label}</h4>
                      <ul className={bulletList}>
                        {g.items!.map((item, i) => (
                          <li key={i} className="break-words">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-[14px]">
                  Chưa có phân tích đánh đổi cho bài này. Bấm Phân tích lại ở phần Tóm tắt để tạo.
                </p>
              )}
            </section>

            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className={sectionTitle}>Blueprint NestJS</h3>
                {hasBlueprint && (
                  <button
                    onClick={handleGenerateBlueprint}
                    disabled={generatingBlueprint}
                    className={`${quietButton} -mr-3`}
                  >
                    <IconRefresh
                      className={`h-4 w-4 ${generatingBlueprint ? 'animate-spin' : ''}`}
                    />
                    {generatingBlueprint ? 'Đang tạo lại…' : 'Tạo lại'}
                  </button>
                )}
              </div>

              {hasBlueprint ? (
                <div className="space-y-4 text-[14px]">
                  {blueprint?.architectural_pattern && (
                    <p className="text-ink-2">
                      <span className="text-ink font-semibold">Mẫu kiến trúc: </span>
                      {blueprint.architectural_pattern}
                    </p>
                  )}
                  {blueprint?.suggested_module_structure && (
                    <div>
                      <h4 className="text-muted mb-1.5 text-[13px] font-semibold">
                        Cấu trúc module
                      </h4>
                      <code className="bg-wash text-ink block max-w-full overflow-x-auto rounded-lg px-3 py-2 font-mono text-[13px] whitespace-pre">
                        {blueprint.suggested_module_structure}
                      </code>
                    </div>
                  )}
                  {blueprint?.database_integration && (
                    <div>
                      <h4 className="text-muted mb-1.5 text-[13px] font-semibold">
                        Tích hợp cơ sở dữ liệu
                      </h4>
                      <p className="text-ink-2 break-words">{blueprint.database_integration}</p>
                    </div>
                  )}
                  {blueprint?.code_snippet && (
                    <div className="bg-code overflow-hidden rounded-xl">
                      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[12px] text-white/60">
                        <span>TypeScript</span>
                        <button
                          onClick={() => handleCopy(blueprint.code_snippet || '', 'code')}
                          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2 hover:text-white"
                        >
                          {copiedCode ? (
                            <IconCheck className="h-3.5 w-3.5" />
                          ) : (
                            <IconCopy className="h-3.5 w-3.5" />
                          )}
                          {copiedCode ? 'Đã sao chép' : 'Sao chép mã'}
                        </button>
                      </div>
                      <pre className="max-h-96 overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-white/90">
                        {blueprint.code_snippet}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-muted max-w-prose text-[14px] leading-relaxed">
                    AI có thể đề xuất cấu trúc module và mã mẫu NestJS áp dụng ý tưởng của bài. Chỉ
                    tạo khi bạn yêu cầu, để tiết kiệm lượt gọi AI.
                  </p>
                  <button
                    onClick={handleGenerateBlueprint}
                    disabled={generatingBlueprint}
                    className="bg-primary hover:bg-primary-hover mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-[14px] font-semibold text-white transition-colors disabled:cursor-wait disabled:opacity-70"
                  >
                    <IconCode className={`h-4 w-4 ${generatingBlueprint ? 'animate-pulse' : ''}`} />
                    {generatingBlueprint ? 'Đang tạo blueprint…' : 'Tạo blueprint'}
                  </button>
                </div>
              )}
              {blueprintError && (
                <p role="alert" className="text-danger-700 mt-3 text-[14px]">
                  {blueprintError}
                </p>
              )}
            </section>
          </div>
        )}

        {tab === 'chat' && (
          <Suspense
            fallback={
              <div
                role="status"
                className="text-muted flex items-center justify-center gap-2 p-8 text-[14px]"
              >
                <IconSpinner className="h-4 w-4 animate-spin" />
                Đang mở hỏi đáp…
              </div>
            }
          >
            <ArticleChatCopilot
              articleId={article.id}
              articleTitle={article.vietnamese_title || article.title}
            />
          </Suspense>
        )}

        {tab === 'learning' && (
          <div className="space-y-9">
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <section>
                <h3 className={`${sectionTitle} mb-2`}>Cần biết trước</h3>
                {learning?.prerequisites && learning.prerequisites.length > 0 ? (
                  <ul className={bulletList}>
                    {learning.prerequisites.map((item, idx) => (
                      <li key={idx} className="break-words">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted text-[14px]">AI chưa gợi ý kiến thức nền cho bài này.</p>
                )}
              </section>
              <section>
                <h3 className={`${sectionTitle} mb-2`}>Nên tìm hiểu tiếp</h3>
                {learning?.recommended_next_topics &&
                learning.recommended_next_topics.length > 0 ? (
                  <ul className={bulletList}>
                    {learning.recommended_next_topics.map((item, idx) => (
                      <li key={idx} className="break-words">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted text-[14px]">
                    AI chưa gợi ý chủ đề tiếp theo cho bài này.
                  </p>
                )}
              </section>
            </div>

            <section>
              <h3 className={`${sectionTitle} mb-1`}>Bài liên quan</h3>
              <p className="text-muted mb-2 text-[13px]">Cùng công nghệ hoặc chủ đề với bài này.</p>
              {loadingRelated ? (
                <p role="status" className="text-muted py-3 text-[14px]">
                  Đang tìm bài liên quan…
                </p>
              ) : relatedArticles.length > 0 ? (
                <ul className="divide-rule border-rule divide-y border-y">
                  {relatedArticles.map((rel) => (
                    <li key={rel.id}>
                      <button
                        onClick={() => onSelectRelatedArticle && onSelectRelatedArticle(rel.id)}
                        className="hover:bg-wash/50 block w-full cursor-pointer py-3 text-left"
                      >
                        <span className="min-w-0">
                          <span className="text-ink block text-[15px] leading-snug font-medium">
                            {rel.vietnamese_title || rel.title}
                          </span>
                          <span className="text-muted mt-1.5 flex items-center gap-3 text-[13px]">
                            <ScoreBadge score={rel.relevance_score} />
                            {rel.source_name || 'Không rõ nguồn'}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted py-3 text-[14px]">Chưa có bài tương tự trong hệ thống.</p>
              )}
            </section>
          </div>
        )}

        <div className="border-rule mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="bg-primary hover:bg-primary-hover inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold text-white transition-colors"
          >
            Đọc bài gốc trên {article.source_name || 'trang nguồn'}
            <IconExternal className="h-4 w-4" />
          </a>
          <div className="-mr-3 flex items-center">
            <button onClick={handleCopyMarkdown} className={quietButton}>
              {copiedMarkdown ? (
                <IconCheck className="text-signal-600 h-4 w-4" />
              ) : (
                <IconCopy className="h-4 w-4" />
              )}
              {copiedMarkdown ? 'Đã sao chép' : 'Sao chép Markdown'}
            </button>
            <button
              onClick={handleExportMarkdown}
              disabled={exportingMarkdown}
              className={quietButton}
            >
              <IconDownload className="h-4 w-4" />
              {exportingMarkdown ? 'Đang xuất…' : 'Tải .md'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
