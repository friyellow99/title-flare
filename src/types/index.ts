
export interface ApiKeys {
  geminiApiKey: string;
  pexelsApiKey?: string;
}

export interface Topic {
  id: string;
  name: string;
  isUserGenerated: boolean;
}

export interface ArticleTitle {
  id: string;
  title: string;
  topicId: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  topicId: string;
  titleId: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface GeminiTitleResponse {
  titles: string[];
}

export interface GeminiArticleResponse {
  article: string;
}

export interface GeminiRelatedTopicsResponse {
  topics: string[];
}

export interface PexelsImage {
  id: string;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

export interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsImage[];
  next_page: string;
}
