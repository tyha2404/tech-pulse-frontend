import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import {
  Sparkles,
  ExternalLink,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';
import { apiClient, getPersonalizedArticles, sendArticleFeedback } from './api';
import type { Article, Source } from './types';
import { FeedHeader } from './components/FeedHeader';
import { FilterToolbar } from './components/FilterToolbar';
import { ArticleCard } from './components/ArticleCard';
import { ArticleModal } from './components/ArticleModal';
import { ExplanationModal } from './components/ExplanationModal';
import { AddSourceModal } from './components/AddSourceModal';
import { SemanticSearchBar } from './components/SemanticSearchBar';

const RadarIntelligenceView = lazy(() =>
  import('./components/RadarIntelligenceView').then((m) => ({ default: m.RadarIntelligenceView }))
);
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'feed' | 'semantic' | 'personalized' | 'radar' | 'sources' | 'admin'
  >('feed');
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
      alert('Đã tóm tắt lại bài viết bằng AI thành công!');
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.message || String(err);
      alert('Lỗi khi tóm tắt lại bằng AI: ' + errMsg);
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
        alert(
          'Đã kích hoạt cào bài mới trong nền! Các bài viết sẽ lần lượt xuất hiện sau khi AI phân tích.'
        );
      }
      await fetchArticles();
      await fetchSources();
    } catch (err) {
      if (!silent) alert('Lỗi khi cào dữ liệu: ' + err);
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
      alert('Đang cào nguồn tin trong nền!');
      await fetchArticles();
      await fetchSources();
    } catch (err) {
      alert('Lỗi cào nguồn: ' + err);
    }
  };

  const handleDeleteSource = async (sourceId: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá nguồn "${name}"?`)) return;
    try {
      await apiClient.delete(`/sources/${sourceId}`);
      await fetchSources();
    } catch (err) {
      alert('Lỗi khi xoá nguồn: ' + err);
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
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[#fbf9f5] font-serif text-[#2c313a] selection:bg-amber-100 selection:text-amber-900">
      {/* Sub-component: Modular Feed Header */}
      <FeedHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        techStacksCount={allTechStacks.length}
        sourcesCount={sources.length}
        crawlingAll={crawlingAll}
        onCrawlAll={() => handleCrawlAll()}
        onOpenExplanation={() => setShowExplanationModal(true)}
        pullDistance={pullDistance}
      />

      {/* Main Container with Safe Area Bottom */}
      <main
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="mx-auto w-full max-w-5xl px-3 py-4 pb-[max(env(safe-area-inset-bottom,0px),2rem)] sm:px-6 sm:py-8"
      >
        {/* ================= VIEW 1: BÀI ĐỌC (FEED & PERSONALIZED) ================= */}
        {(activeTab === 'feed' || activeTab === 'personalized') && (
          <div>
            {/* Sub-component: Modular FilterToolbar */}
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

            {/* Articles Reading List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-[#756e60]">
                <RefreshCw className="h-6 w-6 animate-spin text-[#4b5563]" />
                <p className="font-sans text-xs">Đang tải các trang bản tin...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="mx-auto max-w-lg rounded-2xl border border-[#e7e2d9] bg-white p-8 py-20 text-center">
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-[#a39c8e]" />
                <h3 className="font-serif text-base font-bold text-[#2c313a]">
                  Chưa có bài viết phù hợp
                </h3>
                <p className="mt-1 mb-5 font-sans text-xs leading-relaxed text-[#756e60]">
                  Hiện chưa có bài báo nào trong mục này. Bạn có thể nhấn nút cập nhật để cào thêm
                  bài mới.
                </p>
                <button
                  onClick={() => handleCrawlAll()}
                  className="cursor-pointer rounded-lg bg-[#2c313a] px-4 py-2 font-sans text-xs font-medium text-white transition hover:bg-[#1a1d23]"
                >
                  Cập nhật tin ngay
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                {groupedArticles.map((group) => (
                  <section key={group.dateKey} className="space-y-4">
                    {/* Date Section Header */}
                    <div
                      style={{ top: 'var(--app-header-h, 72px)' }}
                      className="sticky z-20 flex items-center gap-3 bg-[#fbf9f5]/95 py-2 font-sans backdrop-blur-xs"
                    >
                      <div className="flex items-center gap-1.5 rounded-full border border-[#ded7ca] bg-[#f4efe6] px-3 py-0.5 text-xs font-bold text-[#554e42] shadow-xs">
                        <Clock className="h-3 w-3 text-amber-700" />
                        <span>{group.label}</span>
                      </div>
                      <div className="h-px flex-1 bg-[#e7e2d9]"></div>
                      <span className="text-[11px] text-[#8c8475]">{group.items.length} bài</span>
                    </div>

                    {/* Sub-component: Modular ArticleCard List */}
                    <div className="space-y-5">
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

                {/* Lazyload & Infinite Scroll / Manual Load More */}
                <div className="pt-4 pb-8 text-center font-sans">
                  {loadingMore ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-[#756e60]">
                      <RefreshCw className="h-4 w-4 animate-spin text-[#4b5563]" />
                      <span>Đang cuộn tải thêm bài viết tiếp theo...</span>
                    </div>
                  ) : hasMore ? (
                    <button
                      onClick={() => fetchArticles(false)}
                      className="cursor-pointer rounded-xl border border-[#ded7ca] bg-white px-5 py-2.5 text-xs font-semibold text-[#2c313a] shadow-xs transition hover:bg-[#eee9df]"
                    >
                      Cuộn hoặc bấm vào đây để tải thêm bài cũ hơn
                    </button>
                  ) : (
                    <p className="text-xs text-[#a39c8e]">
                      — Bạn đã xem hết toàn bộ bài viết trong mục này —
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: RADAR TECH & INTELLIGENCE ================= */}
        {activeTab === 'radar' && (
          <div className="space-y-8">
            <Suspense
              fallback={
                <div className="flex h-64 items-center justify-center rounded-2xl border border-[#e7e2d9] bg-white p-8 text-sm text-[#756e60]">
                  <Sparkles className="mr-2 h-5 w-5 animate-spin text-amber-600" />
                  Đang tải Radar Tech Intelligence...
                </div>
              }
            >
              <RadarIntelligenceView
                sourcesCount={sources.length}
                onSelectArticle={(art) => {
                  const found = articles.find((a) => a.id === art.id);
                  setSelectedArticle(found || (art as any));
                }}
              />
            </Suspense>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1c1f24]">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  Thư Viện Công Nghệ Mới Xuất Hiện ({allTechStacks.length} công nghệ)
                </h3>
              </div>

              {allTechStacks.length === 0 ? (
                <div className="rounded-xl border border-[#e7e2d9] bg-white p-8 py-16 text-center">
                  <p className="font-sans text-xs text-[#756e60]">
                    Chưa có công nghệ mới nào được trích xuất.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 font-sans md:grid-cols-2 lg:grid-cols-3">
                  {allTechStacks.map((ts, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedArticle(ts.article)}
                      className="group flex cursor-pointer flex-col justify-between rounded-xl border border-[#e7e2d9] bg-white p-5 shadow-xs transition hover:border-[#cfc7b8] hover:bg-[#fbf9f5]"
                    >
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-mono text-sm font-bold text-[#0f172a] transition group-hover:text-indigo-900">
                            ⚡ {ts.name}
                          </span>
                          <span className="rounded bg-[#f4efe6] px-2 py-0.5 text-[10px] font-semibold text-[#635d52]">
                            {ts.category || 'Tool'}
                          </span>
                        </div>
                        <p className="mb-4 font-serif text-xs leading-relaxed text-[#475569]">
                          {ts.desc || 'Không có mô tả chi tiết.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#f0ece3] pt-3 text-[11px] text-[#756e60]">
                        <span className="max-w-[170px] truncate">
                          Nguồn: {ts.article.source_name}
                        </span>
                        <span className="flex items-center gap-0.5 font-semibold text-[#1c1f24] group-hover:underline">
                          Xem bài <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 3: QUẢN LÝ NGUỒN (SOURCES) ================= */}
        {activeTab === 'sources' && (
          <div className="font-sans">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-[#1c1f24]">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  Bảng Theo Dõi Sức Khỏe Nguồn Tin
                </h2>
                <p className="mt-0.5 text-xs text-[#6b6456]">
                  Quản lý các nguồn cào tự động, kiểm tra tình trạng kết nối và bài viết đã thu
                  thập.
                </p>
              </div>
              <button
                onClick={() => setIsAddSourceOpen(true)}
                className="flex cursor-pointer items-center justify-center gap-1.5 self-start rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800 sm:self-auto"
              >
                <Plus className="h-4 w-4" /> Thêm nguồn tin
              </button>
            </div>

            {/* Category Filter Pills for Sources */}
            <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-[#e7e2d9] pb-3">
              {[
                { id: 'all', label: 'Tất cả nguồn' },
                { id: 'AI & Future Tech', label: '🤖 AI & Công nghệ tương lai' },
                { id: 'Backend & Architecture', label: '⚙️ Backend & Kiến trúc' },
                { id: 'Vietnam Tech', label: '🇻🇳 Tin Việt Nam' },
                { id: 'Global Tech', label: '🌐 Báo Quốc tế' },
              ].map((c) => {
                const count =
                  c.id === 'all'
                    ? sources.length
                    : sources.filter((s) => s.category === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSourceCategoryFilter(c.id)}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs whitespace-nowrap transition ${
                      sourceCategoryFilter === c.id
                        ? 'bg-[#2c313a] font-medium text-white'
                        : 'bg-[#eee9df] text-[#554e42] hover:bg-[#e4ded2]'
                    }`}
                  >
                    {c.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#e7e2d9] bg-white shadow-xs">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="border-b border-[#e7e2d9] bg-[#f7f4ed] font-medium text-[#635d52]">
                  <tr>
                    <th className="p-3.5">Tên Nguồn</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5">Đường Dẫn / RSS</th>
                    <th className="p-3.5">Số Bài Thu Thập</th>
                    <th className="p-3.5">Lần Cào Gần Nhất</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ede8df]">
                  {sources
                    .filter(
                      (s) => sourceCategoryFilter === 'all' || s.category === sourceCategoryFilter
                    )
                    .map((s) => (
                      <tr key={s.id} className="transition hover:bg-[#fbf9f5]">
                        <td className="p-3.5">
                          <div className="font-semibold text-[#1c1f24]">{s.name}</div>
                          <div className="mt-0.5 inline-block rounded bg-[#f4efe6] px-1.5 py-0.5 text-[10px] font-medium text-[#635d52]">
                            {s.category}
                          </div>
                        </td>
                        <td className="p-3.5">
                          {s.status === 'healthy' && (
                            <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" /> Hoạt động tốt
                            </span>
                          )}
                          {s.status === 'error' && (
                            <span
                              className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-800"
                              title={s.last_error}
                            >
                              <AlertCircle className="h-3 w-3" /> Bị lỗi
                            </span>
                          )}
                          {s.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                              <Clock className="h-3 w-3 animate-spin" /> Đang cào...
                            </span>
                          )}
                        </td>
                        <td className="max-w-[200px] truncate p-3.5 font-mono text-[11px] text-[#756e60]">
                          <a
                            href={s.feed_url || s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 underline hover:text-[#1c1f24]"
                          >
                            {s.feed_url || s.url} <ExternalLink className="inline h-2.5 w-2.5" />
                          </a>
                        </td>
                        <td className="p-3.5 font-semibold text-[#2c313a]">
                          {s.articles_count || 0} bài
                        </td>
                        <td className="p-3.5 text-[#756e60]">
                          {s.last_crawled_at
                            ? new Date(s.last_crawled_at).toLocaleTimeString('vi-VN') +
                              ' ' +
                              new Date(s.last_crawled_at).toLocaleDateString('vi-VN')
                            : 'Chưa cào'}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleCrawlSingle(s.id)}
                              className="cursor-pointer rounded border border-[#ded7ca] bg-[#f4efe6] px-2.5 py-1 text-[11px] font-medium text-[#2c313a] transition hover:bg-[#eae4d7]"
                            >
                              Cào ngay
                            </button>
                            <button
                              onClick={() => handleDeleteSource(s.id, s.name)}
                              className="cursor-pointer p-1 text-[#8c8475] transition hover:text-rose-600"
                              title="Xóa nguồn tin này"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
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
              <div className="flex h-64 items-center justify-center rounded-2xl border border-[#e7e2d9] bg-white p-8 text-sm text-[#756e60]">
                <RefreshCw className="mr-2 h-5 w-5 animate-spin text-indigo-700" />
                Đang tải Admin Observability Dashboard...
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
    </div>
  );
}
