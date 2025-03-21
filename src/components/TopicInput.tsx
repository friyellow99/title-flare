
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

interface TopicInputProps {
  onSubmit: (topics: string[]) => void;
  isGenerating: boolean;
}

export function TopicInput({ onSubmit, isGenerating }: TopicInputProps) {
  const [topicInput, setTopicInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topicInput.trim()) {
      toast.error("Please enter at least one topic");
      return;
    }
    
    // Split the input by commas and trim whitespace
    const topics = topicInput
      .split(",")
      .map((topic) => topic.trim())
      .filter((topic) => topic.length > 0);
    
    if (topics.length === 0) {
      toast.error("Please enter at least one valid topic");
      return;
    }
    
    onSubmit(topics);
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <div className="glass p-6 rounded-xl shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Enter Your Topics</h2>
            <p className="text-sm text-muted-foreground">
              Enter one or more topics separated by commas. The AI will generate articles based on these topics.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="e.g. artificial intelligence, renewable energy, mindfulness"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              className="flex-1 bg-white/50 dark:bg-black/30 border border-white/30 dark:border-white/10"
              disabled={isGenerating}
            />
            
            <Button 
              type="submit" 
              disabled={isGenerating}
              className="bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-300"
            >
              {isGenerating ? (
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
                  Generating...
                </span>
              ) : (
                "Generate Articles"
              )}
            </Button>
          </div>
          
          {isGenerating && (
            <div className="flex items-center justify-center py-2">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent/70 animate-pulse" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-accent/70 animate-pulse" style={{ animationDelay: "300ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-accent/70 animate-pulse" style={{ animationDelay: "600ms" }}></div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
