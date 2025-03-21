
import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerationSettingsProps {
  onSettingsChange: (settings: { articlesPerTopic: number; imagesPerArticle: number }) => void;
}

export function GenerationSettings({ onSettingsChange }: GenerationSettingsProps) {
  const [articlesPerTopic, setArticlesPerTopic] = useState(5);
  const [imagesPerArticle, setImagesPerArticle] = useState(1);
  const [loading, setLoading] = useState(true);

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
        
        if (data && data.value) {
          setArticlesPerTopic(data.value.articles_per_topic || 5);
          setImagesPerArticle(data.value.images_per_article || 1);
          onSettingsChange({
            articlesPerTopic: data.value.articles_per_topic || 5,
            imagesPerArticle: data.value.images_per_article || 1
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
        .update({
          value: { articles_per_topic: articlesPerTopic, images_per_article: imagesPerArticle }
        })
        .eq('key', 'generation_defaults');

      if (error) throw error;
      toast.success('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
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
            onValueChange={(values) => {
              const value = values[0];
              setArticlesPerTopic(value);
              onSettingsChange({ articlesPerTopic: value, imagesPerArticle });
            }}
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
            onValueChange={(values) => {
              const value = values[0];
              setImagesPerArticle(value);
              onSettingsChange({ articlesPerTopic: articlesPerTopic, imagesPerArticle: value });
            }}
          />
        </div>
      </div>
      
      <Button size="sm" onClick={handleSaveSettings}>
        Save Settings
      </Button>
    </div>
  );
}
