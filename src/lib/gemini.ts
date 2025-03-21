
import { ApiKeys, GeminiArticleResponse, GeminiRelatedTopicsResponse, GeminiTitleResponse } from "@/types";
import { toast } from "sonner";

// Rate limiting queue implementation
class ApiQueue {
  private queue: (() => Promise<any>)[] = [];
  private processing = false;
  private interval: number;

  constructor(interval = 2000) {
    this.interval = interval;
  }

  enqueue<T>(apiCall: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await apiCall();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const apiCall = this.queue.shift();

    try {
      if (apiCall) await apiCall();
    } catch (error) {
      console.error("Error processing queue item:", error);
    }

    // Wait for the specified interval before processing the next item
    setTimeout(() => {
      this.processQueue();
    }, this.interval);
  }
}

// Create queue with 2 second interval between requests
const geminiQueue = new ApiQueue(2000);

export class GeminiService {
  private apiKey: string;

  constructor(apiKeys: ApiKeys) {
    this.apiKey = apiKeys.geminiApiKey;
  }

  private async makeRequest<T>(prompt: string, model = "gemini-pro"): Promise<T> {
    return geminiQueue.enqueue(async () => {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || "Error calling Gemini API");
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
          throw new Error("Unexpected response format from Gemini API");
        }

        const text = data.candidates[0].content.parts[0].text;
        return this.parseResponse<T>(text);
      } catch (error) {
        console.error("Gemini API error:", error);
        toast.error("Gemini API error: " + (error instanceof Error ? error.message : "Unknown error"));
        throw error;
      }
    });
  }

  private parseResponse<T>(text: string): T {
    try {
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
      
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }
      
      // If there's no code block, try to parse the entire response as JSON
      try {
        return JSON.parse(text.trim());
      } catch (e) {
        // If direct parsing fails, process different response types based on the expected format
        if (text.includes("titles:") || text.includes("title:")) {
          // Handle titles format
          const titles = text.split(/\n/).filter(line => 
            line.trim().match(/^(\d+[\.\)]\s*|[-*]\s*|\"\s*|\'\s*)/)
          ).map(line => 
            line.replace(/^(\d+[\.\)]\s*|[-*]\s*|\"\s*|\'\s*)/, '').replace(/\"$/, '').replace(/\'$/, '').trim()
          );
          return { titles } as unknown as T;
        } else if (text.includes("topics:") || text.includes("topic:")) {
          // Handle topics format
          const topics = text.split(/\n/).filter(line => 
            line.trim().match(/^(\d+[\.\)]\s*|[-*]\s*|\"\s*|\'\s*)/)
          ).map(line => 
            line.replace(/^(\d+[\.\)]\s*|[-*]\s*|\"\s*|\'\s*)/, '').replace(/\"$/, '').replace(/\'$/, '').trim()
          );
          return { topics } as unknown as T;
        } else {
          // Assume it's an article content
          return { article: text.trim() } as unknown as T;
        }
      }
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      console.log("Original text:", text);
      throw new Error("Failed to parse Gemini API response");
    }
  }

  async generateTitles(topic: string): Promise<GeminiTitleResponse> {
    const prompt = `Generate 10 engaging, SEO-friendly article titles about "${topic}". 
    The titles should be diverse, covering different angles and aspects of the topic.
    Format your response as a JSON object with a "titles" array containing the titles.
    Example:
    {
      "titles": [
        "10 Surprising Facts About ${topic} You Never Knew",
        "How ${topic} Is Changing the Future of...",
        ...
      ]
    }`;

    return this.makeRequest<GeminiTitleResponse>(prompt);
  }

  async generateArticle(title: string, topic: string): Promise<GeminiArticleResponse> {
    const prompt = `Write a comprehensive, informative article with the title "${title}" related to the topic "${topic}".
    
    The article should:
    - Be well-structured with proper headings and paragraphs
    - Be informative and fact-based
    - Be approximately 800-1000 words
    - Include an introduction, main body with 3-5 sections, and a conclusion
    - Use an engaging, professional tone
    - Cite sources if applicable
    
    Return only the article content without any preamble or explanations.`;

    return this.makeRequest<GeminiArticleResponse>(prompt);
  }

  async generateRelatedTopics(topic: string): Promise<GeminiRelatedTopicsResponse> {
    const prompt = `Based on the topic "${topic}", generate 5 closely related topics that would interest someone researching this subject.
    
    Format your response as a JSON object with a "topics" array containing the topic names.
    Example:
    {
      "topics": [
        "Related Topic 1",
        "Related Topic 2",
        ...
      ]
    }
    
    The topics should be:
    - Clearly related to the original topic
    - Specific enough to be interesting
    - Broad enough to generate multiple articles
    - Diverse to cover different aspects of the main subject`;

    return this.makeRequest<GeminiRelatedTopicsResponse>(prompt);
  }
}
