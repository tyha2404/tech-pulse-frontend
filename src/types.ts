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
  vietnamese_title?: string;
  vietnamese_summary?: string;
  key_takeaways: string[];
  new_tech_stacks: TechStackItem[];
  tags: string[];
  target_audience: string[];
  ai_model_used?: string;
  created_at: string;
}

export interface CrawlTestResult {
  success: boolean;
  detected_type: string;
  feed_url?: string;
  items_count: number;
  sample_titles: string[];
  error?: string;
}
