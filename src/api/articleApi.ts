
import { Article } from "@/types";

// In-memory store for articles
let articles: Article[] = [];

// API to store articles
export const storeArticle = (article: Article): void => {
  articles.push(article);
};

// API to bulk store articles
export const storeArticles = (newArticles: Article[]): void => {
  articles = [...articles, ...newArticles];
};

// API to get all articles
export const getAllArticles = (): Article[] => {
  return [...articles];
};

// API to get articles by topic
export const getArticlesByTopic = (topicId: string): Article[] => {
  return articles.filter(article => article.topicId === topicId);
};

// API to get single article
export const getArticleById = (id: string): Article | undefined => {
  return articles.find(article => article.id === id);
};

// Clear all articles
export const clearArticles = (): void => {
  articles = [];
};

// Express API endpoint simulation for external access
export const setupArticleApi = () => {
  // This would normally be set up with Express, but for this frontend-only app
  // we'll simulate an API endpoint that could be accessed with proper CORS headers
  if (window) {
    (window as any).articleApi = {
      getAllArticles,
      getArticlesByTopic,
      getArticleById,
    };
    
    console.info('Article API endpoints available at window.articleApi');
    console.info('Example usage:');
    console.info('- window.articleApi.getAllArticles()');
    console.info('- window.articleApi.getArticlesByTopic(topicId)');
    console.info('- window.articleApi.getArticleById(articleId)');
  }
};

// This would be used for a real API implementation with proper routes
export const getApiInstructions = (): string => {
  return `
# Article Generator API

## Endpoints

### GET /api/articles
Returns all generated articles

### GET /api/articles/topic/:topicId
Returns all articles for a specific topic

### GET /api/articles/:id
Returns a specific article by ID

## Example usage with fetch

\`\`\`javascript
// Get all articles
fetch('/api/articles')
  .then(response => response.json())
  .then(data => console.log(data));

// Get articles by topic
fetch('/api/articles/topic/123')
  .then(response => response.json())
  .then(data => console.log(data));

// Get specific article
fetch('/api/articles/456')
  .then(response => response.json())
  .then(data => console.log(data));
\`\`\`
  `;
};
