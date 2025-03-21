import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define the shape of our settings
interface GenerationSettings {
  articles_per_topic: number;
  images_per_article: number;
}

interface GenerationSettingsProps {
  onSettingsChange: (settings: { articlesPerTopic: number; imagesPerArticle: number }) => void;
}

export function GenerationSettings({ onSettingsChange }: GenerationSettingsProps) {
  const [articlesPerTopic, setArticlesPerTopic] = useState<number>(5);
  const [imagesPerArticle, setImagesPerArticle] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Load settings from Supabase on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'generation_defaults')
          .single();

        if (error) throw error;

        // Type check and safely access the properties
        if (data && data.value && typeof data.value === 'object') {
          const settings = data.value as GenerationSettings;
          const articles = settings.articles_per_topic ?? 5;
          const images = settings.images_per_article ?? 1;

          setArticlesPerTopic(articles);
          setImagesPerArticle(images);
          onSettingsChange({
            articlesPerTopic: articles,
            imagesPerArticle: images,
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [onSettingsChange]);

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'generation_defaults',
          value: {
            articles_per_topic: articlesPerTopic,
            images_per_article: imagesPerArticle,
          },
        });

      if (error) throw error;
      toast.success('Settings saved');
      onSettingsChange({
        articlesPerTopic,
        imagesPerArticle,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  // Handler for articles per topic slider
  const handleArticlesChange = (value: number[]) => {
    const newValue = value[0];
    setArticlesPerTopic(newValue);
    onSettingsChange({
      articlesPerTopic: newValue,
      imagesPerArticle,
    });
  };

  // Handler for images per article slider
  const handleImagesChange = (value: number[]) => {
    const newValue = value[0];
    setImagesPerArticle(newValue);
    onSettingsChange({
      articlesPerTopic,
      imagesPerArticle: newValue,
    });
  };

  if (loading) {
    return <div className="flex justify-center py-4">Loading settings...</div>;
  }

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm space-y-4">
      <h3 className="text-lg font-medium">Generation Settings</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="articles-slider">Articles per topic: {articlesPerTopic}</Label>
          </div>
          <Slider
            id="articles-slider"
            min={1}
            max={10}
            step={1}
            value={[articlesPerTopic]}
            onValueChange={handleArticlesChange}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="images-slider">Images per article: {imagesPerArticle}</Label>
          </div>
          <Slider
            id="images-slider"
            min={0}
            max={3}
            step={1}
            value={[imagesPerArticle]}
            onValueChange={handleImagesChange}
          />
        </div>
      </div>

      <Button size="sm" onClick={handleSaveSettings}>
        Save Settings
      </Button>
    </div>
  );
}
