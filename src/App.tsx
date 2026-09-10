import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Rss, Cpu, Sparkles, ExternalLink, RefreshCw, Plus, Trash2, 
  CheckCircle2, AlertCircle, Clock, ShieldCheck, Flame, Layers, X
} from 'lucide-react';
import type { Article, Source, CrawlTestResult } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'sources' | 'radar'>('feed');
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [crawlingAll, setCrawlingAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [topOnly, setTopOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

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
      const res = await axios.get('/api/articles', { params });
      setArticles(res.data);
    } catch (err) {
      console.error("Error loading articles", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await axios.get('/api/sources');
      setSources(res.data);
    } catch (err) {
      console.error("Error loading sources", err);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, topOnly]);

  useEffect(() => {
    fetchSources();
  }, []);

  const handleCrawlAll = async () => {
    try {
      setCrawlingAll(true);
      await axios.post('/api/crawl-all');
      await fetchArticles();
      await fetchSources();
    } catch (err) {
      alert("Lỗi khi cào dữ liệu: " + err);
    } finally {
      setCrawlingAll(false);
    }
  };

  const handleCrawlSingle = async (sourceId: number) => {
    try {
      await axios.post(`/api/sources/${sourceId}/crawl`);
      await fetchArticles();
      await fetchSources();
    } catch (err) {
      alert("Lỗi cào nguồn: " + err);
    }
  };

  const handleDeleteSource = async (sourceId: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá nguồn "${name}"?`)) return;
    try {
      await axios.delete(`/api/sources/${sourceId}`);
      await fetchSources();
    } catch (err) {
      alert("Lỗi khi xoá nguồn: " + err);
    }
  };

  const handleTestSource = async () => {
    if (!newSourceUrl) return;
    setTestingSource(true);
    setTestResult(null);
    try {
      const res = await axios.post('/api/sources/test', null, { params: { target_url: newSourceUrl } });
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({
        success: false,
        detected_type: 'unknown',
        items_count: 0,
        sample_titles: [],
        error: err?.response?.data?.detail || err.message
      });
    } finally {
      setTestingSource(false);
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/sources', {
        name: newSourceName,
        url: newSourceUrl,
        category: newSourceCategory,
        is_active: true
      });
      setIsAddSourceOpen(false);
      setNewSourceName('');
      setNewSourceUrl('');
      setTestResult(null);
      await fetchSources();
    } catch (err: any) {
      alert("Lỗi: " + (err?.response?.data?.detail || err.message));
    }
  };

  // Collect all new tech stacks from worth-reading articles
  const allTechStacks = articles
    .flatMap(a => (a.new_tech_stacks || []).map(ts => ({ ...ts, article: a })))
    .filter(ts => ts.name);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                TechPulse AI
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                9routers active
              </span>
            </div>
            <p className="text-xs text-slate-400">Tin tức & Công nghệ mới chuyên sâu cho Backend & AI Engineers</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${
              activeTab === 'feed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Rss className="h-4 w-4" /> Bảng tin
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${
              activeTab === 'radar' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" /> Radar Tech Stack
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${
              activeTab === 'sources' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" /> Quản lý nguồn ({sources.length})
          </button>
        </div>

        {/* Global Action */}
        <button
          onClick={handleCrawlAll}
          disabled={crawlingAll}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-lg text-sm font-medium shadow-md transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${crawlingAll ? 'animate-spin' : ''}`} />
          {crawlingAll ? 'Đang cào & phân tích...' : 'Cào tất cả nguồn'}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* ================= VIEW 1: FEED ================= */}
        {activeTab === 'feed' && (
          <div>
            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    selectedCategory === 'all'
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setSelectedCategory('AI')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    selectedCategory === 'AI'
                      ? 'bg-purple-950 border-purple-700 text-purple-300'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  🤖 AI & LLM
                </button>
                <button
                  onClick={() => setSelectedCategory('Backend')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    selectedCategory === 'Backend'
                      ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  ⚙️ Backend & Architecture
                </button>
                <button
                  onClick={() => setSelectedCategory('Vietnam')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    selectedCategory === 'Vietnam'
                      ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  🇻🇳 Tin Việt Nam
                </button>
                <button
                  onClick={() => setSelectedCategory('Global')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    selectedCategory === 'Global'
                      ? 'bg-blue-950 border-blue-700 text-blue-300'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  🌐 Tin Quốc Tế
                </button>

                <div className="h-5 w-px bg-slate-800 mx-2" />

                <button
                  onClick={() => setTopOnly(!topOnly)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    topOnly
                      ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  Chỉ bài điểm cao (≥7.5)
                </button>
              </div>

              {/* Search Box */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchArticles()}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
                />
              </div>
            </div>

            {/* Articles List */}
            {loading ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
                <p>Đang nạp bài báo & phân tích 9routers AI...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 p-8">
                <Rss className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-300">Chưa có bài viết nào</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Hãy nhấn nút "Cào tất cả nguồn" ở góc trên hoặc vào trang "Quản lý nguồn" để chạy cào bài mới.
                </p>
                <button
                  onClick={handleCrawlAll}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-500"
                >
                  Bắt đầu cào ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {articles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl p-5 flex flex-col justify-between transition cursor-pointer group shadow-sm hover:shadow-indigo-500/10 hover:shadow-xl"
                  >
                    <div>
                      {/* Meta badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-medium text-indigo-400 bg-indigo-950/60 border border-indigo-900/60 px-2 py-0.5 rounded-full">
                          {art.source_name || 'Tech Feed'}
                        </span>
                        {art.relevance_score > 0 && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            art.relevance_score >= 8.0 
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            ⭐ {art.relevance_score.toFixed(1)}/10
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition line-clamp-2 mb-2">
                        {art.vietnamese_title || art.title}
                      </h3>

                      {/* Summary */}
                      <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                        {art.vietnamese_summary || art.title}
                      </p>
                    </div>

                    <div>
                      {/* Tech Stacks Highlight */}
                      {art.new_tech_stacks && art.new_tech_stacks.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {art.new_tech_stacks.slice(0, 3).map((ts, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded border border-slate-700">
                              ⚡ {ts.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{art.published_at ? new Date(art.published_at).toLocaleDateString('vi-VN') : 'Mới đây'}</span>
                        <span className="flex items-center gap-1 text-indigo-400 group-hover:underline">
                          Xem phân tích AI →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: RADAR TECH STACK ================= */}
        {activeTab === 'radar' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Radar Xu hướng & Công nghệ Mới nổi (New Tech Stacks)
              </h2>
              <p className="text-xs text-slate-400">
                Các framework, library, database, và tools mới được AI trích xuất từ các bài báo công nghệ hàng đầu để kỹ sư Backend & AI không bị tụt hậu.
              </p>
            </div>

            {allTechStacks.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 p-8">
                <p className="text-slate-400 text-sm">Chưa có tech stack mới nào được phát hiện từ các bài báo hiện tại.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allTechStacks.map((ts, idx) => (
                  <div key={idx} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 hover:border-cyan-500/40 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-cyan-400 font-mono">{ts.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {ts.category || 'Tool'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mb-3">{ts.desc || 'Không có mô tả chi tiết.'}</p>
                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                      Nguồn bài: <span className="text-slate-400">{ts.article?.vietnamese_title || ts.article?.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 3: QUẢN LÝ NGUỒN TIN (CRUD & HEALTH) ================= */}
        {activeTab === 'sources' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  Bảng Giám Sát & Quản Lý Nguồn Tin Tức
                </h2>
                <p className="text-xs text-slate-400">
                  Theo dõi trạng thái các nguồn cào được (🟢) hay bị lỗi (🔴), thêm mới bằng URL hoặc xóa nguồn tùy thích.
                </p>
              </div>
              <button
                onClick={() => setIsAddSourceOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Thêm nguồn tin mới
              </button>
            </div>

            {/* Sources Health Table */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80">
                  <tr>
                    <th className="p-3.5">Nguồn & Phân loại</th>
                    <th className="p-3.5">Trạng thái Cào</th>
                    <th className="p-3.5">URL / RSS Feed</th>
                    <th className="p-3.5">Bài đã lấy</th>
                    <th className="p-3.5">Lần cào gần nhất</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sources.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{s.name}</div>
                        <div className="text-[11px] text-slate-400">{s.category}</div>
                      </td>
                      <td className="p-3.5">
                        {s.status === 'healthy' && (
                          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded-full text-[11px] font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Hoạt động tốt
                          </span>
                        )}
                        {s.status === 'error' && (
                          <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/70 border border-rose-800 px-2 py-0.5 rounded-full text-[11px] font-medium" title={s.last_error}>
                            <AlertCircle className="h-3 w-3" /> Lỗi cào
                          </span>
                        )}
                        {s.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded-full text-[11px] font-medium">
                            <Clock className="h-3 w-3 animate-spin" /> Đang cào...
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 max-w-xs truncate font-mono text-[11px] text-slate-400">
                        <a href={s.feed_url || s.url} target="_blank" rel="noreferrer" className="hover:text-indigo-400 flex items-center gap-1">
                          {s.feed_url || s.url} <ExternalLink className="h-3 w-3 inline" />
                        </a>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-300">
                        {s.articles_count || 0} bài
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {s.last_crawled_at ? new Date(s.last_crawled_at).toLocaleTimeString('vi-VN') + ' ' + new Date(s.last_crawled_at).toLocaleDateString('vi-VN') : 'Chưa cào'}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCrawlSingle(s.id)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 text-[11px] flex items-center gap-1 transition"
                            title="Cào ngay lập tức"
                          >
                            <RefreshCw className="h-3 w-3" /> Cào ngay
                          </button>
                          <button
                            onClick={() => handleDeleteSource(s.id, s.name)}
                            className="p-1 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded transition"
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

      {/* ================= MODAL: CHI TIẾT BÀI BÁO & PHÂN TÍCH AI ================= */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-900">
                    {selectedArticle.source_name}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-900">
                    Điểm AI: {selectedArticle.relevance_score.toFixed(1)}/10
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  {selectedArticle.vietnamese_title || selectedArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed">
              {/* Summary */}
              <div>
                <h4 className="font-semibold text-white mb-1.5 flex items-center gap-1.5 text-xs">
                  <Sparkles className="h-4 w-4 text-indigo-400" /> Tóm Tắt Cốt Lõi Cho Kỹ Sư:
                </h4>
                <p className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 text-slate-300">
                  {selectedArticle.vietnamese_summary}
                </p>
              </div>

              {/* Key Takeaways */}
              {selectedArticle.key_takeaways && selectedArticle.key_takeaways.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-1.5 flex items-center gap-1.5 text-xs">
                    💡 Điểm Quan Trọng Cần Nắm (Key Takeaways):
                  </h4>
                  <ul className="list-disc list-inside space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                    {selectedArticle.key_takeaways.map((item, idx) => (
                      <li key={idx} className="text-slate-300">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tech Stack Box */}
              {selectedArticle.new_tech_stacks && selectedArticle.new_tech_stacks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-cyan-400 mb-1.5 flex items-center gap-1.5 text-xs">
                    ⚡ Công Nghệ & Công Cụ Mới Đề Cập:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedArticle.new_tech_stacks.map((ts, idx) => (
                      <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-cyan-900/40">
                        <div className="font-bold text-cyan-300 font-mono">{ts.name}</div>
                        <div className="text-[11px] text-slate-400">{ts.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Original Article Link */}
              <div className="pt-2">
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 underline font-medium"
                >
                  Đọc toàn bộ bài viết gốc tại nguồn ({selectedArticle.url}) <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: THÊM NGUỒN TIN BẰNG URL ================= */}
      {isAddSourceOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" /> Thêm Nguồn Tin Bằng URL
              </h3>
              <button
                onClick={() => setIsAddSourceOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSource} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Tên nguồn tin:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Netflix Technology Blog"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">URL Trang Web hoặc RSS Feed:</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://netflixtechblog.com hoặc feed URL"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    required
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleTestSource}
                    disabled={testingSource || !newSourceUrl}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg font-medium border border-slate-700 disabled:opacity-50"
                  >
                    {testingSource ? 'Đang test...' : 'Test Feed'}
                  </button>
                </div>
              </div>

              {/* Test Feed Status Banner */}
              {testResult && (
                <div className={`p-3 rounded-lg border ${
                  testResult.success 
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}>
                  {testResult.success ? (
                    <div>
                      <div className="font-semibold flex items-center gap-1 mb-1">
                        <CheckCircle2 className="h-4 w-4" /> Cào thử thành công! Tìm thấy {testResult.items_count} bài báo.
                      </div>
                      {testResult.sample_titles && testResult.sample_titles.length > 0 && (
                        <div className="text-[11px] text-slate-300 mt-1">
                          Bài mẫu: "{testResult.sample_titles[0]}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>Lỗi khi kiểm tra feed: {testResult.error}</div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Chủ đề / Phân loại:</label>
                <select
                  value={newSourceCategory}
                  onChange={(e) => setNewSourceCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="AI & LLM">AI & LLMs Research</option>
                  <option value="Backend Architecture">Backend Architecture & System Design</option>
                  <option value="Global Tech">Báo Công nghệ Thế giới</option>
                  <option value="Vietnam Tech">Tin Công nghệ Việt Nam</option>
                  <option value="General">Chung (General Tech)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSourceOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
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
