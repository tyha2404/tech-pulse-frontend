export interface Source {
  id: number;
  name: string;
  url: string;
  feed_url?: string;
  source_type: string;
  category: string;
  is_active: boolean;
  status: 'healthy' | 'warning' | 'error' | 'pending';
  last_crawled_at?: string;
  last_error?: string;
  articles_count: number;
}

export interface TechStackItem {
  name: string;
  category?: string;
  desc?: string;
}

export interface ArchitecturalTradeoffs {
  pros: string[];
  cons: string[];
  when_not_to_use: string[];
  scalability_bottlenecks: string[];
}

export interface NestJSBlueprint {
  architectural_pattern?: string;
  suggested_module_structure?: string;
  code_snippet?: string;
  database_integration?: string;
}

export interface LearningPath {
  prerequisites: string[];
  recommended_next_topics: string[];
}

export interface Article {
  id: number;
  source_id?: number;
  source_name?: string;
  title: string;
  url: string;
  author?: string;
  published_at?: string;
  is_processed: boolean;
  is_worth_reading: boolean;
  relevance_score: number;
  is_read: boolean;
  is_hidden: boolean;
  is_bookmarked: boolean;
  reading_time_minutes?: number;
  vietnamese_title?: string;
  vietnamese_summary?: string;
  key_takeaways: string[];
  new_tech_stacks: TechStackItem[];
  tags: string[];
  target_audience: string[];
  architectural_tradeoffs?: ArchitecturalTradeoffs;
  nestjs_blueprint?: NestJSBlueprint;
  learning_path?: LearningPath;
  ai_model_used?: string;
  cluster_id?: string;
  is_canonical?: boolean;
  cluster_topic_key?: string;
  similarity_score?: number;
  user_feedback?: string;
  related_articles?: RelatedSourceArticle[];
  created_at: string;
}

export interface RelatedSourceArticle {
  id: number;
  title: string;
  source_name?: string;
  url: string;
  published_at?: string;
  vietnamese_title?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface RelatedArticleItem {
  id: number;
  title: string;
  vietnamese_title?: string;
  relevance_score: number;
  tags: string[];
  source_name?: string;
}

export interface WeeklyRadarDigest {
  week_label: string;
  dominant_trends: Array<{
    topic: string;
    status: 'Adopt' | 'Trial' | 'Assess' | 'Hold' | string;
    summary: string;
    relevance: string;
  }>;
  architectural_shifts: string[];
  actionable_recommendations: string[];
  top_articles: RelatedArticleItem[];
}

export interface ReaderContent {
  id: number;
  title: string;
  vietnamese_title?: string;
  url: string;
  author?: string;
  source_name?: string;
  published_at?: string;
  reading_time_minutes: number;
  content: string;
  is_bookmarked: boolean;
}

export interface CrawlTestResult {
  success: boolean;
  detected_type: string;
  feed_url?: string;
  items_count: number;
  sample_titles: string[];
  error?: string;
}

export interface CrawlRun {
  id: number;
  source_id: number;
  started_at: string;
  finished_at?: string;
  duration_ms: number;
  http_status?: number;
  articles_found: number;
  articles_new: number;
  status: string;
  error_message?: string;
  created_at: string;
}

export interface SourceHealthMetric {
  id: number;
  name: string;
  url: string;
  source_type: string;
  status: string;
  articles_count: number;
  last_crawled_at?: string;
  last_error?: string;
  success_rate: number;
}

export interface AdminMetrics {
  total_articles: number;
  analyzed_articles: number;
  high_score_articles: number;
  total_sources: number;
  active_sources: number;
  healthy_sources: number;
  error_sources: number;
  recent_runs: CrawlRun[];
  source_health: SourceHealthMetric[];
  ai_model_distribution: Record<string, number>;
  circuit_breakers_status: Record<string, string>;
}

export interface UserPreference {
  user_id: string;
  topic_weights: Record<string, number>;
  preferred_sources: number[];
  created_at?: string;
  updated_at?: string;
}
