import React, { useEffect, useState } from 'react';
import { IconRefresh, IconSpinner } from './icons';
import { PageHeader } from './PageHeader';
import { primaryButton, secondaryButton, sectionHeading } from '../utils/ui';
import { formatRelativeTime } from '../utils/format';

const BREAKER_STATE: Record<string, { label: string; tone: string }> = {
  CLOSED: { label: 'Hoạt động', tone: 'text-signal-800' },
  HALF_OPEN: { label: 'Đang thử lại', tone: 'text-ochre-800' },
  OPEN: { label: 'Đang bị ngắt', tone: 'text-danger-700' },
};
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
    setTimeout(() => {
      loadData();
    }, 0);
    const interval = setInterval(loadData, 30000); // Auto poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleResetBreakers = async () => {
    try {
      setResettingBreakers(true);
      await resetCircuitBreakers();
      setMessage('Đã mở lại tất cả mô hình AI.');
      setTimeout(() => setMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      setMessage(`Không mở lại được mô hình: ${err.message}`);
    } finally {
      setResettingBreakers(false);
    }
  };

  const handleCrawlSource = async (sourceId: number, sourceName: string) => {
    try {
      setCrawlingSourceId(sourceId);
      await apiClient.post(`/sources/${sourceId}/crawl`);
      setMessage(`Đang lấy lại bài từ ${sourceName}.`);
      setTimeout(() => setMessage(null), 4000);
      setTimeout(loadData, 3000);
    } catch (err: any) {
      setMessage(`Không lấy được bài: ${err.message}`);
    } finally {
      setCrawlingSourceId(null);
    }
  };

  if (loading) {
    return (
      <p
        role="status"
        className="text-muted flex items-center justify-center gap-2 py-24 text-[14px]"
      >
        <IconSpinner className="h-4 w-4 animate-spin" /> Đang tải tình trạng hệ thống…
      </p>
    );
  }

  if (!metrics) {
    return (
      <div role="alert" className="py-20 text-center">
        <p className="text-danger-700 text-[15px]">
          Không tải được số liệu: backend không phản hồi.
        </p>
        <button onClick={loadData} className={`${secondaryButton} mt-4`}>
          <IconRefresh className="h-4 w-4" /> Thử lại
        </button>
      </div>
    );
  }

  const sourceNames = Object.fromEntries(metrics.source_health.map((s) => [s.id, s.name]));
  const failingSources = metrics.source_health.filter((s) => s.status === 'error');
  const models = Array.from(
    new Set([
      ...Object.keys(metrics.circuit_breakers_status || {}),
      ...Object.keys(metrics.ai_model_distribution || {}),
    ])
  );
  const totalProcessed = Object.values(metrics.ai_model_distribution || {}).reduce(
    (a, b) => a + b,
    0
  );
  const highShare = metrics.total_articles
    ? Math.round((metrics.high_score_articles / metrics.total_articles) * 100)
    : 0;

  const stats = [
    {
      label: 'Bài viết',
      value: metrics.total_articles,
      note: `${metrics.analyzed_articles} đã được AI phân tích`,
    },
    {
      label: 'Điểm từ 8 trở lên',
      value: metrics.high_score_articles,
      note: `${highShare}% tổng số bài`,
      tone: 'text-signal-700',
    },
    {
      label: 'Nguồn đang bật',
      value: `${metrics.active_sources}/${metrics.total_sources}`,
      note: `${metrics.healthy_sources} ổn định`,
    },
    {
      label: 'Nguồn lỗi',
      value: metrics.error_sources,
      note: metrics.error_sources ? 'Xem chi tiết bên dưới' : 'Không có',
      tone: metrics.error_sources ? 'text-danger-700' : undefined,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Hệ thống"
        description="Tình trạng lấy bài và các mô hình AI. Tự làm mới mỗi 30 giây."
        actions={
          <>
            <button onClick={loadData} disabled={refreshing} className={secondaryButton}>
              <IconRefresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button
              onClick={handleResetBreakers}
              disabled={resettingBreakers}
              title="Cho phép gọi lại các mô hình AI đang bị circuit breaker ngắt"
              className={primaryButton}
            >
              Mở lại mô hình bị ngắt
            </button>
          </>
        }
      />

      {message && (
        <p role="status" className="text-muted -mt-4 mb-6 text-[14px]">
          {message}
        </p>
      )}

      <dl className="border-rule md:divide-rule grid grid-cols-2 gap-y-6 border-y py-5 md:grid-cols-4 md:divide-x">
        {stats.map((st) => (
          <div key={st.label} className="md:px-5 md:first:pl-0">
            <dt className="text-muted text-[13px]">{st.label}</dt>
            <dd
              className={`score-numeral mt-1 text-[30px] leading-none font-semibold ${st.tone || 'text-ink'}`}
            >
              {st.value}
            </dd>
            <dd className="text-muted mt-1.5 text-[13px]">{st.note}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="sys-models" className="mt-12">
        <h2 id="sys-models" className={`${sectionHeading} mb-1`}>
          Mô hình AI
        </h2>
        <p className="text-muted mb-3 text-[13px]">
          Thứ tự thử: mô hình chính trước, lỗi thì chuyển sang mô hình dự phòng.
        </p>
        {models.length === 0 ? (
          <p className="text-muted py-4 text-[14px]">Chưa có bài nào được phân tích.</p>
        ) : (
          <ul className="divide-rule border-rule divide-y border-y">
            {models.map((model) => {
              const count = metrics.ai_model_distribution?.[model] || 0;
              const pct = totalProcessed ? Math.round((count / totalProcessed) * 100) : 0;
              const breaker = metrics.circuit_breakers_status?.[model];
              const state = BREAKER_STATE[breaker?.toUpperCase() || ''] || null;
              return (
                <li
                  key={model}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[minmax(0,1fr)_8rem_12rem]"
                >
                  <div className="min-w-0">
                    <div className="text-ink truncate font-mono text-[13.5px]">{model}</div>
                  </div>
                  <div className={`text-[13px] font-medium ${state?.tone || 'text-faint'}`}>
                    {state?.label || (model === 'extractive-fallback' ? 'Không dùng AI' : '–')}
                  </div>
                  <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
                    <div className="bg-wash-strong h-1.5 flex-1 overflow-hidden rounded-full">
                      <div className="bg-ink-2 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="score-numeral text-muted w-24 text-right text-[13px]">
                      {count} bài · {pct}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {failingSources.length > 0 && (
        <section aria-labelledby="sys-failing" className="mt-12">
          <h2 id="sys-failing" className={`${sectionHeading} mb-3`}>
            Nguồn đang lỗi
          </h2>
          <ul className="divide-rule border-rule divide-y border-y">
            {failingSources.map((src) => (
              <li key={src.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="text-ink text-[15px] font-semibold">{src.name}</div>
                  <p className="text-danger-700 text-[13px]">{src.last_error || 'Không rõ lỗi'}</p>
                  <p className="text-muted text-[13px]">
                    Lần cuối: {formatRelativeTime(src.last_crawled_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleCrawlSource(src.id, src.name)}
                  disabled={crawlingSourceId === src.id}
                  className="border-rule text-ink hover:bg-wash h-9 shrink-0 cursor-pointer rounded-full border px-3.5 text-[13px] font-medium transition-colors disabled:opacity-60"
                >
                  {crawlingSourceId === src.id ? 'Đang thử…' : 'Thử lại'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="sys-runs" className="mt-12">
        <h2 id="sys-runs" className={`${sectionHeading} mb-3`}>
          Lần lấy bài gần đây
        </h2>
        {metrics.recent_runs.length === 0 ? (
          <p className="text-muted py-4 text-[14px]">Chưa có lần lấy bài nào.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[560px] text-left text-[13.5px]">
              <thead className="border-rule text-muted border-b text-[13px]">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Nguồn
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Lúc
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Thời gian
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Tìm thấy
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Bài mới
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Kết quả
                  </th>
                </tr>
              </thead>
              <tbody className="divide-rule divide-y">
                {metrics.recent_runs.map((run) => {
                  const ok = run.status === 'success';
                  return (
                    <tr key={run.id}>
                      <td className="text-ink py-2.5 pr-4 font-medium">
                        {sourceNames[run.source_id] || `Nguồn #${run.source_id}`}
                      </td>
                      <td
                        className="text-muted py-2.5 pr-4"
                        title={new Date(run.started_at).toLocaleString('vi-VN')}
                      >
                        {formatRelativeTime(run.started_at)}
                      </td>
                      <td className="score-numeral text-ink-2 py-2.5 pr-4 text-right">
                        {(run.duration_ms / 1000).toFixed(1)} giây
                      </td>
                      <td className="score-numeral text-ink-2 py-2.5 pr-4 text-right">
                        {run.articles_found}
                      </td>
                      <td
                        className={`score-numeral py-2.5 pr-4 text-right font-semibold ${run.articles_new ? 'text-signal-700' : 'text-faint'}`}
                      >
                        {run.articles_new ? `+${run.articles_new}` : '0'}
                      </td>
                      <td className="py-2.5" title={run.error_message || undefined}>
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${ok ? 'text-signal-800' : 'text-danger-700'}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`h-2 w-2 rounded-full ${ok ? 'bg-signal-500' : 'bg-danger-500'}`}
                          />
                          {ok ? 'Thành công' : run.http_status ? `Lỗi ${run.http_status}` : 'Lỗi'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
