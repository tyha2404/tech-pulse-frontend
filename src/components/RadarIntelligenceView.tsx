import React, { useState, useEffect } from 'react';
import { IconRefresh, IconSend, IconSpinner } from './icons';
import { PageHeader } from './PageHeader';
import { primaryButton, secondaryButton, sectionHeading } from '../utils/ui';
import { ScoreBadge } from './ScoreBadge';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRadarDigest = async (force: boolean = false) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiClient.get('/intelligence/radar-digest', {
        params: force ? { force_refresh: true } : {},
      });
      setDigest(res.data);
    } catch (err: any) {
      console.error('Failed to fetch radar digest', err);
      setErrorMsg('Không tải được radar: AI gateway không phản hồi. Kiểm tra 9router rồi thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchRadarDigest(false);
    }, 0);
  }, []);

  const handleDispatch = async () => {
    try {
      setDispatching(true);
      setDispatchMsg(null);
      const res = await apiClient.post('/intelligence/dispatch-digest?channel=all');
      setDispatchMsg(res.data.message || 'Đã gửi bản tin tổng hợp thành công!');
    } catch {
      setDispatchMsg('Không gửi được bản tin. Kiểm tra cấu hình Telegram/Discord trong backend.');
    } finally {
      setDispatching(false);
    }
  };

  // Technology-radar rings, in the order a team should act on them
  const RINGS = [
    { key: 'ADOPT', label: 'Nên dùng', hint: 'Adopt', tone: 'text-signal-700' },
    { key: 'TRIAL', label: 'Thử nghiệm', hint: 'Trial', tone: 'text-ink' },
    { key: 'ASSESS', label: 'Đánh giá', hint: 'Assess', tone: 'text-ochre-700' },
    { key: 'HOLD', label: 'Tạm dừng', hint: 'Hold', tone: 'text-danger-700' },
  ];
  const ringOf = (status: string) =>
    RINGS.find((r) => status.toUpperCase().includes(r.key))?.key ?? 'HOLD';

  return (
    <div>
      <PageHeader
        title="Radar công nghệ"
        description="AI đọc 15 bài điểm cao nhất và chỉ ra xu hướng nào nên dùng, thử nghiệm hay tạm dừng."
        actions={
          <>
            <button
              onClick={() => fetchRadarDigest(true)}
              disabled={loading}
              title="AI phân tích lại từ các bài mới nhất"
              className={secondaryButton}
            >
              <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Phân tích lại
            </button>
            <button onClick={handleDispatch} disabled={dispatching} className={primaryButton}>
              <IconSend className="h-4 w-4" />
              {dispatching ? 'Đang gửi…' : 'Gửi bản tin'}
            </button>
          </>
        }
      />

      {dispatchMsg && (
        <p role="status" className="text-muted -mt-4 mb-6 text-[14px]">
          {dispatchMsg}
        </p>
      )}

      {errorMsg && !digest && (
        <div role="alert" className="py-12 text-center">
          <p className="text-danger-700 text-[15px]">{errorMsg}</p>
          <button onClick={() => fetchRadarDigest(false)} className={`${secondaryButton} mt-4`}>
            <IconRefresh className="h-4 w-4" /> Thử lại
          </button>
        </div>
      )}

      {loading && !digest ? (
        <div role="status" className="text-muted py-20 text-center text-[14px]">
          <IconSpinner className="mx-auto mb-3 h-5 w-5 animate-spin" />
          AI đang tổng hợp radar…
          <p className="text-faint mt-1 text-[13px]">Lần đầu có thể mất 15–25 giây.</p>
        </div>
      ) : (
        digest && (
          <div className="space-y-12">
            <section aria-labelledby="radar-trends">
              <h2 id="radar-trends" className={`${sectionHeading} mb-1`}>
                Xu hướng {digest.week_label ? `· ${digest.week_label}` : ''}
              </h2>
              <div className="divide-rule border-rule divide-y border-y">
                {RINGS.map((ring) => {
                  const trends = digest.dominant_trends.filter(
                    (t) => ringOf(t.status) === ring.key
                  );
                  if (trends.length === 0) return null;
                  return (
                    <div
                      key={ring.key}
                      className="grid gap-x-6 gap-y-3 py-5 sm:grid-cols-[9rem_minmax(0,1fr)]"
                    >
                      <div>
                        <div className={`text-[15px] font-semibold ${ring.tone}`}>{ring.label}</div>
                        <div className="text-faint text-[13px]">{ring.hint}</div>
                      </div>
                      <ul className="space-y-4">
                        {trends.map((t, idx) => (
                          <li key={idx}>
                            <div className="text-ink text-[16px] font-semibold">{t.topic}</div>
                            <p className="reading-font text-ink-2 mt-0.5 max-w-prose text-[15px] leading-[1.6]">
                              {t.summary}
                            </p>
                            {t.relevance && (
                              <p className="text-muted mt-1 text-[13px]">
                                Mức liên quan: {t.relevance}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
              <section aria-labelledby="radar-shifts">
                <h2 id="radar-shifts" className={`${sectionHeading} mb-3`}>
                  Dịch chuyển kiến trúc
                </h2>
                <ul className="reading-font text-ink-2 marker:text-faint list-disc space-y-2 pl-5 text-[15px] leading-[1.6]">
                  {digest.architectural_shifts.map((shift, i) => (
                    <li key={i}>{shift}</li>
                  ))}
                </ul>
              </section>
              <section aria-labelledby="radar-actions">
                <h2 id="radar-actions" className={`${sectionHeading} mb-3`}>
                  Nên làm gì tiếp
                </h2>
                <ul className="reading-font text-ink-2 marker:text-faint list-disc space-y-2 pl-5 text-[15px] leading-[1.6]">
                  {digest.actionable_recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </section>
            </div>

            {digest.top_articles && digest.top_articles.length > 0 && (
              <section aria-labelledby="radar-top">
                <h2 id="radar-top" className={`${sectionHeading} mb-1`}>
                  Bài làm căn cứ
                </h2>
                <ul className="divide-rule border-rule divide-y border-y">
                  {digest.top_articles.map((art) => (
                    <li key={art.id}>
                      <button
                        onClick={() => onSelectArticle(art as unknown as Article)}
                        className="hover:bg-wash/50 block w-full cursor-pointer py-3 text-left"
                      >
                        <span className="min-w-0">
                          <span className="text-ink block text-[15px] leading-snug font-medium">
                            {art.vietnamese_title || art.title}
                          </span>
                          <span className="text-muted mt-1.5 flex items-center gap-3 text-[13px]">
                            <ScoreBadge score={art.relevance_score} />
                            {art.source_name}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )
      )}
    </div>
  );
};
