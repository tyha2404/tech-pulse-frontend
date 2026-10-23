import React, { useState } from 'react';
import { Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';
import type { CrawlTestResult } from '../types';
import { apiClient } from '../api';
import { primaryButton, secondaryButton } from '../utils/ui';
import { SOURCE_CATEGORY_LABELS } from '../utils/format';

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
  const [newSourceCategory, setNewSourceCategory] = useState('Backend & Architecture');
  const [testingSource, setTestingSource] = useState(false);
  const [testResult, setTestResult] = useState<CrawlTestResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    setSaveError(null);
    setSaving(true);
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
      setSaveError(`Không thêm được nguồn: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const field =
    'h-11 w-full rounded-lg border border-rule bg-surface px-3 text-[16px] text-ink placeholder:text-faint focus:border-ink-2 focus:outline-none sm:h-10 sm:text-[14px]';

  return (
    <div
      onClick={onClose}
      className="bg-ink-deep/40 fixed inset-0 z-50 flex items-end justify-center p-0 backdrop-blur-xs sm:items-center sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-source-title"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.25rem)' }}
        className="bg-paper shadow-ink/20 w-full max-w-lg cursor-default rounded-t-2xl p-5 shadow-2xl sm:rounded-2xl sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="add-source-title" className="text-ink text-[20px] font-semibold">
              Thêm nguồn tin
            </h2>
            <p className="text-muted mt-1 text-[14px]">
              Dán link trang web hoặc RSS. TechPulse tự tìm feed.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:bg-wash hover:text-ink -mt-1 -mr-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCreateSource} className="space-y-4">
          <div>
            <label htmlFor="src-url" className="text-ink-2 mb-1.5 block text-[13px] font-medium">
              Link trang web hoặc RSS
            </label>
            <div className="flex gap-2">
              <input
                id="src-url"
                type="url"
                placeholder="https://netflixtechblog.com"
                value={newSourceUrl}
                onChange={(e) => {
                  setNewSourceUrl(e.target.value);
                  setTestResult(null);
                }}
                required
                className={`${field} flex-1`}
              />
              <button
                type="button"
                onClick={handleTestSource}
                disabled={testingSource || !newSourceUrl}
                className="border-rule text-ink hover:bg-wash h-11 shrink-0 cursor-pointer rounded-lg border px-3.5 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
              >
                {testingSource ? 'Đang kiểm tra…' : 'Kiểm tra'}
              </button>
            </div>
            {testResult && (
              <p
                role="status"
                className={`mt-2 flex items-start gap-1.5 text-[13px] ${testResult.success ? 'text-signal-800' : 'text-danger-700'}`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span className="break-words">
                  {testResult.success
                    ? `Đọc được ${testResult.items_count} bài${
                        testResult.sample_titles?.[0]
                          ? `, ví dụ: “${testResult.sample_titles[0]}”`
                          : ''
                      }`
                    : `Không đọc được: ${testResult.error}`}
                </span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="src-name" className="text-ink-2 mb-1.5 block text-[13px] font-medium">
              Tên hiển thị
            </label>
            <input
              id="src-name"
              type="text"
              placeholder="Netflix Engineering"
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              required
              className={field}
            />
          </div>

          <div>
            <label htmlFor="src-cat" className="text-ink-2 mb-1.5 block text-[13px] font-medium">
              Nhóm
            </label>
            <select
              id="src-cat"
              value={newSourceCategory}
              onChange={(e) => setNewSourceCategory(e.target.value)}
              className={`${field} cursor-pointer`}
            >
              {Object.entries(SOURCE_CATEGORY_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {saveError && (
            <p role="alert" className="text-danger-700 text-[13px]">
              {saveError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Huỷ
            </button>
            <button type="submit" disabled={saving} className={primaryButton}>
              <Plus className="h-4 w-4" />
              {saving ? 'Đang thêm…' : 'Thêm nguồn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
