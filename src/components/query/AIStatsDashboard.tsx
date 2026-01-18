import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QueryItem } from '@/lib/types';
import { Cpu, MessageCircle, FileText, BarChart3, Hash } from 'lucide-react';

interface AIStatsDashboardProps {
  queries: QueryItem[];
}

interface EngineStats {
  engine: string;
  queryCount: number;
  answerCount: number;
  totalQueryChars: number;
  totalAnswerChars: number;
  totalQueryTokens: number;
  totalAnswerTokens: number;
}

export function AIStatsDashboard({ queries }: AIStatsDashboardProps) {
  const stats = useMemo(() => {
    const engineMap = new Map<string, { 
      queryCount: number; 
      answerCount: number; 
      totalQueryChars: number;
      totalAnswerChars: number;
      totalQueryTokens: number;
      totalAnswerTokens: number;
    }>();
    
    queries.forEach(query => {
      // Count queries by AI engine (source === 'generated' means AI-generated query)
      if (query.source === 'generated' && query.aiEngine) {
        const existing = engineMap.get(query.aiEngine) || { 
          queryCount: 0, answerCount: 0, 
          totalQueryChars: 0, totalAnswerChars: 0,
          totalQueryTokens: 0, totalAnswerTokens: 0 
        };
        existing.queryCount++;
        existing.totalQueryChars += query.queryLength || query.text.length;
        existing.totalQueryTokens += query.queryTokens?.completionTokens || 0;
        engineMap.set(query.aiEngine, existing);
      }
      
      // Count answers by AI engine
      if (query.answer && query.aiEngine) {
        const existing = engineMap.get(query.aiEngine) || { 
          queryCount: 0, answerCount: 0,
          totalQueryChars: 0, totalAnswerChars: 0,
          totalQueryTokens: 0, totalAnswerTokens: 0
        };
        existing.answerCount++;
        existing.totalAnswerChars += query.answerLength || query.answer.length;
        existing.totalAnswerTokens += query.answerTokens?.completionTokens || 0;
        engineMap.set(query.aiEngine, existing);
      }
    });

    const result: EngineStats[] = [];
    engineMap.forEach((value, key) => {
      result.push({
        engine: key,
        queryCount: value.queryCount,
        answerCount: value.answerCount,
        totalQueryChars: value.totalQueryChars,
        totalAnswerChars: value.totalAnswerChars,
        totalQueryTokens: value.totalQueryTokens,
        totalAnswerTokens: value.totalAnswerTokens,
      });
    });

    // Sort by total count descending
    return result.sort((a, b) => (b.queryCount + b.answerCount) - (a.queryCount + a.answerCount));
  }, [queries]);

  const totals = useMemo(() => {
    const totalQueries = queries.filter(q => q.source === 'generated').length;
    const totalAnswers = queries.filter(q => q.answer).length;
    const manualQueries = queries.filter(q => q.source === 'manual').length;
    const totalChars = stats.reduce((sum, s) => sum + s.totalQueryChars + s.totalAnswerChars, 0);
    const totalTokens = stats.reduce((sum, s) => sum + s.totalQueryTokens + s.totalAnswerTokens, 0);
    return { totalQueries, totalAnswers, manualQueries, totalChars, totalTokens };
  }, [queries, stats]);

  const maxCount = useMemo(() => {
    return Math.max(...stats.map(s => Math.max(s.queryCount, s.answerCount)), 1);
  }, [stats]);

  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            AI 엔진 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            AI로 생성된 데이터가 없습니다
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          AI 엔진 통계
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-primary/10">
            <p className="text-lg font-bold text-primary">{totals.totalQueries}</p>
            <p className="text-xs text-muted-foreground">AI 질의어</p>
          </div>
          <div className="p-2 rounded-lg bg-secondary">
            <p className="text-lg font-bold">{totals.totalAnswers}</p>
            <p className="text-xs text-muted-foreground">AI 답변</p>
          </div>
          <div className="p-2 rounded-lg bg-muted">
            <p className="text-lg font-bold text-muted-foreground">{totals.manualQueries}</p>
            <p className="text-xs text-muted-foreground">수동 추가</p>
          </div>
        </div>

        {/* Token & Char Summary */}
        {(totals.totalChars > 0 || totals.totalTokens > 0) && (
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-accent/50">
              <p className="text-sm font-bold">{totals.totalChars.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">총 글자수</p>
            </div>
            <div className="p-2 rounded-lg bg-accent/50">
              <p className="text-sm font-bold">{totals.totalTokens.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">총 토큰</p>
            </div>
          </div>
        )}

        {/* Per-engine stats */}
        <div className="space-y-3">
          {stats.map(stat => (
            <div key={stat.engine} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs gap-1">
                  <Cpu className="h-3 w-3" />
                  {stat.engine}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {stat.queryCount + stat.answerCount}건
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-primary" />
                  <div className="flex-1">
                    <Progress 
                      value={(stat.queryCount / maxCount) * 100} 
                      className="h-2"
                    />
                  </div>
                  <span className="text-xs w-8 text-right">{stat.queryCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-3 w-3 text-muted-foreground" />
                  <div className="flex-1">
                    <Progress 
                      value={(stat.answerCount / maxCount) * 100} 
                      className="h-2 [&>div]:bg-muted-foreground"
                    />
                  </div>
                  <span className="text-xs w-8 text-right">{stat.answerCount}</span>
                </div>
              </div>
              {/* Char & Token stats per engine */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground pl-5">
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {(stat.totalQueryChars + stat.totalAnswerChars).toLocaleString()}자
                </span>
                <span>
                  {(stat.totalQueryTokens + stat.totalAnswerTokens).toLocaleString()}토큰
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground border-t">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3 text-primary" /> 질의어
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" /> 답변
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
