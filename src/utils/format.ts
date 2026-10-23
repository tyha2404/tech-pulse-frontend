/** "5 phút trước", "3 giờ trước", "2 ngày trước"; falls back to a date after a week. */
export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Chưa có';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Chưa có';
  const minutes = Math.round((Date.now() - d.getTime()) / 60_000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

export const SOURCE_CATEGORY_LABELS: Record<string, string> = {
  'AI & Future Tech': 'AI & công nghệ mới',
  'Backend & Architecture': 'Backend & kiến trúc',
  'Vietnam Tech': 'Việt Nam',
  'Global Tech': 'Quốc tế',
};

export const SOURCE_STATUS: Record<string, { label: string; dot: string; text: string }> = {
  healthy: { label: 'Ổn định', dot: 'bg-signal-500', text: 'text-signal-800' },
  warning: { label: 'Cảnh báo', dot: 'bg-ochre-500', text: 'text-ochre-800' },
  error: { label: 'Lỗi', dot: 'bg-danger-500', text: 'text-danger-700' },
  pending: { label: 'Đang lấy bài', dot: 'bg-accent-500 animate-pulse', text: 'text-ink-2' },
};
