
import { Article, Topic } from "@/types";
import { ArticleCard } from "./ArticleCard";

interface ArticleListProps {
  articles: Article[];
  topics: Topic[];
}

export function ArticleList({ articles, topics }: ArticleListProps) {
  // Group articles by topic
  const articlesGroupedByTopic = topics.map(topic => {
    const topicArticles = articles.filter(article => article.topicId === topic.id);
    return {
      topic,
      articles: topicArticles
    };
  }).filter(group => group.articles.length > 0);

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No articles generated yet. Enter topics above to get started.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 mt-6 pb-12">
      {articlesGroupedByTopic.map(({ topic, articles }) => (
        <div key={topic.id} className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">{topic.name}</h2>
            <span className="text-sm bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
              {articles.length} {articles.length === 1 ? "article" : "articles"}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
