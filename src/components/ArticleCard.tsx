
import { Article } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(!!article.imageUrl);

  const toggleContent = () => {
    setShowFullContent(!showFullContent);
  };

  const copyToClipboard = () => {
    // Extract plain text from HTML content for copying
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = article.content;
    const plainText = `# ${article.title}\n\n${tempDiv.textContent || tempDiv.innerText || article.content}`;
    
    navigator.clipboard.writeText(plainText).then(
      () => {
        toast.success("Article copied to clipboard");
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast.error("Failed to copy article");
      }
    );
  };

  // Get the first paragraph of HTML content for preview
  const getContentPreview = () => {
    const div = document.createElement('div');
    div.innerHTML = article.content;
    
    // Get first two paragraphs or first heading + first paragraph
    let preview = '';
    const elements = div.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    
    for (let i = 0; i < Math.min(2, elements.length); i++) {
      preview += elements[i].outerHTML;
    }
    
    return preview || article.content.substring(0, 200) + '...';
  };

  return (
    <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-md animate-slide-up border border-border/40 backdrop-blur-xs bg-card/80">
      {article.imageUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          {isImageLoading && (
            <div className="absolute inset-0 bg-muted animate-pulse"></div>
          )}
          <img
            src={article.imageUrl}
            alt={article.title}
            className={`w-full h-full object-cover image-fade-mask transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsImageLoading(false)}
            onError={() => setIsImageLoading(false)}
          />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <CardTitle className="text-xl line-clamp-2">{article.title}</CardTitle>
        <CardDescription>
          Generated {article.createdAt.toLocaleDateString()} • {article.content.split(' ').length} words
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className={`article-content ${showFullContent ? '' : 'max-h-36 overflow-hidden'}`}>
          {showFullContent 
            ? <div dangerouslySetInnerHTML={{ __html: article.content }} />
            : <div dangerouslySetInnerHTML={{ __html: getContentPreview() }} />}
        </div>
        {!showFullContent && (
          <div className="h-8 bg-gradient-to-t from-card to-transparent mt-[-32px] relative"></div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={toggleContent}>
          {showFullContent ? "Show Less" : "Read More"}
        </Button>
        <Button variant="outline" size="sm" onClick={copyToClipboard}>
          Copy
        </Button>
      </CardFooter>
    </Card>
  );
}
