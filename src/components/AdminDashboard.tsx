import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Cpu, 
  Database, 
  Layers, 
  ShieldAlert, 
  Clock, 
  Flame,
  Globe,
  Radio
} from 'lucide-react';
import type { AdminMetrics } from '../types';
import { getAdminMetrics, resetCircuitBreakers, apiClient } from '../api';

interface AdminDashboardProps {
  onRefreshFeed?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [resettingBreakers, setResettingBreakers] = useState<boolean>(false);
  const [crawlingSourceId, setCrawlingSourceId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const data = await getAdminMetrics();
      setMetrics(data);
    } catch (err: any) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Auto poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleResetBreakers = async () => {
    try {
      setResettingBreakers(true);
      await resetCircuitBreakers();
      setMessage('✅ Đã reset toàn bộ Circuit Breaker về trạng thái CLOSED!');
      setTimeout(() => setMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      setMessage(`❌ Lỗi reset Circuit Breaker: ${err.message}`);
    } finally {
      setResettingBreakers(false);
    }
  };

  const handleCrawlSource = async (sourceId: number, sourceName: string) => {
    try {
      setCrawlingSourceId(sourceId);
      await apiClient.post(`/sources/${sourceId}/crawl`);
      setMessage(`🚀 Đã kích hoạt cào dữ liệu cho nguồn "${sourceName}"!`);
      setTimeout(() => setMessage(null), 4000);
      setTimeout(loadData, 3000);
    } catch (err: any) {
      setMessage(`❌ Lỗi cào nguồn: ${err.message}`);
    } finally {
      setCrawlingSourceId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-sm font-medium">Đang tải bảng điều khiển quản trị TechPulse...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-indigo-400" />
            Admin Observability & System Health
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Giám sát sức khỏe nguồn tin, lưu lượng pipeline AI, Circuit Breaker và nhật ký cào tin thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={handleResetBreakers}
            disabled={resettingBreakers}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Reset Circuit Breakers
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs font-medium flex items-center gap-2">
          <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
          {message}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Bài Viết</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {metrics?.total_articles.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">
              {metrics?.analyzed_articles}
            </span> bài đã phân tích AI
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Bài Tinh Tuyển (&ge; 8.0)</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight">
            {metrics?.high_score_articles.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics?.total_articles ? Math.round(((metrics.high_score_articles || 0) / metrics.total_articles) * 100) : 0}% trên tổng volume
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Nguồn Hoạt Động</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {metrics?.active_sources} <span className="text-xs font-normal text-slate-500">/ {metrics?.total_sources}</span>
          </div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {metrics?.healthy_sources} nguồn khỏe mạnh
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Nguồn Bị Lỗi</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-bold tracking-tight ${(metrics?.error_sources || 0) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {metrics?.error_sources}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Cần kiểm tra định dạng hoặc domain
          </div>
        </div>
      </div>

      {/* Circuit Breakers & AI Model Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Circuit Breakers */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-indigo-400" />
            AI Router & Circuit Breakers Status
          </h2>
          <div className="space-y-3">
            {metrics?.circuit_breakers_status && Object.keys(metrics.circuit_breakers_status).length > 0 ? (
              Object.entries(metrics.circuit_breakers_status).map(([model, status]) => (
                <div key={model} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${status === 'CLOSED' ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : (status === 'HALF_OPEN' ? 'bg-amber-400' : 'bg-rose-500 animate-ping')}`} />
                    <span className="text-xs font-medium text-slate-200 font-mono">{model}</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    (status === 'HALF_OPEN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20')
                  }`}>
                    {status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                <span>Tất cả Circuit Breakers đều ở trạng thái bình thường (CLOSED).</span>
                <span className="text-emerald-400 font-semibold uppercase text-[10px]">ALL HEALTHY</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Model Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-sky-400" />
            AI Model Processing Distribution
          </h2>
          <div className="space-y-3">
            {metrics?.ai_model_distribution && Object.keys(metrics.ai_model_distribution).length > 0 ? (
              Object.entries(metrics.ai_model_distribution).map(([model, count]) => {
                const percentage = metrics.analyzed_articles ? Math.round((count / metrics.analyzed_articles) * 100) : 0;
                return (
                  <div key={model} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300 font-mono">{model}</span>
                      <span className="text-slate-400">{count} bài ({percentage}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-500 py-4">Chưa có dữ liệu phân bổ mô hình AI.</div>
            )}
          </div>
        </div>
      </div>

      {/* Sources Health Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            Chi Tiết Sức Khỏe Từng Nguồn Tin ({metrics?.source_health.length || 0})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Tên Nguồn</th>
                <th className="py-2.5 px-3">Định dạng</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
                <th className="py-2.5 px-3">Số Bài</th>
                <th className="py-2.5 px-3">Lần cào gần nhất</th>
                <th className="py-2.5 px-3">Ghi chú lỗi</th>
                <th className="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics?.source_health.map((src) => (
                <tr key={src.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    <a href={src.url} target="_blank" rel="noreferrer" className="hover:text-indigo-400 hover:underline">
                      {src.name}
                    </a>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase font-bold">
                      {src.source_type}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {src.status === 'healthy' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Healthy
                      </span>
                    ) : src.status === 'error' ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                        <XCircle className="w-3 h-3" /> Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                        <Clock className="w-3 h-3" /> {src.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {src.articles_count}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {src.last_crawled_at ? new Date(src.last_crawled_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3 px-3 text-rose-400/90 max-w-[200px] truncate font-mono text-[11px]" title={src.last_error || ''}>
                    {src.last_error || '—'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleCrawlSource(src.id, src.name)}
                      disabled={crawlingSourceId === src.id}
                      className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition inline-flex items-center gap-1"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${crawlingSourceId === src.id ? 'animate-spin' : ''}`} />
                      Cào ngay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Crawl Runs Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-sky-400" />
          Nhật Ký Cào Tin Gần Nhất (Crawl Runs)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Mã Run</th>
                <th className="py-2.5 px-3">Thời gian bắt đầu</th>
                <th className="py-2.5 px-3">Thời lượng</th>
                <th className="py-2.5 px-3">Bài tìm thấy</th>
                <th className="py-2.5 px-3">Bài mới thêm</th>
                <th className="py-2.5 px-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics?.recent_runs && metrics.recent_runs.length > 0 ? (
                metrics.recent_runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-400">#{run.id}</td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {new Date(run.started_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{run.duration_ms} ms</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{run.articles_found}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">+{run.articles_new}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        run.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {run.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                    Chưa có lịch sử cào tin nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
