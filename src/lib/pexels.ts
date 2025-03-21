
import { ApiKeys, PexelsSearchResponse } from "@/types";
import { toast } from "sonner";

export class PexelsService {
  private apiKey: string | null;

  constructor(apiKeys: ApiKeys) {
    this.apiKey = apiKeys.pexelsApiKey || null;
  }

  async searchImages(query: string, count: number = 1): Promise<string[] | undefined> {
    if (!this.apiKey) {
      return undefined;
    }

    try {
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`, {
        headers: {
          Authorization: this.apiKey,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error calling Pexels API");
      }

      const data: PexelsSearchResponse = await response.json();
      
      if (data.photos && data.photos.length > 0) {
        // Return an array of medium sized images
        return data.photos.map(photo => photo.src.medium);
      }
      
      return undefined;
    } catch (error) {
      console.error("Pexels API error:", error);
      toast.error("Pexels API error: " + (error instanceof Error ? error.message : "Unknown error"));
      return undefined;
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
