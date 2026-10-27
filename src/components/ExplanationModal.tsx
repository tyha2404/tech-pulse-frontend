import React from 'react';
import { X } from 'lucide-react';
import { primaryButton } from '../utils/ui';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIERS = [
  {
    range: '8.0 – 10',
    sample: '9.2',
    style: 'text-[26px] font-bold text-signal-700',
    text: 'Nên đọc ngay: kiến trúc hệ thống, bản phát hành lớn, kỹ thuật áp dụng được. Bản tin hiện luôn các ý chính.',
  },
  {
    range: '6.0 – 7.9',
    sample: '7.1',
    style: 'text-[22px] font-semibold text-ink-2',
    text: 'Đáng đọc khi có thời gian: tin công nghệ đáng chú ý, ít chiều sâu hơn.',
  },
  {
    range: 'Dưới 6.0',
    sample: '5.4',
    style: 'text-[18px] font-medium text-muted',
    text: 'Có thể bỏ qua: tin PR, tin giật gân hoặc ít liên quan tới Backend và AI.',
  },
];

export const ExplanationModal: React.FC<ExplanationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="bg-scrim/40 fixed inset-0 z-50 flex items-end justify-center p-0 backdrop-blur-xs sm:items-center sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="explain-title"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.25rem)' }}
        className="bg-paper shadow-ink/20 w-full max-w-lg cursor-default rounded-t-2xl p-5 shadow-2xl sm:rounded-2xl sm:p-7"
      >
        <div className="mb-2 flex items-start justify-between gap-4">
          <h2 id="explain-title" className="text-ink text-[20px] font-semibold">
            Điểm AI được tính thế nào?
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:bg-wash hover:text-ink -mt-1 -mr-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-ink-2 text-[14px] leading-relaxed">
          AI đọc toàn bộ bài và chấm từ 1 đến 10 theo chiều sâu kỹ thuật, tính thực tiễn và giá trị
          cho kỹ sư Backend và AI. Con số càng lớn, càng đậm thì bài càng đáng đọc.
        </p>

        <ul className="divide-rule border-rule mt-5 divide-y border-y">
          {TIERS.map((t) => (
            <li
              key={t.range}
              className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-baseline gap-x-3 py-3.5"
            >
              <span className={`score-numeral leading-none ${t.style}`}>{t.sample}</span>
              <div>
                <div className="text-ink text-[14px] font-semibold">{t.range}</div>
                <p className="text-ink-2 mt-0.5 text-[14px] leading-relaxed">{t.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-ink-2 mt-5 text-[14px] leading-relaxed">
          Bấm Hữu ích hoặc Không liên quan trên từng bài để AI chấm sát với sở thích của bạn hơn.
          Tab Radar công nghệ gom các công nghệ mới mà AI tìm thấy trong bài.
        </p>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className={primaryButton}>
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
