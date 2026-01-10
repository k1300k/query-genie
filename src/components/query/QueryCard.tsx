import { useState } from 'react';
import { Edit2, Trash2, Sparkles, User, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { QueryItem } from '@/lib/types';

interface QueryCardProps {
  query: QueryItem;
  onEdit: (query: QueryItem) => void;
  onDelete: (id: string) => void;
  onGenerateAnswer?: (query: QueryItem) => Promise<string>;
}

export function QueryCard({ query, onEdit, onDelete, onGenerateAnswer }: QueryCardProps) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAnswer = async () => {
    if (!onGenerateAnswer) return;
    
    setIsGenerating(true);
    try {
      const generatedAnswer = await onGenerateAnswer(query);
      setAnswer(generatedAnswer);
    } catch (error) {
      console.error('Failed to generate answer:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground mb-2 leading-relaxed">
              "{query.text}"
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {query.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={query.source === 'generated' ? 'default' : 'outline'} 
                className="text-xs gap-1"
              >
                {query.source === 'generated' ? (
                  <>
                    <Sparkles className="h-3 w-3" />
                    AI 생성
                  </>
                ) : (
                  <>
                    <User className="h-3 w-3" />
                    수동 추가
                  </>
                )}
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs gap-1"
                onClick={handleGenerateAnswer}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-3 w-3" />
                    답변
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onEdit(query)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(query.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Answer Section */}
        {answer && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">AI 답변</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {answer}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
