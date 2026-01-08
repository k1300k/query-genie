import { useState, useMemo } from 'react';
import { AppHeader } from '@/components/query/AppHeader';
import { CategorySidebar } from '@/components/query/CategorySidebar';
import { MainToolbar } from '@/components/query/MainToolbar';
import { QueryCard } from '@/components/query/QueryCard';
import { QueryEditorModal } from '@/components/query/QueryEditorModal';
import { CategoryModal } from '@/components/query/CategoryModal';
import { useQueryStore } from '@/hooks/useQueryStore';
import { QueryItem } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

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
  } = useQueryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingQuery, setEditingQuery] = useState<QueryItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
    setIsGenerating(true);
    // Mock generation - will be replaced with actual AI call when Cloud is enabled
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockGenerated = [
      { categoryId: selectedCategoryId, text: `${selectedCategory?.name} 관련 새로운 질의어 1`, tags: [selectedCategory?.name || '', 'AI생성'], source: 'generated' as const, status: 'active' as const },
      { categoryId: selectedCategoryId, text: `${selectedCategory?.name} 데이터 조회 요청`, tags: [selectedCategory?.name || '', '조회'], source: 'generated' as const, status: 'active' as const },
      { categoryId: selectedCategoryId, text: `현재 ${selectedCategory?.name} 상태 알려줘`, tags: [selectedCategory?.name || '', '상태'], source: 'generated' as const, status: 'active' as const },
    ];
    
    addQueries(mockGenerated);
    setIsGenerating(false);
    toast.success(`${mockGenerated.length}개의 질의어가 생성되었습니다`);
  };

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

  const handleExport = (format: 'json' | 'csv') => {
    exportQueries(selectedCategoryId, format);
    toast.success(`${format.toUpperCase()} 파일로 내보내기 완료`);
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
    </div>
  );
};

export default Index;
