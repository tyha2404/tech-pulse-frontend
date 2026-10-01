import axios from 'axios';
import type { AdminMetrics, Article, UserPreference } from './types';

// Vite reads environment variables prefixed with VITE_
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes timeout for deep AI analysis & tunnel latency
});

// Admin API
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const res = await apiClient.get<AdminMetrics>('/admin/metrics');
  return res.data;
}

export async function resetCircuitBreakers(): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>('/admin/circuit-breaker/reset');
  return res.data;
}

// Semantic Search API
export async function searchSemanticArticles(params: {
  query: string;
  topic?: string;
  source_id?: number;
  min_score?: number;
  limit?: number;
}): Promise<Article[]> {
  const res = await apiClient.get<Article[]>('/articles/semantic-search', { params });
  return res.data;
}

// Personalization API
export async function getPersonalizedArticles(
  userId = 'default_user',
  limit = 30
): Promise<Article[]> {
  const res = await apiClient.get<Article[]>('/articles/personalized', {
    params: { user_id: userId, limit },
  });
  return res.data;
}

export async function getUserPreferences(userId = 'default_user'): Promise<UserPreference> {
  const res = await apiClient.get<UserPreference>('/preferences', {
    params: { user_id: userId },
  });
  return res.data;
}

export async function updateUserPreferences(
  payload: { topic_weights?: Record<string, number>; preferred_sources?: number[] },
  userId = 'default_user'
): Promise<UserPreference> {
  const res = await apiClient.put<UserPreference>('/preferences', payload, {
    params: { user_id: userId },
  });
  return res.data;
}

// Feedback API
export async function sendArticleFeedback(
  articleId: number,
  feedbackType: 'like' | 'dislike' | 'bookmark' | 'hide',
  notes?: string
): Promise<{ success: boolean; feedback_id: number }> {
  const res = await apiClient.post<{ success: boolean; feedback_id: number }>(
    `/articles/${articleId}/feedback`,
    { feedback_type: feedbackType, source: 'web', notes }
  );
  return res.data;
}

// Markdown Export API
export async function exportArticleMarkdown(articleId: number): Promise<string> {
  try {
    const res = await apiClient.post<{ markdown?: string } | string>(
      `/articles/${articleId}/export-markdown`
    );
    if (typeof res.data === 'string') return res.data;
    if (res.data && typeof res.data === 'object' && res.data.markdown) return res.data.markdown;
  } catch (err) {
    // Try fallback GET /articles/{id}/markdown
    try {
      const getRes = await apiClient.get<string>(`/articles/${articleId}/markdown`, {
        responseType: 'text',
      });
      if (typeof getRes.data === 'string') return getRes.data;
    } catch {
      // Re-throw to allow client-side generation
      throw err;
    }
  }
  throw new Error('No markdown content returned');
}

// On-demand Blueprint API
export async function generateArticleBlueprint(articleId: number): Promise<Article> {
  try {
    const res = await apiClient.post<Article>(
      `/articles/${articleId}/generate-blueprint`,
      {},
      {
        timeout: 180000,
      }
    );
    return res.data;
  } catch {
    // Fallback to summarize endpoint
    const res = await apiClient.post<Article>(
      `/articles/${articleId}/summarize`,
      {},
      {
        timeout: 180000,
      }
    );
    return res.data;
  }
}
