
import { useState, useEffect, useRef } from "react";
import { ApiProvider, useApi } from "@/context/ApiContext";
import { ApiKeyForm } from "@/components/ApiKeyForm";
import { TopicInput } from "@/components/TopicInput";
import { ArticleList } from "@/components/ArticleList";
import { RelatedTopics } from "@/components/RelatedTopics";
import { GenerationSettings } from "@/components/GenerationSettings";
import { ApiKeyManager } from "@/components/ApiKeyManager";
import { Article, Topic } from "@/types";
import { GeminiService } from "@/lib/gemini";
import { PexelsService } from "@/lib/pexels";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function IndexContent() {
  const { apiKeys, isApiKeysSet } = useApi();
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [continuousGeneration, setContinuousGeneration] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    stage: "" as "topics" | "titles" | "articles" | "",
  });
  const [settings, setSettings] = useState({
    articlesPerTopic: 5,
    imagesPerArticle: 1
  });

  // Reference to continue generation
  const generationRef = useRef<boolean>(false);

  // Effect to monitor continuous generation state
  useEffect(() => {
    generationRef.current = continuousGeneration;
  }, [continuousGeneration]);

  // Load existing articles from Supabase on mount
  useEffect(() => {
    const loadArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Convert to our Article type
          const loadedArticles: Article[] = data.map(item => ({
            id: item.id,
            title: item.title,
            content: item.content,
            topicId: item.topic_id,
            titleId: crypto.randomUUID(), // Generate a new ID since we don't store this
            imageUrl: item.image_url,
            createdAt: new Date(item.created_at)
          }));
          
          setArticles(loadedArticles);
          
          // Extract unique topics from articles
          const uniqueTopics = Array.from(new Set(loadedArticles.map(article => article.topicId)))
            .map(topicId => {
              const article = loadedArticles.find(a => a.topicId === topicId);
              const topicName = article?.title.split(" ").slice(0, 3).join(" ") || "Unknown Topic";
              
              return {
                id: topicId,
                name: topicName,
                isUserGenerated: true
              };
            });
          
          setTopics(prev => {
            const newTopics = uniqueTopics.filter(
              newTopic => !prev.some(existingTopic => existingTopic.id === newTopic.id)
            );
            return [...prev, ...newTopics];
          });
        }
      } catch (error) {
        console.error("Error loading articles:", error);
      }
    };
    
    if (isApiKeysSet) {
      loadArticles();
    }
  }, [isApiKeysSet]);

  const handleTopicSubmit = async (topicNames: string[]) => {
    if (!isApiKeysSet || !apiKeys) {
      toast.error("Please set your API keys first");
      return;
    }

    // Reset previous state when submitting new topics
    setContinuousGeneration(true);
    
    // Create topic objects
    const newTopics = topicNames.map((name) => ({
      id: crypto.randomUUID(),
      name,
      isUserGenerated: true,
    }));

    // Add to topics and set as selected
    setTopics((prev) => [...prev, ...newTopics]);
    setSelectedTopics(newTopics);

    // Start generation process
    generateContent(newTopics);
  };

  const generateContent = async (topicsToProcess: Topic[]) => {
    if (!isApiKeysSet || !apiKeys) return;

    setIsGenerating(true);
    setProgress({ current: 0, total: topicsToProcess.length, stage: "topics" });
    toast.info(`Starting article generation for ${topicsToProcess.length} topics`);

    const geminiService = new GeminiService(apiKeys);
    const pexelsService = apiKeys.pexelsApiKey ? new PexelsService(apiKeys) : null;

    try {
      // Step 1: Generate titles for each topic
      const allTitlesPromises = topicsToProcess.map(async (topic, index) => {
        // Check if generation should continue
        if (!generationRef.current) throw new Error("Generation stopped by user");
        
        setProgress({ 
          current: index + 1, 
          total: topicsToProcess.length, 
          stage: "titles" 
        });
        
        const result = await geminiService.generateTitles(topic.name);
        
        // Limit titles based on settings
        const limitedTitles = result.titles.slice(0, settings.articlesPerTopic);
        
        return limitedTitles.map((title) => ({
          id: crypto.randomUUID(),
          title,
          topicId: topic.id,
        }));
      });

      const allTitlesArrays = await Promise.all(allTitlesPromises);
      const allTitles = allTitlesArrays.flat();

      // Step 2: Generate articles for each title
      const totalArticles = allTitles.length;
      setProgress({ current: 0, total: totalArticles, stage: "articles" });

      const newArticles: Article[] = [];
      
      for (let i = 0; i < allTitles.length; i++) {
        // Check if generation should continue
        if (!generationRef.current) throw new Error("Generation stopped by user");
        
        const title = allTitles[i];
        const topic = topicsToProcess.find((t) => t.id === title.topicId);
        
        if (!topic) continue;
        
        setProgress({ current: i + 1, total: totalArticles, stage: "articles" });
        
        // Get article content
        const result = await geminiService.generateArticle(title.title, topic.name);
        
        // Get images if Pexels API is available
        let imageUrl: string | undefined;
        let additionalImages: string[] = [];
        
        if (pexelsService && settings.imagesPerArticle > 0) {
          const images = await pexelsService.searchImages(
            `${topic.name} ${title.title}`, 
            settings.imagesPerArticle
          );
          
          if (images && images.length > 0) {
            imageUrl = images[0]; // Primary image
            additionalImages = images.slice(1); // Additional images
          }
        }
        
        const article: Article = {
          id: crypto.randomUUID(),
          title: title.title,
          content: result.article,
          topicId: topic.id,
          titleId: title.id,
          imageUrl,
          additionalImages, // Store additional images
          createdAt: new Date(),
        };
        
        newArticles.push(article);
        
        // Update articles in real-time to show progress
        setArticles(prev => [...prev, article]);
        
        // Store the article in Supabase
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
      }
      
      // Step 3: Generate related topics
      if (generationRef.current) {
        const relatedTopicsPromises = topicsToProcess.map(async (topic) => {
          if (!generationRef.current) throw new Error("Generation stopped by user");
          const result = await geminiService.generateRelatedTopics(topic.name);
          
          return result.topics.map((topicName) => ({
            id: crypto.randomUUID(),
            name: topicName,
            isUserGenerated: false,
          }));
        });
        
        const relatedTopicsArrays = await Promise.all(relatedTopicsPromises);
        const relatedTopics = relatedTopicsArrays.flat();
        
        // Update state with new related topics
        setTopics((prev) => [...prev, ...relatedTopics]);
        
        toast.success(`Successfully generated ${newArticles.length} articles`);
        
        // Continue with the next generation cycle if continuous generation is enabled
        if (generationRef.current) {
          setSelectedTopics(relatedTopics);
          // Short delay to avoid hammering the API too much
          setTimeout(() => {
            if (generationRef.current) {
              generateContent(relatedTopics);
            }
          }, 2000);
        }
      }
    } catch (error) {
      if ((error as Error).message === "Generation stopped by user") {
        toast.info("Content generation was stopped by user");
      } else {
        console.error("Error generating content:", error);
        toast.error("Error generating content: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0, stage: "" });
    }
  };

  const handleSelectTopic = (topic: Topic) => {
    if (selectedTopics.some((t) => t.id === topic.id)) {
      setSelectedTopics((prev) => prev.filter((t) => t.id !== topic.id));
    } else {
      setSelectedTopics((prev) => [...prev, topic]);
    }
  };

  const handleGenerateMore = () => {
    if (selectedTopics.length === 0) {
      toast.error("Please select at least one topic");
      return;
    }
    
    setContinuousGeneration(true);
    generateContent(selectedTopics);
  };

  const handleStopGeneration = () => {
    setContinuousGeneration(false);
    toast.info("Stopping generation after current batch completes...");
  };

  const handleSettingsChange = (newSettings: { articlesPerTopic: number; imagesPerArticle: number }) => {
    setSettings(newSettings);
  };

  const renderProgressBar = () => {
    if (!isGenerating || progress.total === 0) return null;
    
    const percent = Math.round((progress.current / progress.total) * 100);
    let statusText = "";
    
    switch (progress.stage) {
      case "topics":
        statusText = `Processing topics (${progress.current}/${progress.total})`;
        break;
      case "titles":
        statusText = `Generating titles for topic ${progress.current}/${progress.total}`;
        break;
      case "articles":
        statusText = `Creating article ${progress.current}/${progress.total}`;
        break;
    }
    
    return (
      <div className="w-full max-w-2xl mx-auto mt-4 glass p-4 rounded-lg shadow-sm animate-slide-up">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{statusText}</span>
            <span>{percent}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div 
              className="bg-accent h-full transition-all duration-300 ease-out"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  if (!isApiKeysSet) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-12 space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">AI Article Generator</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate high-quality articles automatically with the power of Gemini 2.0 Flash Lite
          </p>
        </div>
        
        <ApiKeyForm />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-8 space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">AI Article Generator</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Generate high-quality articles automatically with the power of Gemini 2.0 Flash Lite
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <TopicInput onSubmit={handleTopicSubmit} isGenerating={isGenerating} />
          
          {renderProgressBar()}
          
          {topics.length > 0 && (
            <RelatedTopics 
              topics={topics} 
              onSelectTopic={handleSelectTopic} 
              selectedTopics={selectedTopics}
              isGenerating={isGenerating}
            />
          )}
          
          {selectedTopics.length > 0 && !isGenerating && (
            <div className="flex justify-center mt-4 gap-3">
              <Button 
                onClick={handleGenerateMore}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Generate Articles
              </Button>
            </div>
          )}
          
          {isGenerating && continuousGeneration && (
            <div className="flex justify-center mt-4">
              <Button 
                onClick={handleStopGeneration}
                variant="destructive"
              >
                Stop Automatic Generation
              </Button>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <GenerationSettings onSettingsChange={handleSettingsChange} />
          <ApiKeyManager />
        </div>
      </div>
      
      <ArticleList articles={articles} topics={topics} />
    </div>
  );
}

const Index = () => {
  return (
    <ApiProvider>
      <IndexContent />
    </ApiProvider>
  );
};

export default Index;
