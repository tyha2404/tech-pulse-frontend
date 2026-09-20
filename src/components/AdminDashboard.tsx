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
  Radio,
  ArrowUpRight,
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
      setMessage(
        '✅ Đã reset toàn bộ Circuit Breaker về trạng thái hoạt động bình thường (CLOSED)!'
      );
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
      <div className="flex flex-col items-center justify-center py-20 font-sans text-[#756e60]">
        <RefreshCw className="mb-2.5 h-6 w-6 animate-spin text-[#4b5563]" />
        <p className="text-xs font-medium">Đang tải dữ liệu giám sát hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn mx-auto max-w-5xl space-y-6 pb-12 font-serif">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e7e2d9] bg-gradient-to-r from-[#fbf9f5] via-[#f7f3ea] to-[#f4eee2] p-6 shadow-2xs md:flex-row md:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-0.5 font-sans text-[11px] font-semibold text-emerald-900">
            <Activity className="h-3.5 w-3.5 text-emerald-700" />
            Admin Observability & System Health
          </div>
          <h2 className="font-serif text-xl font-bold text-[#1c1f24] sm:text-2xl">
            Giám Sát Vận Hành & Sức Khỏe Nguồn Tin
          </h2>
          <p className="mt-1 font-sans text-xs text-[#635c50]">
            Theo dõi trạng thái từng nguồn tin, độ trễ pipeline AI, trạng thái Circuit Breakers và
            nhật ký cào tin thời gian thực.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 font-sans">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#ded7ca] bg-white px-3 py-2 text-xs font-semibold text-[#2c313a] shadow-xs transition hover:bg-[#eee9df]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={handleResetBreakers}
            disabled={resettingBreakers}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#2c313a] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1a1d23] disabled:opacity-50"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Reset Breakers
          </button>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 p-3.5 font-sans text-xs font-medium text-indigo-900 shadow-2xs">
          <Radio className="h-4 w-4 shrink-0 animate-pulse text-indigo-700" />
          <span>{message}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 gap-4 font-sans md:grid-cols-4">
        <div className="rounded-xl border border-[#e7e2d9] bg-white p-4 shadow-xs">
          <div className="mb-1.5 flex items-center justify-between text-[#756e60]">
            <span className="text-[11px] font-bold tracking-wider uppercase">Tổng Bài Viết</span>
            <Database className="h-4 w-4 text-sky-700" />
          </div>
          <div className="font-serif text-2xl font-bold text-[#1c1f24]">
            {metrics?.total_articles.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#8c8475]">
            <strong className="text-emerald-800">{metrics?.analyzed_articles}</strong> bài đã phân
            tích AI
          </div>
        </div>

        <div className="rounded-xl border border-[#e7e2d9] bg-white p-4 shadow-xs">
          <div className="mb-1.5 flex items-center justify-between text-[#756e60]">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              Bài Tinh Tuyển (≥8.0)
            </span>
            <Flame className="h-4 w-4 text-rose-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-rose-800">
            {metrics?.high_score_articles.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#8c8475]">
            {metrics?.total_articles
              ? Math.round(((metrics.high_score_articles || 0) / metrics.total_articles) * 100)
              : 0}
            % trên tổng volume
          </div>
        </div>

        <div className="rounded-xl border border-[#e7e2d9] bg-white p-4 shadow-xs">
          <div className="mb-1.5 flex items-center justify-between text-[#756e60]">
            <span className="text-[11px] font-bold tracking-wider uppercase">Nguồn Hoạt Động</span>
            <Globe className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="font-serif text-2xl font-bold text-[#1c1f24]">
            {metrics?.active_sources}{' '}
            <span className="font-sans text-xs font-normal text-[#8c8475]">
              / {metrics?.total_sources}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-700" /> {metrics?.healthy_sources} nguồn
            khỏe mạnh
          </div>
        </div>

        <div className="rounded-xl border border-[#e7e2d9] bg-white p-4 shadow-xs">
          <div className="mb-1.5 flex items-center justify-between text-[#756e60]">
            <span className="text-[11px] font-bold tracking-wider uppercase">Nguồn Gặp Sự Cố</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div
            className={`font-serif text-2xl font-bold ${(metrics?.error_sources || 0) > 0 ? 'text-amber-800' : 'text-[#1c1f24]'}`}
          >
            {metrics?.error_sources}
          </div>
          <div className="mt-1 text-[11px] text-[#8c8475]">Cần kiểm tra định dạng hoặc domain</div>
        </div>
      </div>

      {/* Circuit Breakers & AI Model Distribution */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Circuit Breakers */}
        <div className="rounded-xl border border-[#e7e2d9] bg-white p-5 shadow-xs">
          <h3 className="mb-3 flex items-center gap-2 font-serif text-sm font-bold text-[#1c1f24]">
            <Cpu className="h-4 w-4 text-indigo-700" />
            Trạng Thái AI Circuit Breakers
          </h3>
          <div className="space-y-2.5 font-sans">
            {metrics?.circuit_breakers_status &&
            Object.keys(metrics.circuit_breakers_status).length > 0 ? (
              Object.entries(metrics.circuit_breakers_status).map(([model, status]) => (
                <div
                  key={model}
                  className="flex items-center justify-between rounded-lg border border-[#ede7dc] bg-[#faf8f4] p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${status === 'CLOSED' ? 'bg-emerald-600' : status === 'HALF_OPEN' ? 'bg-amber-500' : 'animate-pulse bg-rose-600'}`}
                    />
                    <span className="font-mono text-xs font-semibold text-[#1c1f24]">{model}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      status === 'CLOSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : status === 'HALF_OPEN'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-[#ede7dc] bg-[#faf8f4] p-3 text-xs text-[#756e60]">
                <span>Tất cả Circuit Breakers đều hoạt động ổn định.</span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                  CLOSED
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI Model Distribution */}
        <div className="rounded-xl border border-[#e7e2d9] bg-white p-5 shadow-xs">
          <h3 className="mb-3 flex items-center gap-2 font-serif text-sm font-bold text-[#1c1f24]">
            <Layers className="h-4 w-4 text-sky-700" />
            Phân Bổ Xử Lý Của Các Mô Hình AI
          </h3>
          <div className="space-y-3 font-sans">
            {metrics?.ai_model_distribution &&
            Object.keys(metrics.ai_model_distribution).length > 0 ? (
              Object.entries(metrics.ai_model_distribution).map(([model, count]) => {
                const percentage = metrics.analyzed_articles
                  ? Math.round((count / metrics.analyzed_articles) * 100)
                  : 0;
                return (
                  <div key={model} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono font-medium text-[#1c1f24]">{model}</span>
                      <span className="text-[#756e60]">
                        {count} bài ({percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eee9df]">
                      <div
                        className="h-full rounded-full bg-[#2c313a]"
                        style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-xs text-[#8c8475]">Chưa có dữ liệu phân bổ mô hình AI.</div>
            )}
          </div>
        </div>
      </div>

      {/* Sources Health Table */}
      <div className="overflow-hidden rounded-xl border border-[#e7e2d9] bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-[#e7e2d9] bg-[#f7f4ed] px-5 py-3.5">
          <h3 className="flex items-center gap-2 font-serif text-sm font-bold text-[#1c1f24]">
            <Globe className="h-4 w-4 text-emerald-700" />
            Chi Tiết Sức Khỏe Từng Nguồn Tin ({metrics?.source_health.length || 0})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left font-sans text-xs">
            <thead className="border-b border-[#e7e2d9] bg-[#faf8f4] font-medium text-[#635d52]">
              <tr>
                <th className="p-3.5">Tên Nguồn</th>
                <th className="p-3.5">Định dạng</th>
                <th className="p-3.5">Trạng Thái</th>
                <th className="p-3.5">Số Bài</th>
                <th className="p-3.5">Lần cào gần nhất</th>
                <th className="p-3.5">Ghi chú lỗi</th>
                <th className="p-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ede8df]">
              {metrics?.source_health.map((src) => (
                <tr key={src.id} className="transition hover:bg-[#fbf9f5]">
                  <td className="p-3.5 font-semibold text-[#1c1f24]">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-indigo-900 hover:underline"
                    >
                      {src.name} <ArrowUpRight className="h-3 w-3 text-[#8c8475]" />
                    </a>
                  </td>
                  <td className="p-3.5">
                    <span className="rounded bg-[#f4efe6] px-2 py-0.5 font-mono text-[10px] font-bold text-[#635d52] uppercase">
                      {src.source_type}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {src.status === 'healthy' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> Healthy
                      </span>
                    ) : src.status === 'error' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800">
                        <XCircle className="h-3.5 w-3.5 text-rose-700" /> Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800">
                        <Clock className="h-3.5 w-3.5 text-amber-700" /> {src.status}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono font-medium text-[#1c1f24]">
                    {src.articles_count}
                  </td>
                  <td className="p-3.5 text-[#756e60]">
                    {src.last_crawled_at
                      ? new Date(src.last_crawled_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td
                    className="max-w-[200px] truncate p-3.5 font-mono text-[10px] text-rose-800"
                    title={src.last_error || ''}
                  >
                    {src.last_error || '—'}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleCrawlSource(src.id, src.name)}
                      disabled={crawlingSourceId === src.id}
                      className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#ded7ca] bg-[#f4efe6] px-2.5 py-1 text-[11px] font-semibold text-[#2c313a] transition hover:bg-[#eae4d7]"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${crawlingSourceId === src.id ? 'animate-spin' : ''}`}
                      />
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
      <div className="overflow-hidden rounded-xl border border-[#e7e2d9] bg-white shadow-xs">
        <div className="border-b border-[#e7e2d9] bg-[#f7f4ed] px-5 py-3.5">
          <h3 className="flex items-center gap-2 font-serif text-sm font-bold text-[#1c1f24]">
            <Clock className="h-4 w-4 text-sky-700" />
            Nhật Ký Cào Tin Gần Nhất (Crawl Runs)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left font-sans text-xs">
            <thead className="border-b border-[#e7e2d9] bg-[#faf8f4] font-medium text-[#635d52]">
              <tr>
                <th className="p-3.5">Mã Run</th>
                <th className="p-3.5">Thời gian bắt đầu</th>
                <th className="p-3.5">Thời lượng</th>
                <th className="p-3.5">Bài tìm thấy</th>
                <th className="p-3.5">Bài mới thêm</th>
                <th className="p-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ede8df]">
              {metrics?.recent_runs && metrics.recent_runs.length > 0 ? (
                metrics.recent_runs.map((run) => (
                  <tr key={run.id} className="transition hover:bg-[#fbf9f5]">
                    <td className="p-3.5 font-mono text-[#756e60]">#{run.id}</td>
                    <td className="p-3.5 text-[#1c1f24]">
                      {new Date(run.started_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-3.5 font-mono text-[#756e60]">{run.duration_ms} ms</td>
                    <td className="p-3.5 font-mono text-[#1c1f24]">{run.articles_found}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-800">
                      +{run.articles_new}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          run.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-[#8c8475]">
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
