import React, { useState, useEffect } from 'react';
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
  Flame,
  Layers,
  X,
  Search,
  BookOpen,
  ArrowUpRight,
  HelpCircle,
  EyeOff,
  Eye,
  ArrowUpDown,
  ArrowDown,
  Bookmark,
} from 'lucide-react';
import { apiClient } from './api';
import type { Article, Source, CrawlTestResult } from './types';
import { ArticleModalTabs } from './components/ArticleModalTabs';
import { RadarIntelligenceView } from './components/RadarIntelligenceView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'radar' | 'sources'>('feed');
  const [articles, setArticles] = useState<Article[]>([]);
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
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [topOnly, setTopOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score'>('newest');
  const [readStatus, setReadStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState<boolean>(false);
  const [viewHidden, setViewHidden] = useState<boolean>(false);

  // Modals & Details
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [summarizingArticleId, setSummarizingArticleId] = useState<number | null>(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // New source modal state
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceCategory, setNewSourceCategory] = useState('Backend & Tech');
  const [testingSource, setTestingSource] = useState(false);
  const [testResult, setTestResult] = useState<CrawlTestResult | null>(null);

  const PAGE_SIZE = 20;

  const fetchArticles = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const currentOffset = reset ? 0 : articles.length;
      const params: any = {
        sort_by: sortBy,
        read_status: readStatus,
        bookmarked_only: bookmarkedOnly,
        include_hidden: viewHidden,
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
        // Prevent duplicate keys if items shifted
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
  };

  const fetchSources = async () => {
    try {
      const res = await apiClient.get('/sources');
      setSources(res.data);
    } catch (err) {
      console.error('Error loading sources', err);
    }
  };

  useEffect(() => {
    fetchArticles(true);
  }, [selectedCategory, selectedSourceId, topOnly, sortBy, readStatus, bookmarkedOnly, viewHidden]);

  // Infinite Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      if (activeTab !== 'feed' || loading || loadingMore || !hasMore) return;
      // When scrolled near the bottom (within 250px)
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 250
      ) {
        fetchArticles(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, loading, loadingMore, hasMore, articles.length, selectedCategory, selectedSourceId, topOnly, sortBy, readStatus, bookmarkedOnly, viewHidden, searchQuery]);

  // Handlers for mark read / unread and hide / unhide
  const handleToggleRead = async (articleId: number, currentRead: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextRead = !currentRead;
    // Optimistic UI
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, is_read: nextRead } : a))
    );
    if (selectedArticle && selectedArticle.id === articleId) {
      setSelectedArticle({ ...selectedArticle, is_read: nextRead });
    }
    try {
      await apiClient.patch(`/articles/${articleId}`, { is_read: nextRead });
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đã đọc:', err);
    }
  };

  const handleToggleBookmark = async (
    articleId: number,
    currentBookmarked: boolean,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const nextBookmarked = !currentBookmarked;
    // Optimistic UI
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, is_bookmarked: nextBookmarked } : a))
    );
    if (selectedArticle && selectedArticle.id === articleId) {
      setSelectedArticle({ ...selectedArticle, is_bookmarked: nextBookmarked });
    }
    try {
      await apiClient.patch(`/articles/${articleId}`, { is_bookmarked: nextBookmarked });
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái bookmark:', err);
    }
  };

  const handleSummarizeArticle = async (articleId: number) => {
    try {
      setSummarizingArticleId(articleId);
      const res = await apiClient.post(`/articles/${articleId}/summarize`);
      const updated: Article = res.data;
      setArticles((prev) => prev.map((a) => (a.id === articleId ? updated : a)));
      if (selectedArticle && selectedArticle.id === articleId) {
        setSelectedArticle(updated);
      }
      alert('Đã tóm tắt lại bài viết bằng AI thành công!');
    } catch (err) {
      alert('Lỗi khi tóm tắt lại bằng AI: ' + err);
    } finally {
      setSummarizingArticleId(null);
    }
  };

  const handleToggleHidden = async (
    articleId: number,
    currentHidden: boolean,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const nextHidden = !currentHidden;
    // Optimistic UI: remove from current view
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
    if (selectedArticle && selectedArticle.id === articleId) {
      setSelectedArticle(null);
    }
    try {
      await apiClient.patch(`/articles/${articleId}`, { is_hidden: nextHidden });
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái ẩn bài:', err);
    }
  };

  const handleOpenArticle = (article: Article) => {
    setSelectedArticle(article);
    if (!article.is_read) {
      handleToggleRead(article.id, false);
    }
  };

  useEffect(() => {
    fetchSources();
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

  // Pull to refresh gesture logic
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
      // Elastic damping effect
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
        // Refresh articles
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

  const handleTestSource = async () => {
    if (!newSourceUrl) return;
    setTestingSource(true);
    setTestResult(null);
    try {
      const res = await apiClient.post('/sources/test', null, {
        params: { target_url: newSourceUrl },
      });
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({
        success: false,
        detected_type: 'unknown',
        items_count: 0,
        sample_titles: [],
        error: err?.response?.data?.detail || err.message,
      });
    } finally {
      setTestingSource(false);
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/sources', {
        name: newSourceName,
        url: newSourceUrl,
        category: newSourceCategory,
        is_active: true,
      });
      setIsAddSourceOpen(false);
      setNewSourceName('');
      setNewSourceUrl('');
      setTestResult(null);
      await fetchSources();
    } catch (err: any) {
      alert('Lỗi: ' + (err?.response?.data?.detail || err.message));
    }
  };

  // Group articles by published date
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

  // Group tech stacks with articles
  const allTechStacks = articles
    .flatMap((a) => (a.new_tech_stacks || []).map((ts) => ({ ...ts, article: a })))
    .filter((ts) => ts.name);

  // Group current articles into ordered date sections
  const groupedArticles = articles.reduce<{ label: string; dateKey: string; items: Article[] }[]>(
    (acc, art) => {
      const dateKey = art.published_at ? art.published_at.slice(0, 10) : 'unknown';
      const label = formatGroupDate(art.published_at);
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
    <div className="min-h-screen bg-[#fbf9f5] font-serif text-[#2c313a] selection:bg-amber-100 selection:text-amber-900">
      {/* Top Header - Book / Newspaper Masthead Style */}
      <header className="sticky top-0 z-30 border-b border-[#e7e2d9] bg-[#fbf9f5]/95 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#24292f] font-serif text-base font-bold text-white shadow-sm">
              TP
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-[#1c1f24] sm:text-xl">
                  TechPulse
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Bar */}
          <div className="hidden items-center rounded-lg border border-[#e2dcd0] bg-[#eee9df]/80 p-1 font-sans md:flex">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
                activeTab === 'feed'
                  ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
                  : 'text-[#6b6456] hover:text-[#1c1f24]'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> Bài đọc
            </button>
            <button
              onClick={() => setActiveTab('radar')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
                activeTab === 'radar'
                  ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
                  : 'text-[#6b6456] hover:text-[#1c1f24]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Radar Tech ({allTechStacks.length}
              )
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
                activeTab === 'sources'
                  ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
                  : 'text-[#6b6456] hover:text-[#1c1f24]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Nguồn tin ({sources.length})
            </button>
          </div>

          {/* Top Actions */}
          <div className="flex shrink-0 items-center gap-1.5 font-sans sm:gap-2">
            <button
              onClick={() => setShowExplanationModal(true)}
              className="cursor-pointer rounded-lg border border-[#e2dcd0] p-1.5 text-[#756e60] transition hover:bg-[#eee9df] hover:text-[#1c1f24] sm:p-2"
              title="Tìm hiểu về Điểm AI & Radar Tech Stack"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleCrawlAll()}
              disabled={crawlingAll}
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#2c313a] px-2.5 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-[#1a1d23] disabled:opacity-50 sm:gap-1.5 sm:px-3.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${crawlingAll ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {crawlingAll ? 'Đang cập nhật...' : 'Cập nhật tin mới'}
              </span>
              <span className="sm:hidden">{crawlingAll ? 'Đang cào' : 'Cập nhật'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="mt-2.5 flex items-center justify-around border-t border-[#e7e2d9]/60 pt-2 font-sans text-xs md:hidden">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex flex-1 items-center justify-center gap-1 rounded py-1.5 text-center font-medium ${
              activeTab === 'feed' ? 'bg-[#eee9df] font-bold text-[#1c1f24]' : 'text-[#6b6456]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Bài đọc
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`flex flex-1 items-center justify-center gap-1 rounded py-1.5 text-center font-medium ${
              activeTab === 'radar' ? 'bg-[#eee9df] font-bold text-[#1c1f24]' : 'text-[#6b6456]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Radar ({allTechStacks.length})
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`flex flex-1 items-center justify-center gap-1 rounded py-1.5 text-center font-medium ${
              activeTab === 'sources' ? 'bg-[#eee9df] font-bold text-[#1c1f24]' : 'text-[#6b6456]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> Nguồn ({sources.length})
          </button>
        </div>
      </header>

      {/* Main Reading Container */}
      <main
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="mx-auto max-w-5xl px-6 py-8"
      >
        {/* Pull-To-Refresh Indicator */}
        {(pullDistance > 0 || crawlingAll) && activeTab === 'feed' && (
          <div
            style={{ height: `${crawlingAll ? 48 : pullDistance}px` }}
            className="flex items-center justify-center overflow-hidden transition-all duration-200"
          >
            <div className="flex items-center gap-2 rounded-full border border-[#ded7ca] bg-white px-3.5 py-1.5 font-sans text-xs font-medium text-[#2c313a] shadow-xs">
              {crawlingAll ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#4b5563]" />
                  <span>Đang cào & cập nhật bài mới từ các nguồn...</span>
                </>
              ) : pullDistance >= 60 ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Thả tay để kích hoạt cào bài mới ngay</span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-3.5 w-3.5 text-[#8c8475]" />
                  <span>Kéo xuống để cập nhật tin mới</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 1: BÀI ĐỌC (FEED) ================= */}
        {activeTab === 'feed' && (
          <div>
            {/* Filter & Sort Bar */}
            <div className="mb-6 space-y-3 border-b border-[#e7e2d9] pb-4 font-sans">
              {/* Row 1: Categories & Search */}
              <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex scrollbar-none items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'AI', label: 'Trí tuệ nhân tạo (AI)' },
                    { id: 'Backend', label: 'Backend & Kiến trúc' },
                    { id: 'Vietnam', label: 'Tin Việt Nam' },
                    { id: 'Global', label: 'Báo Quốc tế' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedCategory(tab.id)}
                      className={`rounded-full px-3 py-1 text-xs whitespace-nowrap transition ${
                        selectedCategory === tab.id
                          ? 'bg-[#2c313a] font-medium text-white'
                          : 'bg-[#eee9df] text-[#554e42] hover:bg-[#e4ded2]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}

                  <button
                    onClick={() => setTopOnly(!topOnly)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs whitespace-nowrap transition ${
                      topOnly
                        ? 'border-amber-300 bg-amber-100 font-medium text-amber-900 shadow-xs'
                        : 'border-[#dcd5c7] bg-transparent text-[#6b6456] hover:bg-[#eee9df]'
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5 text-amber-600" />
                    Bài tinh tuyển (≥7.5)
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative shrink-0">
                  <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-[#8c8475]" />
                  <input
                    type="text"
                    placeholder="Tìm chủ đề, công nghệ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchArticles(true)}
                    className="w-full rounded-full border border-[#dcd5c7] bg-white py-1.5 pr-4 pl-8.5 text-xs text-[#2c313a] placeholder-[#9c9485] focus:border-[#7c7465] focus:outline-none sm:w-56"
                  />
                </div>
              </div>

              {/* Row 2: Read Status Filter + Sort Selector + Hidden View Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                {/* Read Status Selector */}
                <div className="flex items-center rounded-lg border border-[#e2dcd0] bg-[#eee9df]/80 p-0.5">
                  <button
                    onClick={() => {
                      setViewHidden(false);
                      setBookmarkedOnly(false);
                      setReadStatus('all');
                    }}
                    className={`rounded px-2.5 py-1 transition ${
                      !viewHidden && !bookmarkedOnly && readStatus === 'all'
                        ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
                        : 'text-[#6b6456] hover:text-[#1c1f24]'
                    }`}
                  >
                    Tất cả bài
                  </button>
                  <button
                    onClick={() => {
                      setViewHidden(false);
                      setBookmarkedOnly(false);
                      setReadStatus('unread');
                    }}
                    className={`rounded px-2.5 py-1 transition ${
                      !viewHidden && !bookmarkedOnly && readStatus === 'unread'
                        ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
                        : 'text-[#6b6456] hover:text-[#1c1f24]'
                    }`}
                  >
                    Chưa đọc
                  </button>
                  <button
                    onClick={() => {
                      setViewHidden(false);
                      setBookmarkedOnly(false);
                      setReadStatus('read');
                    }}
                    className={`rounded px-2.5 py-1 transition ${
                      !viewHidden && !bookmarkedOnly && readStatus === 'read'
                        ? 'bg-white font-semibold text-[#1c1f24] shadow-xs'
                        : 'text-[#6b6456] hover:text-[#1c1f24]'
                    }`}
                  >
                    Đã đọc
                  </button>
                  <button
                    onClick={() => {
                      setViewHidden(false);
                      setBookmarkedOnly(true);
                    }}
                    className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
                      !viewHidden && bookmarkedOnly
                        ? 'bg-amber-100 font-semibold text-amber-900 shadow-xs'
                        : 'text-[#6b6456] hover:text-[#1c1f24]'
                    }`}
                  >
                    <Bookmark className="h-3 w-3 text-amber-700" fill={bookmarkedOnly ? 'currentColor' : 'none'} />
                    Đã lưu
                  </button>
                </div>

                {/* Right controls: Source Filter, Sort Dropdown & Hidden Toggle */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Source Selector Dropdown */}
                  <div className="flex items-center gap-1.5 text-[#6b6456]">
                    <Layers className="h-3.5 w-3.5 text-[#8c8475]" />
                    <span className="text-[11px] text-[#756e60]">Nguồn:</span>
                    <select
                      value={selectedSourceId || ''}
                      onChange={(e) => setSelectedSourceId(e.target.value ? Number(e.target.value) : null)}
                      className="cursor-pointer rounded-lg border border-[#ded7ca] bg-white px-2.5 py-1 text-xs font-medium text-[#2c313a] focus:border-[#7c7465] focus:outline-none max-w-[150px] truncate"
                    >
                      <option value="">Tất cả nguồn ({sources.length})</option>
                      {sources.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.articles_count || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* View Hidden Toggle */}
                  <button
                    onClick={() => setViewHidden(!viewHidden)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition ${
                      viewHidden
                        ? 'border-rose-300 bg-rose-50 font-semibold text-rose-800 shadow-xs'
                        : 'border-[#ded7ca] bg-white text-[#6b6456] hover:bg-[#eee9df]'
                    }`}
                    title={viewHidden ? 'Quay lại bản tin bình thường' : 'Xem danh sách bài bạn đã ẩn'}
                  >
                    {viewHidden ? (
                      <>
                        <Eye className="h-3.5 w-3.5 text-rose-700" />
                        Đang xem bài đã ẩn
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5 text-[#8c8475]" />
                        Bài đã ẩn
                      </>
                    )}
                  </button>

                  {/* Sort Selector */}
                  <div className="flex items-center gap-1.5 text-[#6b6456]">
                    <ArrowUpDown className="h-3.5 w-3.5 text-[#8c8475]" />
                    <span className="text-[11px] text-[#756e60]">Sắp xếp:</span>
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="cursor-pointer rounded-lg border border-[#ded7ca] bg-white px-2.5 py-1 text-xs font-medium text-[#2c313a] focus:border-[#7c7465] focus:outline-none"
                    >
                      <option value="newest">Mới nhất (Mặc định)</option>
                      <option value="oldest">Cũ nhất</option>
                      <option value="score">Điểm AI cao nhất</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Active Source Filter Tag */}
              {selectedSourceId && (
                <div className="flex items-center gap-2 pt-1 font-sans">
                  <span className="text-xs text-[#756e60]">Đang lọc theo nguồn:</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-0.5 text-xs font-semibold text-indigo-900 shadow-xs">
                    {sources.find((s) => s.id === selectedSourceId)?.name || 'Nguồn tin'}
                    <button
                      onClick={() => setSelectedSourceId(null)}
                      className="cursor-pointer rounded-full p-0.5 hover:bg-indigo-200 hover:text-indigo-950"
                      title="Bỏ lọc theo nguồn này"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                </div>
              )}
            </div>

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
                    <div className="sticky top-[57px] z-20 flex items-center gap-3 bg-[#fbf9f5]/95 py-2 backdrop-blur-xs font-sans">
                      <div className="flex items-center gap-1.5 rounded-full border border-[#ded7ca] bg-[#f4efe6] px-3 py-0.5 text-xs font-bold text-[#554e42] shadow-xs">
                        <Clock className="h-3 w-3 text-amber-700" />
                        <span>{group.label}</span>
                      </div>
                      <div className="h-px flex-1 bg-[#e7e2d9]"></div>
                      <span className="text-[11px] text-[#8c8475]">
                        {group.items.length} bài
                      </span>
                    </div>

                    {/* Articles in Date Group */}
                    <div className="space-y-5">
                      {group.items.map((art) => (
                        <article
                          key={art.id}
                          onClick={() => handleOpenArticle(art)}
                          className={`group relative cursor-pointer rounded-xl border p-6 shadow-xs transition ${
                            art.is_read
                              ? 'border-[#ede7dc] bg-[#faf8f4] opacity-80 hover:border-[#cfc7b8] hover:opacity-100'
                              : 'border-[#e7e2d9] bg-white hover:border-[#cfc7b8] hover:bg-[#fcfbf9]'
                          }`}
                        >
                          {/* Header meta */}
                          <div className="mb-2.5 flex items-center justify-between gap-3 font-sans">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                onClick={(e) => {
                                  if (art.source_id) {
                                    e.stopPropagation();
                                    setSelectedSourceId(art.source_id);
                                  }
                                }}
                                className="cursor-pointer rounded bg-[#f4efe6] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#756e60] uppercase transition hover:bg-[#e7e1d5] hover:text-[#1c1f24]"
                                title={`Bấm để chỉ xem các bài từ ${art.source_name || 'nguồn này'}`}
                              >
                                {art.source_name || 'Bản tin'}
                              </span>
                              <span className="text-[11px] text-[#8c8475]">
                                {art.published_at
                                  ? new Date(art.published_at).toLocaleTimeString('vi-VN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Mới cập nhật'}
                              </span>
                              <span className="text-[11px] text-[#a8a193]">·</span>
                              <span className="flex items-center gap-0.5 text-[11px] text-[#8c8475]">
                                <Clock className="inline h-3 w-3" />{' '}
                                {art.reading_time_minutes || Math.max(1, Math.ceil((art.vietnamese_summary?.length || 300) / 350))}{' '}
                                phút đọc
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {art.relevance_score > 0 && (
                                <span
                                  className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                                    art.relevance_score >= 8.0
                                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                                      : art.relevance_score >= 6.0
                                        ? 'border border-amber-200 bg-amber-50 text-amber-800'
                                        : 'bg-stone-100 text-stone-600'
                                  }`}
                                >
                                  Điểm: {art.relevance_score.toFixed(1)}/10
                                </span>
                              )}

                              {/* Quick action: Bookmark */}
                              <button
                                onClick={(e) => handleToggleBookmark(art.id, art.is_bookmarked, e)}
                                className={`cursor-pointer rounded-md p-1.5 transition ${
                                  art.is_bookmarked
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                    : 'text-[#8c8475] hover:bg-amber-50 hover:text-amber-700'
                                }`}
                                title={art.is_bookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết vào đọc sau'}
                              >
                                <Bookmark className="h-4 w-4" fill={art.is_bookmarked ? 'currentColor' : 'none'} />
                              </button>

                              {/* Quick action: Hide / Unhide */}
                              <button
                                onClick={(e) => handleToggleHidden(art.id, art.is_hidden, e)}
                                className={`cursor-pointer rounded-md p-1.5 transition ${
                                  art.is_hidden
                                    ? 'text-rose-700 hover:bg-rose-100'
                                    : 'text-[#8c8475] hover:bg-rose-50 hover:text-rose-600'
                                }`}
                                title={art.is_hidden ? 'Bỏ ẩn bài viết này' : 'Không thích / Ẩn bài viết'}
                              >
                                {art.is_hidden ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Article Title */}
                          <h2
                            className={`mb-2.5 font-serif text-lg leading-snug font-bold transition md:text-xl ${
                              art.is_read
                                ? 'text-[#474e5a] group-hover:text-indigo-950'
                                : 'text-[#1a1d20] group-hover:text-indigo-950'
                            }`}
                          >
                            {art.vietnamese_title || art.title}
                          </h2>

                          {/* Editorial Summary */}
                          <p
                            className={`mb-3 font-serif text-[14px] leading-relaxed ${
                              art.is_read ? 'text-[#646a75]' : 'text-[#4a4f59]'
                            }`}
                          >
                            {art.vietnamese_summary || art.title}
                          </p>

                          {/* Key Takeaways Preview (3 bullet points) */}
                          {art.key_takeaways && art.key_takeaways.length > 0 && (
                            <div className="mb-3 rounded-lg border border-[#eee8dd] bg-[#faf8f5] p-3 text-xs">
                              <div className="mb-1.5 flex items-center gap-1 font-sans font-bold text-[#635c50] uppercase tracking-wider text-[10px]">
                                <Sparkles className="h-3 w-3 text-amber-600" /> Điểm cốt lõi kỹ thuật:
                              </div>
                              <ul className="space-y-1 font-serif text-[#3f4651]">
                                {art.key_takeaways.slice(0, 3).map((point, pIdx) => (
                                  <li key={pIdx} className="flex items-start gap-1.5">
                                    <span className="text-amber-700 font-bold">•</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Bottom row: Tech tags & Read CTA */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0ece3] pt-3 font-sans">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {art.new_tech_stacks &&
                                art.new_tech_stacks.length > 0 &&
                                art.new_tech_stacks.slice(0, 3).map((ts, idx) => (
                                  <span
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenArticle(art);
                                    }}
                                    className="rounded border border-[#e2dcd0] bg-[#f4f1ea] px-2 py-0.5 font-mono text-[11px] text-[#334155] transition hover:bg-[#e9e4d9]"
                                  >
                                    ⚡ {ts.name}
                                  </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-3">
                              {art.is_read && (
                                <span className="text-[11px] text-[#8c8475] italic">Đã đọc</span>
                              )}
                              <span className="flex items-center gap-1 text-xs font-semibold text-[#2c313a] group-hover:text-indigo-800">
                                Mở chi tiết <ArrowUpRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}

                {/* Lazyload & Infinite Scroll Indicator / Manual Load More */}
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
            <RadarIntelligenceView
              onSelectArticle={(art) => {
                // Find full article from list if present, else set it directly
                const found = articles.find((a) => a.id === art.id);
                setSelectedArticle(found || (art as any));
              }}
            />

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
            <div className="mb-6 flex items-center justify-between">
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
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800"
              >
                <Plus className="h-4 w-4" /> Thêm nguồn tin
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#e7e2d9] bg-white shadow-xs">
              <table className="w-full text-left text-xs">
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
                  {sources.map((s) => (
                    <tr key={s.id} className="transition hover:bg-[#fbf9f5]">
                      <td className="p-3.5">
                        <div className="font-semibold text-[#1c1f24]">{s.name}</div>
                        <div className="text-[11px] text-[#756e60]">{s.category}</div>
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
      </main>

      {/* ================= READING DRAWER / MODAL (EDITORIAL STYLE) ================= */}
      {selectedArticle && (
        <div
          onClick={() => setSelectedArticle(null)}
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-in fade-in flex max-h-[90vh] w-full max-w-4xl cursor-default flex-col overflow-hidden rounded-2xl border border-[#e7e2d9] bg-[#fbf9f5] shadow-2xl"
          >
            {/* Masthead */}
            <div className="flex items-start justify-between gap-4 border-b border-[#e7e2d9] bg-white p-6">
              <div>
                <div className="mb-2 flex items-center gap-2 font-sans">
                  <span className="rounded bg-[#f4efe6] px-2 py-0.5 text-[11px] font-semibold text-[#635d52]">
                    {selectedArticle.source_name}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                      selectedArticle.relevance_score >= 8.0
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                        : selectedArticle.relevance_score >= 6.0
                          ? 'border border-amber-200 bg-amber-50 text-amber-800'
                          : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    Điểm AI: {selectedArticle.relevance_score.toFixed(1)}/10
                  </span>
                </div>
                <h2 className="font-serif text-xl leading-snug font-bold text-[#1c1f24]">
                  {selectedArticle.vietnamese_title || selectedArticle.title}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 font-sans">
                {/* Bookmark Button */}
                <button
                  onClick={() =>
                    handleToggleBookmark(selectedArticle.id, selectedArticle.is_bookmarked)
                  }
                  className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                    selectedArticle.is_bookmarked
                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                      : 'border-[#ded7ca] bg-white text-[#6b6456] hover:bg-amber-50 hover:text-amber-800'
                  }`}
                  title={selectedArticle.is_bookmarked ? 'Bỏ lưu bài này' : 'Lưu bài vào đọc sau'}
                >
                  <Bookmark
                    className="h-3.5 w-3.5"
                    fill={selectedArticle.is_bookmarked ? 'currentColor' : 'none'}
                  />
                  <span className="hidden sm:inline">
                    {selectedArticle.is_bookmarked ? 'Đã lưu' : 'Lưu bài'}
                  </span>
                </button>

                {/* Hide Button */}
                <button
                  onClick={() => handleToggleHidden(selectedArticle.id, selectedArticle.is_hidden)}
                  className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                    selectedArticle.is_hidden
                      ? 'border-rose-300 bg-rose-50 text-rose-800'
                      : 'border-[#ded7ca] bg-white text-[#6b6456] hover:bg-rose-50 hover:text-rose-700'
                  }`}
                  title={selectedArticle.is_hidden ? 'Bỏ ẩn bài này' : 'Ẩn bài viết này'}
                >
                  {selectedArticle.is_hidden ? (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Bỏ ẩn bài</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Ẩn bài</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSelectedArticle(null)}
                  className="cursor-pointer rounded-lg p-1.5 text-[#756e60] transition hover:bg-[#f4efe6] hover:text-[#1c1f24]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Reading Content with Deep AI Tabs */}
            <div className="overflow-y-auto">
              <ArticleModalTabs
                article={selectedArticle}
                onSummarize={async (id) => {
                  await handleSummarizeArticle(id);
                }}
                summarizing={summarizingArticleId === selectedArticle.id}
                onSelectRelatedArticle={async (relatedId) => {
                  const target = articles.find((a) => a.id === relatedId);
                  if (target) {
                    setSelectedArticle(target);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= EXPLANATION MODAL ================= */}
      {showExplanationModal && (
        <div
          onClick={() => setShowExplanationModal(false)}
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/40 p-4 font-sans backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-in fade-in w-full max-w-lg cursor-default rounded-2xl border border-[#e7e2d9] bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#e7e2d9] pb-3">
              <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1c1f24]">
                <HelpCircle className="h-5 w-5 text-indigo-900" /> Về Điểm AI & Radar Tech Stack
              </h3>
              <button
                onClick={() => setShowExplanationModal(false)}
                className="cursor-pointer rounded-lg p-1 text-[#756e60] transition hover:bg-[#f4efe6] hover:text-[#1c1f24]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-[#475569]">
              <div className="rounded-xl border border-[#e7e2d9] bg-[#fcfbf9] p-4">
                <h4 className="mb-1.5 flex items-center gap-1 text-xs font-bold text-[#1e293b]">
                  ⭐ Điểm AI (1.0 đến 10.0) là gì?
                </h4>
                <p>
                  AI đọc toàn bộ bài báo và chấm điểm theo tiêu chí: chiều sâu kỹ thuật, tính thực
                  tiễn và bài học giá trị cho kỹ sư Backend & AI.
                </p>
                <div className="mt-2 space-y-1">
                  <div>
                    • <strong className="text-emerald-800">Từ 8.0 - 10.0:</strong> Bài xuất sắc
                    (System Architecture, DB Sharding, Nghiên cứu AI mới).
                  </div>
                  <div>
                    • <strong className="text-amber-800">Từ 6.0 - 7.9:</strong> Bài đáng đọc (Tin
                    công nghệ đáng chú ý).
                  </div>
                  <div>
                    • <strong className="text-stone-600">Dưới 5.0:</strong> Bài quảng cáo PR hoặc
                    tin giật gân không có chiều sâu.
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#e7e2d9] bg-[#fcfbf9] p-4">
                <h4 className="mb-1.5 flex items-center gap-1 text-xs font-bold text-[#1e293b]">
                  ⚡ Radar Tech Stack là gì?
                </h4>
                <p>
                  Tự động trích xuất các công nghệ, framework, library, database mới xuất hiện để
                  dev không bị outdate.
                </p>
                <p className="mt-2 font-semibold text-[#0f172a]">
                  👉 Bấm vào bất kỳ thẻ công nghệ nào sẽ mở ngay bài viết và phân tích chi tiết liên
                  quan đến công nghệ đó.
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-[#e7e2d9] pt-4">
              <button
                onClick={() => setShowExplanationModal(false)}
                className="cursor-pointer rounded-lg bg-[#2c313a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a1d23]"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: THÊM NGUỒN ================= */}
      {isAddSourceOpen && (
        <div
          onClick={() => setShowExplanationModal(false)}
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/40 p-4 font-sans backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-in fade-in w-full max-w-lg cursor-default rounded-2xl border border-[#e7e2d9] bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#e7e2d9] pb-3">
              <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1c1f24]">
                <Plus className="h-5 w-5 text-emerald-700" /> Thêm Nguồn Tin Bằng URL
              </h3>
              <button
                onClick={() => setIsAddSourceOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-[#756e60] transition hover:bg-[#f4efe6] hover:text-[#1c1f24]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSource} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-medium text-[#475569]">Tên nguồn tin:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Netflix Engineering Blog"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#dcd5c7] bg-white p-2.5 text-[#1e293b] focus:border-[#7c7465] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-[#475569]">
                  URL Trang web hoặc RSS Feed:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://netflixtechblog.com"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    required
                    className="flex-1 rounded-lg border border-[#dcd5c7] bg-white p-2.5 text-[#1e293b] focus:border-[#7c7465] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleTestSource}
                    disabled={testingSource || !newSourceUrl}
                    className="cursor-pointer rounded-lg border border-[#ded7ca] bg-[#f4efe6] px-3.5 py-2 font-medium text-[#2c313a] transition hover:bg-[#eae4d7] disabled:opacity-50"
                  >
                    {testingSource ? 'Đang test...' : 'Kiểm tra'}
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`rounded-lg border p-3.5 ${
                    testResult.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-rose-200 bg-rose-50 text-rose-900'
                  }`}
                >
                  {testResult.success ? (
                    <div>
                      <div className="mb-1 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-4 w-4" /> Kết nối thành công! Tìm thấy{' '}
                        {testResult.items_count} bài viết.
                      </div>
                      {testResult.sample_titles && testResult.sample_titles.length > 0 && (
                        <div className="mt-1 text-[11px] text-[#475569]">
                          Bài mẫu: "{testResult.sample_titles[0]}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>Lỗi kiểm tra: {testResult.error}</div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1 block font-medium text-[#475569]">Chủ đề:</label>
                <select
                  value={newSourceCategory}
                  onChange={(e) => setNewSourceCategory(e.target.value)}
                  className="w-full rounded-lg border border-[#dcd5c7] bg-white p-2.5 text-[#1e293b] focus:border-[#7c7465] focus:outline-none"
                >
                  <option value="AI & LLM">AI & LLM</option>
                  <option value="Backend Architecture">Backend & Kiến trúc hệ thống</option>
                  <option value="Global Tech">Báo công nghệ thế giới</option>
                  <option value="Vietnam Tech">Tin công nghệ Việt Nam</option>
                  <option value="General">Chung (General Tech)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#e7e2d9] pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddSourceOpen(false)}
                  className="cursor-pointer rounded-lg bg-[#f4efe6] px-4 py-2 font-medium text-[#475569] hover:bg-[#eae4d7]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800"
                >
                  Lưu nguồn tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
