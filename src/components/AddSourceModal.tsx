import React, { useState } from 'react';
import { Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';
import type { CrawlTestResult } from '../types';
import { apiClient } from '../api';

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourceAdded: () => Promise<void>;
}

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  isOpen,
  onClose,
  onSourceAdded,
}) => {
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceCategory, setNewSourceCategory] = useState('Backend & Tech');
  const [testingSource, setTestingSource] = useState(false);
  const [testResult, setTestResult] = useState<CrawlTestResult | null>(null);

  if (!isOpen) return null;

  const handleTestSource = async () => {
    if (!newSourceUrl) return;
    setTestingSource(true);
    setTestResult(null);
    try {
      const res = await apiClient.post('/sources/test', null, {
        params: { target_url: newSourceUrl },
      });
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({
        success: false,
        detected_type: 'unknown',
        items_count: 0,
        sample_titles: [],
        error: err?.response?.data?.detail || err.message,
      });
    } finally {
      setTestingSource(false);
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/sources', {
        name: newSourceName,
        url: newSourceUrl,
        category: newSourceCategory,
        is_active: true,
      });
      onClose();
      setNewSourceName('');
      setNewSourceUrl('');
      setTestResult(null);
      await onSourceAdded();
    } catch (err: any) {
      alert('Lỗi: ' + (err?.response?.data?.detail || err.message));
    }
  };

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
            <Plus className="h-5 w-5 text-emerald-700" /> Thêm Nguồn Tin Bằng URL
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-[#756e60] transition hover:bg-[#f4efe6] hover:text-[#1c1f24]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCreateSource} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-medium text-[#475569]">Tên nguồn tin:</label>
            <input
              type="text"
              placeholder="Ví dụ: Netflix Engineering Blog"
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              required
              className="w-full rounded-lg border border-[#dcd5c7] bg-white p-2.5 text-[#1e293b] focus:border-[#7c7465] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-[#475569]">
              URL Trang web hoặc RSS Feed:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://netflixtechblog.com"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                required
                className="flex-1 rounded-lg border border-[#dcd5c7] bg-white p-2.5 text-[#1e293b] focus:border-[#7c7465] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestSource}
                disabled={testingSource || !newSourceUrl}
                className="cursor-pointer rounded-lg border border-[#ded7ca] bg-[#f4efe6] px-3.5 py-2 font-medium text-[#2c313a] transition hover:bg-[#eae4d7] disabled:opacity-50"
              >
                {testingSource ? 'Đang test...' : 'Kiểm tra'}
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`rounded-lg border p-3.5 ${
                testResult.success
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <div>
                  <div className="mb-1 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Kết nối thành công! Tìm thấy{' '}
                    {testResult.items_count} bài viết.
                  </div>
                  {testResult.sample_titles && testResult.sample_titles.length > 0 && (
                    <div className="mt-1 text-[11px] text-[#475569]">
                      Bài mẫu: "{testResult.sample_titles[0]}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>Lỗi kiểm tra: {testResult.error}</div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block font-medium text-[#475569]">Chủ đề:</label>
            <select
              value={newSourceCategory}
              onChange={(e) => setNewSourceCategory(e.target.value)}
              className="w-full rounded-lg border border-[#dcd5c7] bg-white p-2.5 text-[#1e293b] focus:border-[#7c7465] focus:outline-none"
            >
              <option value="AI & Future Tech">🤖 AI & Công nghệ tương lai</option>
              <option value="Backend & Architecture">⚙️ Backend & Kiến trúc hệ thống</option>
              <option value="Vietnam Tech">🇻🇳 Tin công nghệ Việt Nam</option>
              <option value="Global Tech">🌐 Báo công nghệ quốc tế</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#e7e2d9] pt-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-[#f4efe6] px-4 py-2 font-medium text-[#475569] hover:bg-[#eae4d7]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800"
            >
              Lưu nguồn tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
