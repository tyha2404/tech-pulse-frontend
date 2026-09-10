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
} from 'lucide-react';
import { apiClient } from './api';
import type { Article, Source, CrawlTestResult } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'radar' | 'sources'>('feed');
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [crawlingAll, setCrawlingAll] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [topOnly, setTopOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Details
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // New source modal state
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceCategory, setNewSourceCategory] = useState('Backend & Tech');
  const [testingSource, setTestingSource] = useState(false);
  const [testResult, setTestResult] = useState<CrawlTestResult | null>(null);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (topOnly) params.top_only = true;
      if (searchQuery) params.query = searchQuery;
      const res = await apiClient.get('/articles', { params });
      setArticles(res.data);
    } catch (err) {
      console.error('Error loading articles', err);
    } finally {
      setLoading(false);
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
    fetchArticles();
  }, [selectedCategory, topOnly]);

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

  const handleCrawlAll = async () => {
    try {
      setCrawlingAll(true);
      await apiClient.post('/crawl-all');
      alert(
        'Đã kích hoạt cào bài mới trong nền! Các bài viết sẽ lần lượt xuất hiện sau khi AI phân tích.'
      );
      await fetchArticles();
      await fetchSources();
    } catch (err) {
      alert('Lỗi khi cào dữ liệu: ' + err);
    } finally {
      setCrawlingAll(false);
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

  // Group tech stacks with articles
  const allTechStacks = articles
    .flatMap((a) => (a.new_tech_stacks || []).map((ts) => ({ ...ts, article: a })))
    .filter((ts) => ts.name);

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
                <span className="hidden rounded bg-[#eee9df] px-2 py-0.5 font-sans text-[10px] font-semibold tracking-widest text-[#635d52] uppercase sm:inline-block">
                  Tạp chí AI & Backend
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
              onClick={handleCrawlAll}
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
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* ================= VIEW 1: BÀI ĐỌC (FEED) ================= */}
        {activeTab === 'feed' && (
          <div>
            {/* Filter Bar */}
            <div className="mb-8 flex flex-col items-stretch justify-between gap-3 border-b border-[#e7e2d9] pb-4 font-sans sm:flex-row sm:items-center">
              <div className="flex scrollbar-none items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
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
                    className={`rounded-full px-3 py-1.5 text-xs transition ${
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
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                    topOnly
                      ? 'border-amber-300 bg-amber-100 font-medium text-amber-900 shadow-xs'
                      : 'border-[#dcd5c7] bg-transparent text-[#6b6456] hover:bg-[#eee9df]'
                  }`}
                >
                  <Flame className="h-3.5 w-3.5 text-amber-600" />
                  Bài tinh tuyển (≥7.5)
                  <span
                    className={`py-0.2 rounded-full px-1.5 font-sans text-[10px] font-bold ${
                      topOnly ? 'bg-amber-200 text-amber-900' : 'bg-[#e7e2d9] text-[#554e42]'
                    }`}
                  >
                    {articles.filter((a) => a.relevance_score >= 7.5).length}
                  </span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-[#8c8475]" />
                <input
                  type="text"
                  placeholder="Tìm chủ đề, công nghệ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchArticles()}
                  className="w-full rounded-full border border-[#dcd5c7] bg-white py-1.5 pr-4 pl-8.5 text-xs text-[#2c313a] placeholder-[#9c9485] focus:border-[#7c7465] focus:outline-none sm:w-60"
                />
              </div>
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
                  onClick={handleCrawlAll}
                  className="cursor-pointer rounded-lg bg-[#2c313a] px-4 py-2 font-sans text-xs font-medium text-white transition hover:bg-[#1a1d23]"
                >
                  Cập nhật tin ngay
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {articles.map((art) => (
                  <article
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className="group cursor-pointer rounded-xl border border-[#e7e2d9] bg-white p-6 shadow-xs transition hover:border-[#cfc7b8] hover:bg-[#fcfbf9]"
                  >
                    {/* Header meta */}
                    <div className="mb-2.5 flex items-center justify-between gap-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#f4efe6] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#756e60] uppercase">
                          {art.source_name || 'Bản tin'}
                        </span>
                        <span className="text-[11px] text-[#8c8475]">
                          {art.published_at
                            ? new Date(art.published_at).toLocaleDateString('vi-VN', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : 'Mới cập nhật'}
                        </span>
                        <span className="text-[11px] text-[#a8a193]">·</span>
                        <span className="flex items-center gap-0.5 text-[11px] text-[#8c8475]">
                          <Clock className="inline h-3 w-3" />{' '}
                          {Math.max(1, Math.ceil((art.vietnamese_summary?.length || 300) / 350))}{' '}
                          phút đọc
                        </span>
                      </div>

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
                          Điểm giá trị: {art.relevance_score.toFixed(1)}/10
                        </span>
                      )}
                    </div>

                    {/* Article Title */}
                    <h2 className="mb-3 font-serif text-lg leading-snug font-bold text-[#1a1d20] transition group-hover:text-indigo-950 md:text-xl">
                      {art.vietnamese_title || art.title}
                    </h2>

                    {/* Editorial Summary */}
                    <p className="mb-4 font-serif text-[14px] leading-relaxed text-[#4a4f59]">
                      {art.vietnamese_summary || art.title}
                    </p>

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
                                setSelectedArticle(art);
                              }}
                              className="rounded border border-[#e2dcd0] bg-[#f4f1ea] px-2 py-0.5 font-mono text-[11px] text-[#334155] transition hover:bg-[#e9e4d9]"
                            >
                              ⚡ {ts.name}
                            </span>
                          ))}
                      </div>

                      <span className="flex items-center gap-1 text-xs font-semibold text-[#2c313a] group-hover:text-indigo-800">
                        Mở bài tóm tắt chi tiết <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: RADAR TECH STACK (CLICKABLE) ================= */}
        {activeTab === 'radar' && (
          <div>
            <div className="mb-6 rounded-xl border border-[#e7e2d9] bg-white p-6">
              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-[#1c1f24]">
                <Sparkles className="h-5 w-5 text-amber-600" />
                Radar Công Nghệ & Framework Mới Xuất Hiện
              </h2>
              <p className="mt-1.5 font-sans text-xs leading-relaxed text-[#6b6456]">
                Tự động phát hiện các công cụ, thư viện, database mới được nhắc tới trong các bài
                viết gần đây.
                <strong className="text-[#1c1f24]">
                  {' '}
                  Bấm vào thẻ bất kỳ để đọc bài viết và phân tích kỹ thuật liên quan.
                </strong>
              </p>
            </div>

            {allTechStacks.length === 0 ? (
              <div className="rounded-xl border border-[#e7e2d9] bg-white p-8 py-20 text-center">
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
            className="animate-in fade-in flex max-h-[88vh] w-full max-w-2xl cursor-default flex-col overflow-hidden rounded-2xl border border-[#e7e2d9] bg-[#fbf9f5] shadow-2xl"
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
              <button
                onClick={() => setSelectedArticle(null)}
                className="cursor-pointer rounded-lg p-1.5 text-[#756e60] transition hover:bg-[#f4efe6] hover:text-[#1c1f24]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Reading Content */}
            <div className="space-y-6 overflow-y-auto p-6 text-[#2c313a]">
              {/* Executive Summary */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 font-sans text-xs font-bold tracking-wider text-[#756e60] uppercase">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Tóm tắt cốt lõi cho kỹ sư:
                  </h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedArticle.vietnamese_summary || '');
                      alert('Đã sao chép tóm tắt vào clipboard!');
                    }}
                    className="cursor-pointer rounded bg-[#eee9df] px-2 py-0.5 font-sans text-[11px] text-[#6b6456] transition hover:bg-[#e4ded2] hover:text-[#1c1f24]"
                  >
                    Sao chép tóm tắt
                  </button>
                </div>
                <div className="rounded-xl border border-[#e7e2d9] bg-white p-4 font-serif text-[15px] leading-relaxed text-[#2c313a]">
                  {selectedArticle.vietnamese_summary}
                </div>
              </div>

              {/* Key Takeaways */}
              {selectedArticle.key_takeaways && selectedArticle.key_takeaways.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 font-sans text-xs font-bold tracking-wider text-[#756e60] uppercase">
                    💡 Bài học & Điểm kỹ thuật đáng chú ý:
                  </h3>
                  <ul className="list-inside list-disc space-y-2 rounded-xl border border-[#e7e2d9] bg-white p-4 font-serif text-[14px] leading-relaxed text-[#333d4b]">
                    {selectedArticle.key_takeaways.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tech Stack Box */}
              {selectedArticle.new_tech_stacks && selectedArticle.new_tech_stacks.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 font-sans text-xs font-bold tracking-wider text-[#756e60] uppercase">
                    ⚡ Công nghệ mới xuất hiện trong bài:
                  </h3>
                  <div className="grid grid-cols-1 gap-2.5 font-sans sm:grid-cols-2">
                    {selectedArticle.new_tech_stacks.map((ts, idx) => (
                      <div key={idx} className="rounded-xl border border-[#e7e2d9] bg-white p-3.5">
                        <div className="font-mono text-xs font-bold text-[#0f172a]">{ts.name}</div>
                        <div className="mt-1 font-serif text-[12px] text-[#64748b]">{ts.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Link */}
              <div className="border-t border-[#e7e2d9] pt-3 font-sans">
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-900 underline hover:text-indigo-950"
                >
                  Đọc toàn văn bài viết gốc tại {selectedArticle.source_name} ({selectedArticle.url}
                  ) <ExternalLink className="h-3 w-3" />
                </a>
              </div>
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
