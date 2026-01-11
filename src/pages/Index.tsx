import { useState, useMemo, useCallback, useEffect } from 'react';
import { AppHeader } from '@/components/query/AppHeader';
import { CategorySidebar } from '@/components/query/CategorySidebar';
import { MainToolbar } from '@/components/query/MainToolbar';
import { QueryCard } from '@/components/query/QueryCard';
import { QueryEditorModal } from '@/components/query/QueryEditorModal';
import { CategoryModal } from '@/components/query/CategoryModal';
import { AISettingsModal, AISettings, AIProvider } from '@/components/query/AISettingsModal';
import { useQueryStore } from '@/hooks/useQueryStore';
import { QueryItem, Category } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'lovable',
  generateCount: 5,
  geminiModel: 'gemini-2.5-flash',
  openaiModel: 'gpt-4o-mini',
};

// Load AI settings from localStorage
const loadAISettings = (): AISettings => {
  try {
    const stored = localStorage.getItem('ai-settings');
    if (stored) {
      return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load AI settings');
  }
  return DEFAULT_AI_SETTINGS;
};

const Index = () => {
  const {
    categories,
    queries,
    selectedCategoryId,
    setSelectedCategoryId,
    addCategory,
    addQuery,
    addQueries,
    updateQuery,
    deleteQuery,
    getQueriesByCategory,
    exportQueries,
    importQueriesFromCSV,
  } = useQueryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [aiSettingsModalOpen, setAiSettingsModalOpen] = useState(false);
  const [editingQuery, setEditingQuery] = useState<QueryItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    setAiSettings(loadAISettings());
  }, []);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const queryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(cat => {
      counts[cat.id] = queries.filter(q => q.categoryId === cat.id && q.status === 'active').length;
    });
    return counts;
  }, [categories, queries]);

  const filteredQueries = useMemo(() => {
    let result = getQueriesByCategory(selectedCategoryId);
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(q => 
        q.text.toLowerCase().includes(lower) || 
        q.tags.some(t => t.toLowerCase().includes(lower))
      );
    }
    return result;
  }, [selectedCategoryId, searchQuery, getQueriesByCategory]);

  const handleAutoGenerate = async () => {
    if (!selectedCategory) return;
    
    setIsGenerating(true);
    try {
      const requestBody: Record<string, any> = {
        categoryId: selectedCategoryId,
        categoryName: selectedCategory.name,
        count: aiSettings.generateCount,
        provider: aiSettings.provider,
      };

      if (aiSettings.provider === 'gemini') {
        requestBody.geminiApiKey = aiSettings.geminiApiKey;
        requestBody.geminiModel = aiSettings.geminiModel || 'gemini-2.5-flash';
      } else if (aiSettings.provider === 'openai') {
        requestBody.openaiApiKey = aiSettings.openaiApiKey;
        requestBody.openaiModel = aiSettings.openaiModel || 'gpt-4o-mini';
      } else {
        requestBody.model = 'google/gemini-2.5-flash';
      }
      
      const { data, error } = await supabase.functions.invoke('generate-queries', {
        body: requestBody,
      });

      if (error) throw error;
      
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const generatedQueries = data.data.map((q: { text: string; tags: string[] }) => ({
        categoryId: selectedCategoryId,
        text: q.text,
        tags: q.tags,
        source: 'generated' as const,
        status: 'active' as const,
      }));

      addQueries(generatedQueries);
      toast.success(`${generatedQueries.length}개의 질의어가 AI로 생성되었습니다`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('질의어 생성 중 오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAnswer = useCallback(async (query: QueryItem): Promise<string> => {
    const category = categories.find(c => c.id === query.categoryId);
    
    const requestBody: Record<string, any> = {
      query: query.text,
      categoryId: query.categoryId,
      categoryName: category?.name || '',
      provider: aiSettings.provider,
    };

    if (aiSettings.provider === 'gemini') {
      requestBody.geminiApiKey = aiSettings.geminiApiKey;
      requestBody.geminiModel = aiSettings.geminiModel || 'gemini-2.5-flash';
    } else if (aiSettings.provider === 'openai') {
      requestBody.openaiApiKey = aiSettings.openaiApiKey;
      requestBody.openaiModel = aiSettings.openaiModel || 'gpt-4o-mini';
    } else {
      requestBody.model = 'google/gemini-2.5-flash';
    }

    const { data, error } = await supabase.functions.invoke('generate-answer', {
      body: requestBody,
    });

    if (error) {
      toast.error('답변 생성 중 오류가 발생했습니다');
      throw error;
    }

    if (data?.error) {
      toast.error(data.error);
      throw new Error(data.error);
    }

    return data.answer;
  }, [categories, aiSettings]);

  const handleEditQuery = (query: QueryItem) => {
    setEditingQuery(query);
    setQueryModalOpen(true);
  };

  const handleSaveQuery = (queryData: Partial<QueryItem>) => {
    if (editingQuery) {
      updateQuery(editingQuery.id, queryData);
      toast.success('질의어가 수정되었습니다');
    } else {
      addQuery(queryData as Omit<QueryItem, 'id' | 'createdAt' | 'updatedAt'>);
      toast.success('질의어가 추가되었습니다');
    }
    setEditingQuery(null);
  };

  const handleDeleteQuery = (id: string) => {
    deleteQuery(id);
    toast.success('질의어가 삭제되었습니다');
  };

  const handleExport = (format: 'json' | 'csv', all?: boolean) => {
    exportQueries(all ? undefined : selectedCategoryId, format);
    toast.success(`${all ? '전체 카테고리' : '현재 카테고리'} ${format.toUpperCase()} 파일로 내보내기 완료`);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onAddCategory={() => setCategoryModalOpen(true)}
          queryCounts={queryCounts}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <MainToolbar
            category={selectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAutoGenerate={handleAutoGenerate}
            onAddQuery={() => {
              setEditingQuery(null);
              setQueryModalOpen(true);
            }}
            onExport={handleExport}
            onImportCSV={(content) => {
              const result = importQueriesFromCSV(content);
              if (result.errors.length > 0) {
                toast.warning(`${result.imported.length}개 가져옴, ${result.errors.length}개 오류`);
              } else {
                toast.success(`${result.imported.length}개의 질의어를 가져왔습니다.`);
              }
            }}
            onOpenAISettings={() => setAiSettingsModalOpen(true)}
            aiProvider={aiSettings.provider}
            isGenerating={isGenerating}
          />

          <ScrollArea className="flex-1">
            <div className="p-6">
              {filteredQueries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredQueries.map(query => (
                    <QueryCard
                      key={query.id}
                      query={query}
                      onEdit={handleEditQuery}
                      onDelete={handleDeleteQuery}
                      onGenerateAnswer={handleGenerateAnswer}
                      onUpdateAnswer={(id, answer) => updateQuery(id, { answer })}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">질의어가 없습니다</p>
                  <p className="text-sm mt-1">
                    '자동 생성' 또는 '추가' 버튼을 클릭하여 질의어를 추가하세요
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>

      <QueryEditorModal
        open={queryModalOpen}
        onClose={() => {
          setQueryModalOpen(false);
          setEditingQuery(null);
        }}
        onSave={handleSaveQuery}
        query={editingQuery}
        categoryId={selectedCategoryId}
      />

      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSave={(cat) => {
          addCategory(cat);
          toast.success('카테고리가 추가되었습니다');
        }}
      />

      <AISettingsModal
        open={aiSettingsModalOpen}
        onOpenChange={setAiSettingsModalOpen}
        settings={aiSettings}
        onSave={(settings) => {
          setAiSettings(settings);
          toast.success('AI 설정이 저장되었습니다');
        }}
      />
    </div>
  );
};

export default Index;
