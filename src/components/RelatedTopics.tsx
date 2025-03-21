
import { Topic } from "@/types";
import { Button } from "@/components/ui/button";

interface RelatedTopicsProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
  selectedTopics: Topic[];
  isGenerating: boolean;
}

export function RelatedTopics({ topics, onSelectTopic, selectedTopics, isGenerating }: RelatedTopicsProps) {
  const userGeneratedTopics = topics.filter(topic => topic.isUserGenerated);
  const aiGeneratedTopics = topics.filter(topic => !topic.isUserGenerated);
  
  // Check if a topic is already selected
  const isTopicSelected = (topic: Topic) => {
    return selectedTopics.some(selected => selected.id === topic.id);
  };

  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto glass p-6 rounded-xl shadow-md animate-slide-up">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Your Topics</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {userGeneratedTopics.length > 0 ? (
              userGeneratedTopics.map(topic => (
                <Button
                  key={topic.id}
                  variant={isTopicSelected(topic) ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSelectTopic(topic)}
                  disabled={isGenerating}
                  className="transition-all duration-200"
                >
                  {topic.name}
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No user topics yet</p>
            )}
          </div>
        </div>
        
        {aiGeneratedTopics.length > 0 && (
          <div>
            <h2 className="text-lg font-medium">Related Topics</h2>
            <p className="text-sm text-muted-foreground mb-2">
              These topics were generated by AI based on your inputs
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {aiGeneratedTopics.map(topic => (
                <Button
                  key={topic.id}
                  variant={isTopicSelected(topic) ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSelectTopic(topic)}
                  disabled={isGenerating}
                  className="transition-all duration-200"
                >
                  {topic.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
