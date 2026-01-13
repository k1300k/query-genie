import { useRef } from 'react';
import { Search, Sparkles, Plus, Download, Upload, Settings, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Category } from '@/lib/types';
import { AIProvider } from './AISettingsModal';

interface MainToolbarProps {
  category: Category | undefined;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAutoGenerate: () => void;
  onGenerateAllAnswers: () => void;
  onAddQuery: () => void;
  onExport: (format: 'json' | 'csv', all?: boolean) => void;
  onImportCSV: (content: string) => void;
  onOpenAISettings: () => void;
  aiProvider: AIProvider;
  isGenerating?: boolean;
  isGeneratingAnswers?: boolean;
}

export function MainToolbar({ 
  category, 
  searchQuery, 
  onSearchChange, 
  onAutoGenerate,
  onGenerateAllAnswers,
  onAddQuery,
  onExport,
  onImportCSV,
  onOpenAISettings,
  aiProvider,
  isGenerating,
  isGeneratingAnswers
}: MainToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onImportCSV(content);
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };
  return (
    <div className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-foreground">
            {category?.name || '카테고리 선택'}
          </h1>
          {category && (
            <span className="text-sm text-muted-foreground">
              {category.description}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="질의어 검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button variant="ghost" size="icon" onClick={onOpenAISettings} title="AI 설정">
            <Settings className="h-4 w-4" />
          </Button>

          <Button 
            onClick={onAutoGenerate} 
            disabled={isGenerating || isGeneratingAnswers}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? '생성 중...' : `자동 생성 (${aiProvider === 'gemini' ? 'Gemini' : aiProvider === 'openai' ? 'ChatGPT' : 'Lovable'})`}
          </Button>

          <Button 
            variant="secondary"
            onClick={onGenerateAllAnswers} 
            disabled={isGenerating || isGeneratingAnswers}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            {isGeneratingAnswers ? '답변 생성 중...' : '전체 답변'}
          </Button>

          <Button variant="outline" onClick={onAddQuery} className="gap-2">
            <Plus className="h-4 w-4" />
            추가
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                내보내기
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport('json')}>
                현재 카테고리 (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('csv')}>
                현재 카테고리 (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('json', true)}>
                전체 카테고리 (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('csv', true)}>
                전체 카테고리 (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" />
            불러오기
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
