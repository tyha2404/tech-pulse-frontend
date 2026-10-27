import React, { useState } from 'react';
import { IconCheck, IconCopy, IconSend, IconSpinner } from './icons';
import { apiClient } from '../api';
import type { ChatMessage } from '../types';

interface ArticleChatCopilotProps {
  articleId: number;
  articleTitle: string;
}

const QUICK_PROMPTS = [
  'Viết NestJS service áp dụng ý tưởng này',
  'Điểm nghẽn khi scale là gì?',
  'So sánh với các giải pháp thay thế',
  'Gợi ý schema Prisma phù hợp',
];

export const ArticleChatCopilot: React.FC<ArticleChatCopilotProps> = ({ articleId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post(`/articles/${articleId}/chat`, {
        message: textToSend.trim(),
        history: newHistory.map((m) => ({ role: m.role, content: m.content })),
      });

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([...newHistory, assistantMsg]);
      setFollowups(res.data.suggested_followups || []);
    } catch {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content:
          'Không nhận được câu trả lời: AI gateway không phản hồi. Gửi lại câu hỏi sau ít phút.',
      };
      setMessages([...newHistory, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex h-[min(560px,calc(100dvh-16rem))] min-h-[380px] flex-col">
      <div
        className="-mx-4 flex-1 space-y-5 overflow-y-auto px-4 pb-4 sm:-mx-7 sm:px-7"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-end">
            <p className="text-ink text-[16px] font-semibold">Hỏi AI về bài này</p>
            <p className="text-muted mt-1 max-w-prose text-[14px] leading-relaxed">
              AI đã đọc bài và trả lời như một kiến trúc sư backend: viết code, phân tích rủi ro
              hoặc so sánh giải pháp.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="border-rule text-ink-2 hover:bg-wash hover:text-ink h-9 cursor-pointer rounded-full border px-3.5 text-[13px] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, idx) =>
            m.role === 'user' ? (
              <div key={idx} className="flex justify-end">
                <div className="bg-primary max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-white">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={idx} className="max-w-[95%]">
                <div className="text-ink text-[15px] leading-[1.65] whitespace-pre-wrap">
                  {m.content}
                </div>
                <button
                  onClick={() => handleCopyCode(m.content, idx)}
                  className="text-muted hover:bg-wash hover:text-ink mt-1 -ml-2 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2 text-[13px]"
                >
                  {copiedIndex === idx ? (
                    <>
                      <IconCheck className="text-signal-600 h-3.5 w-3.5" /> Đã sao chép
                    </>
                  ) : (
                    <>
                      <IconCopy className="h-3.5 w-3.5" /> Sao chép
                    </>
                  )}
                </button>
              </div>
            )
          )
        )}

        {loading && (
          <p role="status" className="text-muted flex items-center gap-2 text-[14px]">
            <IconSpinner className="h-4 w-4 animate-spin" /> AI đang soạn câu trả lời…
          </p>
        )}
      </div>

      {followups.length > 0 && !loading && (
        <div className="border-rule flex flex-wrap gap-1.5 border-t py-3">
          {followups.map((f, i) => (
            <button
              key={i}
              onClick={() => sendMessage(f)}
              className="border-rule text-ink-2 hover:bg-wash hover:text-ink h-8 cursor-pointer rounded-full border px-3 text-[13px] transition-colors"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="border-rule bg-surface focus-within:border-ink-2 flex items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-4"
      >
        <label htmlFor={`chat-${articleId}`} className="sr-only">
          Câu hỏi cho AI
        </label>
        <input
          id={`chat-${articleId}`}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi về kiến trúc, đánh đổi, hoặc nhờ viết code…"
          className="text-ink placeholder:text-faint h-10 min-w-0 flex-1 bg-transparent text-[16px] focus:outline-none sm:text-[15px]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-primary hover:bg-primary-hover flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Gửi câu hỏi"
        >
          <IconSend className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
