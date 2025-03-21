
import { ApiKeys, PexelsSearchResponse } from "@/types";
import { toast } from "sonner";

export class PexelsService {
  private apiKey: string | null;

  constructor(apiKeys: ApiKeys) {
    this.apiKey = apiKeys.pexelsApiKey || null;
  }

  async searchImages(query: string): Promise<string | undefined> {
    if (!this.apiKey) {
      return undefined;
    }

    try {
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
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
        // Return the medium sized image
        return data.photos[0].src.medium;
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
