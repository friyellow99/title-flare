
import { Article } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// API to store article
export const storeArticle = async (article: Article): Promise<void> => {
  await supabase
    .from('articles')
    .insert({
      id: article.id,
      title: article.title,
      content: article.content,
      topic_id: article.topicId,
      image_url: article.imageUrl,
      created_at: article.createdAt.toISOString()
    });
};

// API to bulk store articles
export const storeArticles = async (newArticles: Article[]): Promise<void> => {
  const formattedArticles = newArticles.map(article => ({
    id: article.id,
    title: article.title,
    content: article.content,
    topic_id: article.topicId,
    image_url: article.imageUrl,
    created_at: article.createdAt.toISOString()
  }));
  
  await supabase
    .from('articles')
    .insert(formattedArticles);
};

// API to get all articles
export const getAllArticles = async (): Promise<Article[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  return (data || []).map(item => ({
    id: item.id,
    title: item.title,
    content: item.content,
    topicId: item.topic_id,
    titleId: item.id, // Use the same ID as article ID
    imageUrl: item.image_url,
    createdAt: new Date(item.created_at)
  }));
};

// API to get articles by topic
export const getArticlesByTopic = async (topicId: string): Promise<Article[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  return (data || []).map(item => ({
    id: item.id,
    title: item.title,
    content: item.content,
    topicId: item.topic_id,
    titleId: item.id, // Use the same ID as article ID
    imageUrl: item.image_url,
    createdAt: new Date(item.created_at)
  }));
};

// API to get single article
export const getArticleById = async (id: string): Promise<Article | null> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) return null;
  
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    topicId: data.topic_id,
    titleId: data.id, // Use the same ID as article ID
    imageUrl: data.image_url,
    createdAt: new Date(data.created_at)
  };
};

// Generate a new API key
export const generateApiKey = async (description: string): Promise<string | null> => {
  const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  const { error } = await supabase
    .from('api_keys')
    .insert({ key, description: description || 'API Key' });
    
  if (error) return null;
  return key;
};

// Get API documentation
export const getApiInstructions = (): string => {
  return `
# Article Generator API

## Authentication

All API requests require an API key sent in the \`X-API-Key\` header.

## Endpoints

### GET /articles

Returns all generated articles.

#### Query Parameters:
- \`topic_id\` (optional): Filter articles by topic ID
- \`limit\` (optional): Limit number of results (default: 10)

#### Example Request:
\`\`\`
curl -X GET "https://${window.location.hostname}/articles" \\
  -H "X-API-Key: your_api_key"
\`\`\`

#### Example Response:
\`\`\`json
{
  "articles": [
    {
      "id": "uuid",
      "title": "Article Title",
      "content": "Article content with HTML formatting",
      "topic_id": "topic-uuid",
      "image_url": "https://example.com/image.jpg",
      "created_at": "2023-07-25T15:30:00.000Z"
    }
  ]
}
\`\`\`

### GET /articles?topic_id=123

Returns articles for a specific topic.

#### Example Request:
\`\`\`
curl -X GET "https://${window.location.hostname}/articles?topic_id=123" \\
  -H "X-API-Key: your_api_key"
\`\`\`

## Error Responses

\`\`\`json
{
  "error": "Error message"
}
\`\`\`

Common error codes:
- 401: Missing or invalid API key
- 500: Server error
  `;
};

// Setup function is no longer needed as we're using Supabase directly
export const setupArticleApi = (): void => {
  console.info('Article API endpoints are now handled by Supabase Edge Functions');
};
