import React from 'react';
import { HelpCircle, X } from 'lucide-react';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
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
            onClick={onClose}
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
              AI đọc toàn bộ bài báo và chấm điểm theo tiêu chí: chiều sâu kỹ thuật, tính thực tiễn
              và bài học giá trị cho kỹ sư Backend & AI.
            </p>
            <div className="mt-2 space-y-1">
              <div>
                • <strong className="text-emerald-800">Từ 8.0 - 10.0:</strong> Bài xuất sắc (System
                Architecture, DB Sharding, Nghiên cứu AI mới).
              </div>
              <div>
                • <strong className="text-amber-800">Từ 6.0 - 7.9:</strong> Bài đáng đọc (Tin công
                nghệ đáng chú ý).
              </div>
              <div>
                • <strong className="text-stone-600">Dưới 5.0:</strong> Bài quảng cáo PR hoặc tin
                giật gân không có chiều sâu.
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e7e2d9] bg-[#fcfbf9] p-4">
            <h4 className="mb-1.5 flex items-center gap-1 text-xs font-bold text-[#1e293b]">
              ⚡ Radar Tech Stack là gì?
            </h4>
            <p>
              Tự động trích xuất các công nghệ, framework, library, database mới xuất hiện để dev
              không bị outdate.
            </p>
            <p className="mt-2 font-semibold text-[#0f172a]">
              👉 Bấm vào bất kỳ thẻ công nghệ nào sẽ mở ngay bài viết và phân tích chi tiết liên
              quan đến công nghệ đó.
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#e7e2d9] pt-4">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-[#2c313a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a1d23]"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
