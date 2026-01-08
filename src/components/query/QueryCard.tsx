import { Edit2, Trash2, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { QueryItem } from '@/lib/types';

interface QueryCardProps {
  query: QueryItem;
  onEdit: (query: QueryItem) => void;
  onDelete: (id: string) => void;
}

export function QueryCard({ query, onEdit, onDelete }: QueryCardProps) {
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
      </CardContent>
    </Card>
  );
}
