
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getApiInstructions } from "@/api/articleApi";

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<{ id: string; key: string; description: string; created_at: string }[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, key, description, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const generateApiKey = async () => {
    try {
      // Generate a random API key
      const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const { error } = await supabase
        .from('api_keys')
        .insert({ key, description: description || 'API Key' });

      if (error) throw error;
      
      toast.success('API key created successfully');
      setDescription("");
      loadApiKeys();
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('API key deleted successfully');
      loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success('Copied to clipboard'),
      () => toast.error('Failed to copy to clipboard')
    );
  };

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>API Access</CardTitle>
        <CardDescription>
          Create API keys to access your generated articles programmatically
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1"
          />
          <Button onClick={generateApiKey}>Generate Key</Button>
        </div>

        <Button variant="outline" className="w-full" onClick={toggleInstructions}>
          {showInstructions ? 'Hide API Instructions' : 'Show API Instructions'}
        </Button>
        
        {showInstructions && (
          <div className="mt-4 p-4 bg-secondary/50 rounded-md">
            <h3 className="text-lg font-medium mb-2">API Endpoints</h3>
            <pre className="text-xs overflow-x-auto p-2 bg-background rounded">
              {`GET https://${window.location.hostname}/articles
Headers:
  X-API-Key: your_api_key

Query Parameters:
  topic_id (optional) - Filter by topic ID
  limit (optional) - Limit number of results (default: 10)

Examples:
  // Get all articles
  GET https://${window.location.hostname}/articles
  
  // Get articles for a specific topic
  GET https://${window.location.hostname}/articles?topic_id=123
  
  // Get a limited number of articles
  GET https://${window.location.hostname}/articles?limit=5`}
            </pre>
          </div>
        )}
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Your API Keys</h3>
          
          {loading ? (
            <p className="text-muted-foreground">Loading API keys...</p>
          ) : apiKeys.length === 0 ? (
            <p className="text-muted-foreground">No API keys found. Generate one above.</p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="flex items-center justify-between p-2 bg-secondary/20 rounded">
                  <div className="overflow-hidden">
                    <div className="font-mono text-xs truncate max-w-[200px]">
                      {apiKey.key}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {apiKey.description} • {new Date(apiKey.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(apiKey.key)}>
                      Copy
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteApiKey(apiKey.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
