import React, { useState } from 'react';
import { Send, Bot, User, Copy, Check, MessageSquare } from 'lucide-react';
import { apiClient } from '../api';
import type { ChatMessage } from '../types';

interface ArticleChatCopilotProps {
  articleId: number;
  articleTitle: string;
}

const QUICK_PROMPTS = [
  '🧱 Viết code NestJS Service chuẩn mẫu',
  '⚠️ Các điểm nghẽn hiệu năng khi scale?',
  '🔄 So sánh giải pháp này với công nghệ khác',
  '📐 Thiết kế schema Prisma / database phù hợp',
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
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: 'Xin lỗi, đã xảy ra lỗi khi trao đổi với AI Copilot. Vui lòng thử lại sau ít phút.',
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
    <div className="flex h-[420px] sm:h-[520px] flex-col rounded-xl border border-[#e7e2d9] bg-[#fdfcfa] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e7e2d9] bg-[#f7f4ee] px-3 sm:px-4 py-2 sm:py-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Bot className="h-4 w-4 text-indigo-700" />
          <span className="text-[11px] sm:text-xs font-bold text-[#1c1f24] truncate max-w-[200px] sm:max-w-none">
            AI Copilot (Principal Architect)
          </span>
        </div>
        <span className="shrink-0 rounded bg-indigo-100/70 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-indigo-800">
          Backend & AI
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-[#756e60]">
            <MessageSquare className="mb-2 h-8 w-8 text-[#a8a193]" />
            <p className="font-medium text-[#2c313a]">
              Hỏi đáp chuyên sâu về kiến trúc & code với bài viết này
            </p>
            <p className="mt-1 max-w-sm text-[11px] text-[#756e60]">
              Bạn có thể yêu cầu AI sinh mã nguồn NestJS Module/Service, phân tích rủi ro khi scale, hoặc đề xuất cấu trúc Prisma DB.
            </p>

            {/* Quick Prompts */}
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(prompt)}
                  className="cursor-pointer rounded-full border border-[#d8d2c4] bg-white px-3 py-1 text-[11px] font-medium text-[#4a4439] shadow-2xs transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-900"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-800">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3 shadow-2xs ${
                  m.role === 'user'
                    ? 'bg-[#24292f] text-white'
                    : 'border border-[#e7e2d9] bg-white text-[#2c313a]'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {m.content}
                </div>
                {m.role === 'assistant' && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => handleCopyCode(m.content, idx)}
                      className="cursor-pointer flex items-center gap-1 text-[10px] text-[#756e60] hover:text-indigo-700"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Sao chép
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eee9df] text-[#4a4439]">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2 text-[#756e60]">
            <Bot className="h-4 w-4 animate-bounce text-indigo-600" />
            <span className="text-[11px] italic">AI Architect đang phân tích và soạn câu trả lời...</span>
          </div>
        )}
      </div>

      {/* Suggested Followups */}
      {followups.length > 0 && !loading && (
        <div className="flex flex-wrap gap-1 border-t border-[#ede7dc] bg-[#fbf9f5] px-4 py-2">
          <span className="text-[10px] font-bold uppercase text-[#756e60]">Gợi ý:</span>
          {followups.map((f, i) => (
            <button
              key={i}
              onClick={() => sendMessage(f)}
              className="cursor-pointer rounded-md border border-[#dfd8ca] bg-white px-2 py-0.5 text-[10px] text-indigo-900 transition hover:bg-indigo-50"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-[#e7e2d9] bg-white p-2.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi về kiến trúc, trade-offs hoặc yêu cầu code NestJS..."
            className="flex-1 rounded-lg border border-[#dcd5c7] bg-[#fcfbf9] px-3 py-2 text-xs text-[#1c1f24] focus:border-indigo-500 focus:bg-white focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="cursor-pointer flex items-center justify-center rounded-lg bg-indigo-900 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-indigo-950 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
