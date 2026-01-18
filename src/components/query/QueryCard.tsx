import { useState } from 'react';
import { Edit2, Trash2, Sparkles, User, MessageCircle, Loader2, ExternalLink, Cpu, FileText, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { QueryItem, TokenUsage } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AnswerResult {
  answer: string;
  answerLength?: number;
  answerTokens?: TokenUsage;
}

interface QueryCardProps {
  query: QueryItem;
  onEdit: (query: QueryItem) => void;
  onDelete: (id: string) => void;
  onGenerateAnswer?: (query: QueryItem) => Promise<AnswerResult>;
  onUpdateAnswer?: (id: string, updates: { answer: string; answerLength?: number; answerTokens?: TokenUsage }) => void;
}

export function QueryCard({ query, onEdit, onDelete, onGenerateAnswer, onUpdateAnswer }: QueryCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAnswer = async () => {
    if (!onGenerateAnswer) return;
    
    setIsGenerating(true);
    try {
      const result = await onGenerateAnswer(query);
      onUpdateAnswer?.(query.id, {
        answer: result.answer,
        answerLength: result.answerLength,
        answerTokens: result.answerTokens,
      });
    } catch (error) {
      console.error('Failed to generate answer:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow touch-manipulation">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground mb-2 leading-relaxed">
              "{query.text}"
            </p>
            
            {/* Source URL - below query text */}
            {query.sourceUrl && (
              <a
                href={query.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-2"
              >
                <ExternalLink className="h-3 w-3" />
                {query.sourceUrl.length > 50 ? query.sourceUrl.slice(0, 50) + '...' : query.sourceUrl}
              </a>
            )}
            
            <div className="flex flex-wrap gap-1.5 mb-3">
              {query.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
              
              {/* AI Engine Tag */}
              {query.aiEngine && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Cpu className="h-3 w-3" />
                  {query.aiEngine}
                </Badge>
              )}

              {/* Query Length & Token Info */}
              {(query.queryLength || query.queryTokens) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs gap-1 cursor-help">
                        <FileText className="h-3 w-3" />
                        {query.queryLength || query.text.length}자
                        {query.queryTokens?.completionTokens && (
                          <span className="text-muted-foreground">/ {query.queryTokens.completionTokens}토큰</span>
                        )}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-1">
                        <p>길이: {query.queryLength || query.text.length}자</p>
                        {query.queryTokens && (
                          <>
                            <p>프롬프트 토큰: {query.queryTokens.promptTokens}</p>
                            <p>완료 토큰: {query.queryTokens.completionTokens}</p>
                            <p>총 토큰: {query.queryTokens.totalTokens}</p>
                          </>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
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
          
          <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
        {query.answer && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">AI 답변</span>
              {query.aiEngine && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Cpu className="h-3 w-3" />
                  {query.aiEngine}
                </Badge>
              )}
              {/* Answer Length & Token Info */}
              {(query.answerLength || query.answerTokens) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs gap-1 cursor-help ml-auto">
                        <Hash className="h-3 w-3" />
                        {query.answerLength || query.answer.length}자
                        {query.answerTokens?.completionTokens && (
                          <span className="text-muted-foreground">/ {query.answerTokens.completionTokens}토큰</span>
                        )}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-1">
                        <p>길이: {query.answerLength || query.answer.length}자</p>
                        {query.answerTokens && (
                          <>
                            <p>프롬프트 토큰: {query.answerTokens.promptTokens}</p>
                            <p>완료 토큰: {query.answerTokens.completionTokens}</p>
                            <p>총 토큰: {query.answerTokens.totalTokens}</p>
                          </>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {query.answer}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
