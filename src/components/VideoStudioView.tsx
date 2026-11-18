import React, { useCallback, useEffect, useState } from 'react';
import {
  API_BASE_URL,
  getVideoStatus,
  listVideos,
  resendVideoToTelegram,
  startVideo,
} from '../api';
import type { NewsVideo, VideoJobStatus } from '../types';
import { PageHeader } from './PageHeader';
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconRefresh,
  IconSend,
  IconSpinner,
  IconVideo,
} from './icons';
import { primaryButton, secondaryButton, sectionHeading } from '../utils/ui';
import { formatRelativeTime } from '../utils/format';

interface VideoStudioViewProps {
  notify: (message: string, tone?: 'info' | 'error') => void;
}

const POLL_MS = 3000;

function formatElapsed(sec: number | null | undefined): string {
  if (sec == null) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m} phút ${s} giây` : `${s} giây`;
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({ notify }) => {
  const [job, setJob] = useState<VideoJobStatus | null>(null);
  const [videos, setVideos] = useState<NewsVideo[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [reuseUsed, setReuseUsed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);

  const loadVideos = useCallback(async () => {
    try {
      setVideos(await listVideos());
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, []);

  // On open: show the saved videos and rejoin a build that is already running (e.g. after a tab switch)
  useEffect(() => {
    let cancelled = false;
    listVideos()
      .then((list) => !cancelled && setVideos(list))
      .catch(() => !cancelled && setLoadFailed(true));
    getVideoStatus()
      .then((status) => !cancelled && setJob(status))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const running = job?.status === 'running';

  // Runs once, when a build that was running turns out to be finished
  const handleFinished = useCallback(
    (done: VideoJobStatus) => {
      if (done.status === 'done') {
        const sent = done.result?.telegram_sent;
        notify(
          sent === true
            ? 'Video đã tạo xong và gửi tới Telegram.'
            : sent === false
              ? 'Video đã tạo xong nhưng chưa gửi được tới Telegram.'
              : 'Video đã tạo xong.'
        );
        void loadVideos();
      } else if (done.status === 'skipped') {
        setNotice(done.result?.message ?? 'Chưa đủ bài mới để tạo video.');
      } else if (done.status === 'failed') {
        notify(`Không tạo được video: ${done.error ?? 'lỗi không rõ'}.`, 'error');
      }
    },
    [loadVideos, notify]
  );

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(async () => {
      try {
        const next = await getVideoStatus();
        setJob(next);
        if (next.status !== 'running') handleFinished(next);
      } catch {
        // keep polling: a missed answer must not end the wait
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [running, handleFinished]);

  const handleStart = async () => {
    setStarting(true);
    setNotice(null);
    try {
      const res = await startVideo(reuseUsed);
      if (res.started) {
        setJob({ status: 'running', step: 'Chọn bài', elapsed_sec: 0, result: null, error: null });
      } else {
        setNotice(res.message ?? 'Chưa tạo được video.');
        if (res.skipped === 'busy') setJob(await getVideoStatus());
      }
    } catch {
      notify('Không bắt đầu được việc tạo video. Kiểm tra backend đang chạy.', 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleCopy = async (caption: string) => {
    try {
      await navigator.clipboard.writeText(caption);
      notify('Đã sao chép caption.');
    } catch {
      notify('Không sao chép được. Hãy chọn và sao chép thủ công.', 'error');
    }
  };

  const handleResend = async (id: number) => {
    setResendingId(id);
    try {
      const res = await resendVideoToTelegram(id);
      notify(res.message, res.success ? 'info' : 'error');
      void loadVideos();
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      notify(detail ?? 'Không gửi được video tới Telegram.', 'error');
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Video TikTok"
        description="Tạo video ngắn từ 3 bài điểm cao nhất chưa lên video nào. Video xong sẽ tự gửi tới Telegram."
        actions={
          <button onClick={handleStart} disabled={starting || running} className={primaryButton}>
            {starting || running ? (
              <IconSpinner className="h-4 w-4 animate-spin" />
            ) : (
              <IconVideo className="h-4 w-4" />
            )}
            {running ? 'Đang tạo video' : 'Tạo video'}
          </button>
        }
      />

      <label className="text-muted -mt-4 mb-6 flex w-fit cursor-pointer items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={reuseUsed}
          onChange={(e) => setReuseUsed(e.target.checked)}
          disabled={running}
          className="accent-accent-600 h-4 w-4"
        />
        Cho phép dùng lại bài đã có trong video trước
      </label>

      {running && (
        <div
          role="status"
          className="border-rule mb-8 flex items-start gap-3 border-y py-4 text-[14px]"
        >
          <IconSpinner className="text-accent-600 mt-0.5 h-4 w-4 shrink-0 animate-spin" />
          <div>
            <p className="text-ink font-medium">{job?.step || 'Đang bắt đầu'}</p>
            <p className="text-muted mt-0.5 text-[13px]">
              Đã chạy {formatElapsed(job?.elapsed_sec) || '0 giây'}. Thường mất vài phút; bạn có thể
              chuyển sang tab khác, video vẫn được tạo.
            </p>
          </div>
        </div>
      )}

      {!running && notice && (
        <p role="status" className="text-ink-2 border-rule mb-8 border-y py-4 text-[14px]">
          {notice}
        </p>
      )}

      <section aria-labelledby="video-list">
        <h2 id="video-list" className={`${sectionHeading} mb-1`}>
          Video đã tạo
        </h2>
        <p className="text-muted mb-3 text-[13px]">Mới nhất ở trên cùng.</p>

        {loadFailed && (
          <div role="alert" className="py-8 text-center">
            <p className="text-danger-700 text-[14px]">
              Không tải được danh sách video: backend không phản hồi.
            </p>
            <button onClick={() => void loadVideos()} className={`${secondaryButton} mt-3`}>
              <IconRefresh className="h-4 w-4" /> Thử lại
            </button>
          </div>
        )}

        {!loadFailed && videos === null && (
          <p role="status" className="text-muted flex items-center gap-2 py-8 text-[14px]">
            <IconSpinner className="h-4 w-4 animate-spin" /> Đang tải danh sách video…
          </p>
        )}

        {!loadFailed && videos?.length === 0 && (
          <p className="text-muted py-8 text-[14px]">
            Chưa có video nào. Bấm “Tạo video” để bắt đầu.
          </p>
        )}

        {!loadFailed && videos && videos.length > 0 && (
          <ul className="divide-rule border-rule divide-y border-y">
            {videos.map((v) => (
              <li key={v.id} className="flex flex-col gap-5 py-6 sm:flex-row">
                <video
                  src={`${API_BASE_URL}${v.url}`}
                  controls
                  preload="metadata"
                  playsInline
                  aria-label={`Video tạo ${formatRelativeTime(v.created_at)}`}
                  className="bg-ink aspect-9/16 w-42 shrink-0 rounded-lg object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-muted text-[13px]">
                    {formatRelativeTime(v.created_at)}
                    {v.duration_sec ? ` · ${Math.round(v.duration_sec)} giây` : ''}
                  </p>

                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                    {v.telegram_sent === true && (
                      <span className="text-signal-700 inline-flex items-center gap-1.5 font-medium">
                        <IconCheck className="h-4 w-4" /> Đã gửi Telegram
                      </span>
                    )}
                    {v.telegram_sent === false && (
                      <>
                        <span className="text-danger-700 font-medium">Chưa gửi được Telegram</span>
                        <button
                          onClick={() => void handleResend(v.id)}
                          disabled={resendingId === v.id}
                          className="text-accent-700 inline-flex cursor-pointer items-center gap-1.5 font-medium hover:underline disabled:cursor-wait disabled:opacity-60"
                        >
                          {resendingId === v.id ? (
                            <IconSpinner className="h-4 w-4 animate-spin" />
                          ) : (
                            <IconSend className="h-4 w-4" />
                          )}
                          Gửi lại
                        </button>
                      </>
                    )}
                    {v.telegram_sent === null && (
                      <span className="text-muted">Telegram chưa được cấu hình</span>
                    )}
                  </p>

                  {v.caption && (
                    <div className="mt-4">
                      <p className="text-ink-2 text-[14px] leading-relaxed wrap-break-word whitespace-pre-line">
                        {v.caption}
                      </p>
                      <button
                        onClick={() => void handleCopy(v.caption ?? '')}
                        className={`${secondaryButton} mt-2`}
                      >
                        <IconCopy className="h-4 w-4" /> Sao chép caption
                      </button>
                    </div>
                  )}

                  {v.articles.length > 0 && (
                    <ol className="mt-4 space-y-1 text-[13px]">
                      {v.articles.map((a, i) => (
                        <li key={a.id} className="flex gap-2">
                          <span className="text-muted score-numeral w-12 shrink-0">
                            Top {v.articles.length - i}
                          </span>
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-ink-2 hover:text-accent-700 min-w-0 wrap-break-word hover:underline"
                          >
                            {a.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  )}

                  <a
                    href={`${API_BASE_URL}${v.url}`}
                    download={v.file}
                    className={`${secondaryButton} mt-4`}
                  >
                    <IconDownload className="h-4 w-4" /> Tải video
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
