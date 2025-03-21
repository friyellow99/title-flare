
import { useApi } from "@/context/ApiContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export function ApiKeyForm() {
  const { setApiKeys } = useApi();
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [pexelsApiKey, setPexelsApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!geminiApiKey.trim()) {
      toast.error("Gemini API key is required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simple validation of API key format
      if (!geminiApiKey.startsWith("AI") && !geminiApiKey.match(/^[A-Za-z0-9_-]{30,}$/)) {
        toast.warning("Gemini API key format looks incorrect. Please check and try again.");
      }
      
      // Save the API keys
      setApiKeys({
        geminiApiKey: geminiApiKey.trim(),
        pexelsApiKey: pexelsApiKey.trim() || undefined,
      });
      
      toast.success("API keys saved successfully!");
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast.error("Failed to save API keys");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="glass p-6 rounded-xl shadow-lg border border-white/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gemini-api-key" className="text-sm font-medium">
              Gemini AI API Key <span className="text-red-500">*</span>
            </Label>
            <Input
              id="gemini-api-key"
              type="password"
              placeholder="Enter your Gemini API key"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              required
              className="bg-white/50 dark:bg-black/30 border border-white/30 dark:border-white/10"
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from the{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pexels-api-key" className="text-sm font-medium">
              Pexels API Key <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="pexels-api-key"
              type="password"
              placeholder="Enter your Pexels API key"
              value={pexelsApiKey}
              onChange={(e) => setPexelsApiKey(e.target.value)}
              className="bg-white/50 dark:bg-black/30 border border-white/30 dark:border-white/10"
            />
            <p className="text-xs text-muted-foreground">
              For images in articles. Get your API key from{" "}
              <a
                href="https://www.pexels.com/api/new/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Pexels API
              </a>
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save API Keys"
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Your API keys will be stored locally in your browser and never sent to our servers.
          </p>
        </form>
      </div>
    </div>
  );
}
