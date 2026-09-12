import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Send,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '../api';
import type { WeeklyRadarDigest, Article } from '../types';

interface RadarIntelligenceViewProps {
  onSelectArticle: (article: Article) => void;
}

export const RadarIntelligenceView: React.FC<RadarIntelligenceViewProps> = ({
  onSelectArticle,
}) => {
  const [digest, setDigest] = useState<WeeklyRadarDigest | null>(null);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);

  const fetchRadarDigest = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/intelligence/radar-digest');
      setDigest(res.data);
    } catch (err) {
      console.error('Failed to fetch radar digest', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadarDigest();
  }, []);

  const handleDispatch = async () => {
    try {
      setDispatching(true);
      setDispatchMsg(null);
      const res = await apiClient.post('/intelligence/dispatch-digest?channel=all');
      setDispatchMsg(res.data.message || 'Đã gửi bản tin tổng hợp thành công!');
    } catch (err: any) {
      setDispatchMsg('Lỗi gửi bản tin hoặc chưa cấu hình webhook.');
    } finally {
      setDispatching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('ADOPT')) {
      return (
        <span className="rounded bg-emerald-100 px-2 py-0.5 font-sans text-[10px] font-bold text-emerald-800">
          ADOPT
        </span>
      );
    }
    if (s.includes('TRIAL')) {
      return (
        <span className="rounded bg-indigo-100 px-2 py-0.5 font-sans text-[10px] font-bold text-indigo-800">
          TRIAL
        </span>
      );
    }
    if (s.includes('ASSESS')) {
      return (
        <span className="rounded bg-amber-100 px-2 py-0.5 font-sans text-[10px] font-bold text-amber-800">
          ASSESS
        </span>
      );
    }
    return (
      <span className="rounded bg-rose-100 px-2 py-0.5 font-sans text-[10px] font-bold text-rose-800">
        HOLD
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e7e2d9] bg-gradient-to-r from-[#fbf9f5] via-[#f7f3ea] to-[#f4eee2] p-6 shadow-2xs md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-900 px-2.5 py-0.5 font-sans text-[11px] font-bold text-white uppercase">
              Báo Cáo Chiến Lược
            </span>
            <span className="font-sans text-xs text-[#756e60]">
              {digest?.week_label || 'Báo cáo Radar Công nghệ Tuần này'}
            </span>
          </div>
          <h2 className="mt-2 font-serif text-xl font-bold text-[#1c1f24] sm:text-2xl">
            Radar Công Nghệ & Trí Tuệ Kỹ Thuật (Backend & AI)
          </h2>
          <p className="mt-1 font-serif text-xs text-[#635d52]">
            Tổng hợp dữ liệu từ 22 nguồn tin kỹ sư uy tín nhất: ByteByteGo, LilLog, Kamil Mysliwiec, Latent Space, Prisma, Qdrant, Vercel...
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={fetchRadarDigest}
            disabled={loading}
            className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-[#dcd5c7] bg-white px-3 py-2 font-sans text-xs font-medium text-[#2c313a] shadow-2xs transition hover:bg-[#eee9df] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Cập nhật Radar
          </button>
          <button
            onClick={handleDispatch}
            disabled={dispatching}
            className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-[#24292f] px-3.5 py-2 font-sans text-xs font-semibold text-white shadow-2xs transition hover:bg-black disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {dispatching ? 'Đang gửi...' : 'Gửi Digest Webhook'}
          </button>
        </div>
      </div>

      {dispatchMsg && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 font-sans text-xs text-indigo-900">
          {dispatchMsg}
        </div>
      )}

      {loading && !digest ? (
        <div className="py-16 text-center font-sans text-sm text-[#756e60]">
          <Sparkles className="mx-auto mb-2 h-6 w-6 animate-spin text-amber-600" />
          AI đang tổng hợp và phân tích báo cáo radar công nghệ...
        </div>
      ) : (
        digest && (
          <>
            {/* Dominant Trends Heatmap */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-sans text-xs font-bold tracking-wider text-[#756e60] uppercase">
                  <TrendingUp className="h-4 w-4 text-emerald-700" /> Xu hướng công nghệ cốt lõi
                  (Technology Radar)
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {digest.dominant_trends.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-[#e7e2d9] bg-white p-4 shadow-2xs transition hover:border-[#cfc6b6]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold text-[#1c1f24]">
                          {t.topic}
                        </span>
                        {getStatusBadge(t.status)}
                      </div>
                      <p className="mt-2 font-serif text-xs leading-relaxed text-[#475569]">
                        {t.summary}
                      </p>
                    </div>
                    <div className="mt-3 border-t border-[#f4efe6] pt-2 font-sans text-[11px] text-[#756e60]">
                      <span className="font-semibold text-[#1e293b]">Ảnh hưởng NestJS/AI:</span>{' '}
                      {t.relevance}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architectural Shifts & Practical Takeaways */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Shifts */}
              <div className="rounded-2xl border border-[#e7e2d9] bg-white p-5 shadow-2xs">
                <h3 className="flex items-center gap-2 font-sans text-xs font-bold tracking-wider text-[#756e60] uppercase">
                  <Layers className="h-4 w-4 text-indigo-700" /> Sự dịch chuyển kiến trúc tuần này
                </h3>
                <ul className="mt-3 list-inside list-disc space-y-2 font-serif text-xs leading-relaxed text-[#2c313a]">
                  {digest.architectural_shifts.map((shift, i) => (
                    <li key={i}>{shift}</li>
                  ))}
                </ul>
              </div>

              {/* Actionable Recommendations */}
              <div className="rounded-2xl border border-[#e7e2d9] bg-white p-5 shadow-2xs">
                <h3 className="flex items-center gap-2 font-sans text-xs font-bold tracking-wider text-[#756e60] uppercase">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" /> Khuyến nghị hành động cho đội
                  ngũ Backend
                </h3>
                <ul className="mt-3 list-inside list-disc space-y-2 font-serif text-xs leading-relaxed text-[#2c313a]">
                  {digest.actionable_recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Top Articles of the Week */}
            {digest.top_articles && digest.top_articles.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-sans text-xs font-bold tracking-wider text-[#756e60] uppercase">
                  ⭐ Các bài viết công nghệ điểm cao nhất tuần
                </h3>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {digest.top_articles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => onSelectArticle(art as any)}
                      className="cursor-pointer flex items-center justify-between rounded-xl border border-[#e7e2d9] bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:bg-indigo-50/30"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="font-serif text-xs font-bold text-[#1c1f24] line-clamp-1">
                          {art.vietnamese_title || art.title}
                        </div>
                        <div className="mt-1 flex items-center gap-2 font-sans text-[11px] text-[#756e60]">
                          <span>{art.source_name || 'Tech'}</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-700">
                            Điểm: {art.relevance_score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-indigo-700" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
};
