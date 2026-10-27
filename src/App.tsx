import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { IconClose, IconFeed, IconPlus, IconSpinner, IconTrash } from './components/icons';
import { apiClient, getPersonalizedArticles, sendArticleFeedback } from './api';
import type { Article, Source } from './types';
import { FeedHeader, type AppTab } from './components/FeedHeader';
import { FilterToolbar } from './components/FilterToolbar';
import { ArticleCard } from './components/ArticleCard';
import { ArticleModal } from './components/ArticleModal';
import { ExplanationModal } from './components/ExplanationModal';
import { AddSourceModal } from './components/AddSourceModal';
import { SemanticSearchBar } from './components/SemanticSearchBar';
import { PageHeader } from './components/PageHeader';
import { primaryButton, sectionHeading } from './utils/ui';
import { formatRelativeTime, SOURCE_CATEGORY_LABELS, SOURCE_STATUS } from './utils/format';

const RadarIntelligenceView = lazy(() =>
  import('./components/RadarIntelligenceView').then((m) => ({ default: m.RadarIntelligenceView }))
);
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('feed');
  const [toast, setToast] = useState<{ message: string; tone: 'info' | 'error' } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const notify = useCallback((message: string, tone: 'info' | 'error' = 'info') => {
    window.clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), tone === 'error' ? 7000 : 4000);
  }, []);
  const [articles, setArticles] = useState<Article[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<number, string>>({});
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [crawlingAll, setCrawlingAll] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);

  // Filters & Sorting
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sourceCategoryFilter, setSourceCategoryFilter] = useState<string>('all');
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [topOnly, setTopOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score'>('newest');
  const [readStatus, setReadStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState<boolean>(false);
  const [viewHidden, setViewHidden] = useState<boolean>(false);
  const [groupDuplicates, setGroupDuplicates] = useState<boolean>(true);

  // Modals
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [summarizingArticleId, setSummarizingArticleId] = useState<number | null>(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);

  const PAGE_SIZE = 20;
  const articlesLengthRef = useRef(articles.length);
  useEffect(() => {
    articlesLengthRef.current = articles.length;
  }, [articles.length]);

  const fetchArticles = useCallback(
    async (reset: boolean = true) => {
      try {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        if (activeTab === 'personalized') {
          const data = await getPersonalizedArticles('default_user', 30);
          setArticles(data);
          setHasMore(false);
          return;
        }

        const currentOffset = reset ? 0 : articlesLengthRef.current;
        const params: any = {
          sort_by: sortBy,
          read_status: readStatus,
          bookmarked_only: bookmarkedOnly,
          include_hidden: viewHidden,
          group_duplicates: groupDuplicates,
          limit: PAGE_SIZE,
          offset: currentOffset,
        };
        if (selectedSourceId) params.source_id = selectedSourceId;
        if (selectedCategory !== 'all') params.category = selectedCategory;
        if (topOnly) params.top_only = true;
        if (searchQuery) params.query = searchQuery;
        const res = await apiClient.get('/articles', { params });
        const newItems: Article[] = res.data;

        if (reset) {
          setArticles(newItems);
        } else {
          setArticles((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const uniqueNew = newItems.filter((a) => !existingIds.has(a.id));
            return [...prev, ...uniqueNew];
          });
        }
        setHasMore(newItems.length === PAGE_SIZE);
      } catch (err) {
        console.error('Error loading articles', err);
      } finally {
        if (reset) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [
      activeTab,
      sortBy,
      readStatus,
      bookmarkedOnly,
      viewHidden,
      groupDuplicates,
      selectedSourceId,
      selectedCategory,
      topOnly,
      searchQuery,
    ]
  );

  const handleFeedback = useCallback(
    async (e: React.MouseEvent, articleId: number, type: 'like' | 'dislike') => {
      e.stopPropagation();
      try {
        setFeedbackMap((prev) => ({ ...prev, [articleId]: type }));
        await sendArticleFeedback(articleId, type);
      } catch (err) {
        console.error('Feedback error:', err);
      }
    },
    []
  );

  const fetchSources = async () => {
    try {
      const res = await apiClient.get('/sources');
      setSources(res.data);
    } catch (err) {
      console.error('Error loading sources', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'feed' || activeTab === 'personalized') {
      setTimeout(() => {
        fetchArticles(true);
      }, 0);
    }
  }, [
    activeTab,
    selectedCategory,
    selectedSourceId,
    topOnly,
    sortBy,
    readStatus,
    bookmarkedOnly,
    viewHidden,
    groupDuplicates,
    fetchArticles,
  ]);

  // Infinite Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      if (activeTab !== 'feed' || loading || loadingMore || !hasMore) return;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 250) {
        fetchArticles(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, loading, loadingMore, hasMore, fetchArticles]);

  const handleToggleRead = async (
    articleId: number,
    currentRead: boolean,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const nextRead = !currentRead;
    setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, is_read: nextRead } : a)));
    if (selectedArticle && selectedArticle.id === articleId) {
      setSelectedArticle({ ...selectedArticle, is_read: nextRead });
    }
    try {
      await apiClient.patch(`/articles/${articleId}`, { is_read: nextRead });
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đã đọc:', err);
    }
  };

  const handleToggleBookmark = useCallback(
    async (articleId: number, currentBookmarked: boolean, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const nextBookmarked = !currentBookmarked;
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, is_bookmarked: nextBookmarked } : a))
      );
      if (selectedArticle && selectedArticle.id === articleId) {
        setSelectedArticle((curr) => (curr ? { ...curr, is_bookmarked: nextBookmarked } : null));
      }
      try {
        await apiClient.patch(`/articles/${articleId}`, { is_bookmarked: nextBookmarked });
      } catch (err) {
        console.error('Lỗi cập nhật trạng thái bookmark:', err);
      }
    },
    [selectedArticle]
  );

  const handleToggleHidden = useCallback(
    async (articleId: number, currentHidden: boolean, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const nextHidden = !currentHidden;
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      if (selectedArticle && selectedArticle.id === articleId) {
        setSelectedArticle(null);
      }
      try {
        await apiClient.patch(`/articles/${articleId}`, { is_hidden: nextHidden });
      } catch (err) {
        console.error('Lỗi cập nhật trạng thái ẩn bài:', err);
      }
    },
    [selectedArticle]
  );

  const handleSummarizeArticle = async (articleId: number) => {
    try {
      setSummarizingArticleId(articleId);
      const res = await apiClient.post(
        `/articles/${articleId}/summarize`,
        {},
        {
          timeout: 180000,
        }
      );
      const updated: Article = res.data;
      setArticles((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
      if (selectedArticle && selectedArticle.id === articleId) {
        setSelectedArticle(updated);
      }
      notify('Đã tóm tắt lại bài viết.');
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.message || String(err);
      notify(`Không tóm tắt lại được: ${errMsg}. Thử lại sau ít phút.`, 'error');
    } finally {
      setSummarizingArticleId(null);
    }
  };

  const handleOpenArticle = (article: Article) => {
    setSelectedArticle(article);
    if (!article.is_read) {
      handleToggleRead(article.id, false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchSources();
    }, 0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedArticle(null);
        setShowExplanationModal(false);
        setIsAddSourceOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCrawlAll = async (silent: boolean = false) => {
    try {
      setCrawlingAll(true);
      await apiClient.post('/crawl-all');
      if (!silent) {
        notify('Đang lấy bài mới. Bài sẽ xuất hiện dần khi AI phân tích xong.');
      }
      await fetchArticles();
      await fetchSources();
    } catch (err) {
      if (!silent) notify(`Không cập nhật được tin: ${err}. Kiểm tra backend đang chạy.`, 'error');
    } finally {
      setCrawlingAll(false);
    }
  };

  // Pull to refresh gestures
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (window.scrollY === 0) {
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      setPullStartY(clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isPulling || crawlingAll) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const diff = clientY - pullStartY;
    if (diff > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(diff * 0.45, 90));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance >= 60 && !crawlingAll) {
      setPullDistance(50);
      try {
        await handleCrawlAll(true);
        await fetchArticles();
      } finally {
        setTimeout(() => setPullDistance(0), 400);
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleCrawlSingle = async (sourceId: number) => {
    try {
      await apiClient.post(`/sources/${sourceId}/crawl`);
      notify('Đang lấy bài mới từ nguồn này.');
      await fetchArticles();
      await fetchSources();
    } catch (err) {
      notify(`Không lấy được bài từ nguồn: ${err}`, 'error');
    }
  };

  const handleDeleteSource = async (sourceId: number, name: string) => {
    if (!confirm(`Xoá nguồn "${name}" và toàn bộ bài đã thu thập từ nguồn này?`)) return;
    try {
      await apiClient.delete(`/sources/${sourceId}`);
      await fetchSources();
    } catch (err) {
      notify(`Không xoá được nguồn: ${err}`, 'error');
    }
  };

  const formatGroupDate = (dateStr?: string) => {
    if (!dateStr) return 'Mới cập nhật / Khác';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isToday) return 'Hôm nay';
    if (isYesterday) return 'Hôm qua';

    return d.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const allTechStacks = articles
    .flatMap((a) => (a.new_tech_stacks || []).map((ts) => ({ ...ts, article: a })))
    .filter((ts) => ts.name);

  const getLocalDateKey = (dateStr?: string) => {
    if (!dateStr) return 'unknown';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'unknown';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const groupedArticles = articles.reduce<{ label: string; dateKey: string; items: Article[] }[]>(
    (acc, art) => {
      const targetDate = art.created_at;
      const dateKey = getLocalDateKey(targetDate);
      const label = formatGroupDate(targetDate);
      const existingGroup = acc.find((g) => g.dateKey === dateKey);
      if (existingGroup) {
        existingGroup.items.push(art);
      } else {
        acc.push({ label, dateKey, items: [art] });
      }
      return acc;
    },
    []
  );

  return (
    <div className="bg-paper text-ink min-h-screen w-full max-w-full overflow-x-clip font-sans">
      <FeedHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        crawlingAll={crawlingAll}
        onCrawlAll={() => handleCrawlAll()}
        onOpenExplanation={() => setShowExplanationModal(true)}
        pullDistance={pullDistance}
      />

      <main
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="mx-auto w-full max-w-3xl px-4 pt-5 pb-[calc(var(--app-tabbar-h)+2rem)] sm:px-6 sm:pt-8 lg:max-w-4xl"
      >
        {/* ================= VIEW 1: BÀI ĐỌC (FEED & PERSONALIZED) ================= */}
        {(activeTab === 'feed' || activeTab === 'personalized') && (
          <div>
            {activeTab === 'personalized' ? (
              <PageHeader
                title="Dành cho bạn"
                description="Bài được xếp lại theo chủ đề và nguồn bạn quan tâm. Đánh dấu bài hữu ích hoặc không liên quan để gợi ý chính xác hơn."
              />
            ) : (
              <>
                <h1 className="sr-only">Bản tin</h1>
                <FilterToolbar
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  topOnly={topOnly}
                  setTopOnly={setTopOnly}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSearchSubmit={() => fetchArticles(true)}
                  readStatus={readStatus}
                  setReadStatus={setReadStatus}
                  bookmarkedOnly={bookmarkedOnly}
                  setBookmarkedOnly={setBookmarkedOnly}
                  viewHidden={viewHidden}
                  setViewHidden={setViewHidden}
                  selectedSourceId={selectedSourceId}
                  setSelectedSourceId={setSelectedSourceId}
                  sources={sources}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  groupDuplicates={groupDuplicates}
                  setGroupDuplicates={setGroupDuplicates}
                />
              </>
            )}

            {loading ? (
              <div
                role="status"
                className="text-muted flex items-center justify-center gap-2 py-24 text-[14px]"
              >
                <IconSpinner className="h-4 w-4 animate-spin" />
                Đang tải bài…
              </div>
            ) : articles.length === 0 ? (
              <div className="mx-auto max-w-sm py-20 text-center">
                <IconFeed className="text-faint mx-auto mb-4 h-8 w-8" />
                <h3 className="text-ink text-[17px] font-semibold">Không có bài nào ở đây</h3>
                <p className="text-muted mt-1.5 mb-6 text-[14px] leading-relaxed">
                  Thử bỏ bớt bộ lọc, hoặc lấy bài mới từ các nguồn.
                </p>
                <button onClick={() => handleCrawlAll()} className={primaryButton}>
                  Cập nhật tin
                </button>
              </div>
            ) : (
              <div>
                {groupedArticles.map((group) => (
                  <section key={group.dateKey} aria-labelledby={`day-${group.dateKey}`}>
                    <div
                      style={{ top: 'var(--app-header-h, 64px)' }}
                      className="bg-paper/95 sticky z-20 -mx-4 flex items-baseline justify-between px-4 pt-6 pb-2 backdrop-blur-sm"
                    >
                      <h2
                        id={`day-${group.dateKey}`}
                        className="text-ink text-[15px] font-semibold first-letter:uppercase"
                      >
                        {group.label}
                      </h2>
                      <span className="text-muted text-[13px]">{group.items.length} bài</span>
                    </div>

                    <div className="divide-rule border-rule divide-y border-t">
                      {group.items.map((art) => (
                        <ArticleCard
                          key={art.id}
                          article={art}
                          onOpen={handleOpenArticle}
                          onFeedback={handleFeedback}
                          feedbackState={feedbackMap[art.id]}
                          onToggleBookmark={handleToggleBookmark}
                          onToggleHidden={handleToggleHidden}
                          onFilterSource={(sId) => setSelectedSourceId(sId)}
                        />
                      ))}
                    </div>
                  </section>
                ))}

                {/* Infinite scroll, with a manual fallback */}
                <div className="text-muted pt-8 pb-4 text-center text-[13px]">
                  {loadingMore ? (
                    <span role="status" className="inline-flex items-center gap-2">
                      <IconSpinner className="h-4 w-4 animate-spin" />
                      Đang tải thêm…
                    </span>
                  ) : hasMore ? (
                    <button
                      onClick={() => fetchArticles(false)}
                      className="border-rule text-ink hover:bg-wash cursor-pointer rounded-full border px-5 py-2.5 font-medium transition-colors"
                    >
                      Tải bài cũ hơn
                    </button>
                  ) : (
                    <p>Hết bài trong mục này.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: RADAR TECH & INTELLIGENCE ================= */}
        {activeTab === 'radar' && (
          <div className="space-y-12">
            <Suspense
              fallback={
                <div
                  role="status"
                  className="text-muted flex h-64 items-center justify-center gap-2 text-[14px]"
                >
                  <IconSpinner className="h-4 w-4 animate-spin" />
                  Đang mở radar…
                </div>
              }
            >
              <RadarIntelligenceView
                onSelectArticle={(art) => {
                  const found = articles.find((a) => a.id === art.id);
                  setSelectedArticle(found || art);
                }}
              />
            </Suspense>

            <section aria-labelledby="tech-library">
              <h2 id="tech-library" className={`${sectionHeading} mb-1`}>
                Công nghệ mới xuất hiện
              </h2>
              <p className="text-muted mb-3 text-[13px]">
                Trích từ {articles.length} bài đang tải trong Bản tin.
              </p>
              {allTechStacks.length === 0 ? (
                <p className="text-muted py-6 text-[14px]">
                  Chưa có công nghệ nào. Mở tab Bản tin để tải bài trước.
                </p>
              ) : (
                <ul className="divide-rule border-rule divide-y border-y">
                  {allTechStacks.map((ts, idx) => (
                    <li
                      key={idx}
                      className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[12rem_minmax(0,1fr)]"
                    >
                      <div>
                        <div className="text-ink text-[15px] font-semibold">{ts.name}</div>
                        {ts.category && <div className="text-muted text-[13px]">{ts.category}</div>}
                      </div>
                      <div className="min-w-0">
                        {ts.desc && (
                          <p className="text-ink-2 text-[14px] leading-relaxed">{ts.desc}</p>
                        )}
                        <button
                          onClick={() => setSelectedArticle(ts.article)}
                          className="text-muted decoration-rule-strong hover:text-accent-700 hover:decoration-accent-300 mt-1 cursor-pointer text-left text-[13px] underline underline-offset-2"
                        >
                          {ts.article.vietnamese_title || ts.article.title}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {/* ================= VIEW 3: QUẢN LÝ NGUỒN (SOURCES) ================= */}
        {activeTab === 'sources' && (
          <div>
            <PageHeader
              title="Nguồn tin"
              description="Các trang TechPulse tự động lấy bài. Nguồn bị lỗi sẽ hiện lý do ngay bên dưới tên."
              actions={
                <button onClick={() => setIsAddSourceOpen(true)} className={primaryButton}>
                  <IconPlus className="h-4 w-4" /> Thêm nguồn
                </button>
              }
            />

            <div
              role="group"
              aria-label="Lọc theo nhóm nguồn"
              className="no-scrollbar -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0"
            >
              {[
                { id: 'all', label: 'Tất cả' },
                ...Object.entries(SOURCE_CATEGORY_LABELS).map(([id, label]) => ({ id, label })),
              ].map((c) => {
                const count =
                  c.id === 'all'
                    ? sources.length
                    : sources.filter((s) => s.category === c.id).length;
                const active = sourceCategoryFilter === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSourceCategoryFilter(c.id)}
                    aria-pressed={active}
                    className={`flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-primary font-semibold text-white'
                        : 'text-ink-2 hover:bg-wash font-medium'
                    }`}
                  >
                    {c.label}
                    <span className={`score-numeral ${active ? 'text-white/70' : 'text-faint'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <ul className="divide-rule border-rule divide-y border-y">
              {sources
                .filter(
                  (s) => sourceCategoryFilter === 'all' || s.category === sourceCategoryFilter
                )
                .map((s) => {
                  const status = SOURCE_STATUS[s.status] || SOURCE_STATUS.healthy;
                  return (
                    <li
                      key={s.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 py-4 md:grid-cols-[minmax(0,1fr)_8rem_6rem_8rem_auto] md:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-ink max-w-full truncate text-[15px] font-semibold">
                            {s.name}
                          </span>
                          <span className="text-muted text-[13px]">
                            {SOURCE_CATEGORY_LABELS[s.category] || s.category}
                          </span>
                        </div>
                        <a
                          href={s.feed_url || s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-faint hover:text-accent-700 block truncate text-[13px] hover:underline"
                        >
                          {(s.feed_url || s.url).replace(/^https?:\/\//, '')}
                        </a>
                        {s.status === 'error' && s.last_error && (
                          <p className="text-danger-700 mt-1 text-[13px]">{s.last_error}</p>
                        )}
                      </div>

                      <div className="text-muted col-start-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] md:contents">
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${status.text}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`h-2 w-2 rounded-full ${status.dot}`}
                          />
                          {status.label}
                        </span>
                        <span>
                          <span className="score-numeral text-ink font-semibold">
                            {s.articles_count || 0}
                          </span>{' '}
                          bài
                        </span>
                        <span
                          title={
                            s.last_crawled_at
                              ? new Date(s.last_crawled_at).toLocaleString('vi-VN')
                              : undefined
                          }
                        >
                          {formatRelativeTime(s.last_crawled_at)}
                        </span>
                      </div>

                      <div className="col-start-2 row-span-2 row-start-1 flex items-center gap-1 md:col-start-auto md:row-span-1 md:row-start-auto">
                        <button
                          onClick={() => handleCrawlSingle(s.id)}
                          className="border-rule text-ink hover:bg-wash h-9 cursor-pointer rounded-full border px-3.5 text-[13px] font-medium transition-colors"
                        >
                          Lấy bài
                        </button>
                        <button
                          onClick={() => handleDeleteSource(s.id, s.name)}
                          className="text-faint hover:bg-danger-50 hover:text-danger-700 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors"
                          aria-label={`Xoá nguồn ${s.name}`}
                          title="Xoá nguồn"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}

        {/* ================= VIEW 4: SEMANTIC SEARCH ================= */}
        {activeTab === 'semantic' && (
          <SemanticSearchBar onSelectArticle={(art) => setSelectedArticle(art)} />
        )}

        {/* ================= VIEW 5: ADMIN OBSERVABILITY DASHBOARD ================= */}
        {activeTab === 'admin' && (
          <Suspense
            fallback={
              <div
                role="status"
                className="text-muted flex h-64 items-center justify-center gap-2 text-[14px]"
              >
                <IconSpinner className="h-4 w-4 animate-spin" />
                Đang tải số liệu hệ thống…
              </div>
            }
          >
            <AdminDashboard onRefreshFeed={fetchArticles} />
          </Suspense>
        )}
      </main>

      {/* Sub-component: Modular Article Modal */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onToggleBookmark={(id, current) => handleToggleBookmark(id, current)}
          onToggleHidden={(id, current) => handleToggleHidden(id, current)}
          onSummarize={handleSummarizeArticle}
          summarizing={summarizingArticleId === selectedArticle.id}
          onSelectRelatedArticle={(relatedId) => {
            const target = articles.find((a) => a.id === relatedId);
            if (target) {
              setSelectedArticle(target);
            }
          }}
          onArticleUpdated={(updated) => {
            setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setSelectedArticle(updated);
          }}
        />
      )}

      {/* Sub-component: Modular Explanation Modal */}
      <ExplanationModal
        isOpen={showExplanationModal}
        onClose={() => setShowExplanationModal(false)}
      />

      {/* Sub-component: Modular Add Source Modal */}
      <AddSourceModal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
        onSourceAdded={fetchSources}
      />

      <div
        role={toast?.tone === 'error' ? 'alert' : 'status'}
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--app-tabbar-h)+1rem)] z-50 flex justify-center px-4"
      >
        {toast && (
          <div
            className={`shadow-ink/15 pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl px-4 py-3 text-[14px] leading-snug shadow-lg ${
              toast.tone === 'error' ? 'bg-danger-solid text-white' : 'bg-primary text-white'
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              aria-label="Đóng thông báo"
              className="-mr-1.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/70 hover:text-white"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
