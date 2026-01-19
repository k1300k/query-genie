import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Category, QueryItem, TokenUsage, DEFAULT_CATEGORIES, SAMPLE_QUERIES } from '@/lib/types';
import { toast } from 'sonner';

// Database types
interface DbCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

interface DbQuery {
  id: string;
  user_id: string;
  category_id: string | null;
  query: string;
  answer: string | null;
  engine: string | null;
  answer_engine: string | null;
  query_length: number | null;
  answer_length: number | null;
  query_tokens: number | null;
  answer_tokens: number | null;
  created_at: string;
  updated_at: string;
}

// Convert DB category to app category
const dbToCategory = (db: DbCategory): Category => ({
  id: db.id,
  name: db.name,
  description: '',
  icon: 'Folder',
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

// Convert DB query to app query
const dbToQueryItem = (db: DbQuery): QueryItem => ({
  id: db.id,
  categoryId: db.category_id || '',
  text: db.query,
  tags: [],
  source: 'manual',
  status: 'active',
  answer: db.answer || undefined,
  aiEngine: db.engine || db.answer_engine || undefined,
  queryLength: db.query_length || undefined,
  answerLength: db.answer_length || undefined,
  queryTokens: db.query_tokens ? { totalTokens: db.query_tokens } : undefined,
  answerTokens: db.answer_tokens ? { totalTokens: db.answer_tokens } : undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export function useSupabaseStore(userId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load categories
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('created_at', { ascending: true });

        if (catError) throw catError;

        const loadedCategories = (catData || []).map(dbToCategory);
        
        // If no categories, create defaults
        if (loadedCategories.length === 0) {
          const defaultCats = await createDefaultCategories(userId);
          setCategories(defaultCats);
          if (defaultCats.length > 0) {
            setSelectedCategoryId(defaultCats[0].id);
          }
        } else {
          setCategories(loadedCategories);
          setSelectedCategoryId(loadedCategories[0].id);
        }

        // Load queries
        const { data: queryData, error: queryError } = await supabase
          .from('queries')
          .select('*')
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;

        setQueries((queryData || []).map(dbToQueryItem));
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('데이터를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Create default categories for new users
  const createDefaultCategories = async (uid: string): Promise<Category[]> => {
    const defaultCats = DEFAULT_CATEGORIES.map(cat => ({
      user_id: uid,
      name: cat.name,
      color: '#3B82F6',
    }));

    const { data, error } = await supabase
      .from('categories')
      .insert(defaultCats)
      .select();

    if (error) {
      console.error('Error creating default categories:', error);
      return [];
    }

    return (data || []).map(dbToCategory);
  };

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: category.name,
        color: '#3B82F6',
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding category:', error);
      toast.error('카테고리 추가에 실패했습니다');
      return null;
    }

    const newCategory = dbToCategory(data);
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, [userId]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const { error } = await supabase
      .from('categories')
      .update({
        name: updates.name,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating category:', error);
      toast.error('카테고리 수정에 실패했습니다');
      return;
    }

    setCategories(prev => prev.map(cat =>
      cat.id === id ? { ...cat, ...updates, updatedAt: new Date().toISOString() } : cat
    ));
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      toast.error('카테고리 삭제에 실패했습니다');
      return;
    }

    setCategories(prev => prev.filter(cat => cat.id !== id));
    setQueries(prev => prev.filter(q => q.categoryId !== id));
  }, []);

  const addQuery = useCallback(async (query: Omit<QueryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('queries')
      .insert({
        user_id: userId,
        category_id: query.categoryId,
        query: query.text,
        answer: query.answer || null,
        engine: query.aiEngine || null,
        query_length: query.queryLength || null,
        query_tokens: query.queryTokens?.totalTokens || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding query:', error);
      toast.error('질의어 추가에 실패했습니다');
      return null;
    }

    const newQuery = dbToQueryItem(data);
    setQueries(prev => [newQuery, ...prev]);
    return newQuery;
  }, [userId]);

  const addQueries = useCallback(async (newQueries: Omit<QueryItem, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    if (!userId || newQueries.length === 0) return [];

    const insertData = newQueries.map(q => ({
      user_id: userId,
      category_id: q.categoryId,
      query: q.text,
      answer: q.answer || null,
      engine: q.aiEngine || null,
      query_length: q.queryLength || null,
      query_tokens: q.queryTokens?.totalTokens || null,
    }));

    const { data, error } = await supabase
      .from('queries')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Error adding queries:', error);
      toast.error('질의어 추가에 실패했습니다');
      return [];
    }

    const addedQueries = (data || []).map(dbToQueryItem);
    setQueries(prev => [...addedQueries, ...prev]);
    return addedQueries;
  }, [userId]);

  const updateQuery = useCallback(async (id: string, updates: Partial<QueryItem>) => {
    const updateData: Record<string, any> = {};
    
    if (updates.text !== undefined) updateData.query = updates.text;
    if (updates.answer !== undefined) updateData.answer = updates.answer;
    if (updates.aiEngine !== undefined) updateData.answer_engine = updates.aiEngine;
    if (updates.queryLength !== undefined) updateData.query_length = updates.queryLength;
    if (updates.answerLength !== undefined) updateData.answer_length = updates.answerLength;
    if (updates.queryTokens !== undefined) updateData.query_tokens = updates.queryTokens?.totalTokens || null;
    if (updates.answerTokens !== undefined) updateData.answer_tokens = updates.answerTokens?.totalTokens || null;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;

    const { error } = await supabase
      .from('queries')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating query:', error);
      toast.error('질의어 수정에 실패했습니다');
      return;
    }

    setQueries(prev => prev.map(q =>
      q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
    ));
  }, []);

  const deleteQuery = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('queries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting query:', error);
      toast.error('질의어 삭제에 실패했습니다');
      return;
    }

    setQueries(prev => prev.filter(q => q.id !== id));
  }, []);

  const getQueriesByCategory = useCallback((categoryId: string) => {
    return queries.filter(q => q.categoryId === categoryId && q.status === 'active');
  }, [queries]);

  const exportQueries = useCallback((categoryId?: string, format: 'json' | 'csv' = 'json') => {
    const dataToExport = categoryId
      ? queries.filter(q => q.categoryId === categoryId)
      : queries;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `queries_${categoryId || 'all'}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['id', 'categoryId', 'text', 'tags', 'source', 'status', 'answer', 'sourceUrl', 'aiEngine', 'queryLength', 'answerLength', 'queryTokens', 'answerTokens', 'createdAt', 'updatedAt'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(q => [
          q.id,
          q.categoryId,
          `"${q.text.replace(/"/g, '""')}"`,
          `"${q.tags.join(';')}"`,
          q.source,
          q.status,
          `"${(q.answer || '').replace(/"/g, '""').replace(/\n/g, '\\n')}"`,
          `"${(q.sourceUrl || '').replace(/"/g, '""')}"`,
          q.aiEngine || '',
          q.queryLength || '',
          q.answerLength || '',
          q.queryTokens ? JSON.stringify(q.queryTokens) : '',
          q.answerTokens ? JSON.stringify(q.answerTokens) : '',
          q.createdAt,
          q.updatedAt
        ].join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `queries_${categoryId || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [queries]);

  const importQueriesFromCSV = useCallback(async (csvContent: string): Promise<{ imported: QueryItem[]; errors: string[] }> => {
    if (!userId) return { imported: [], errors: ['로그인이 필요합니다'] };

    const errors: string[] = [];
    const MAX_CSV_SIZE = 1024 * 1024;
    const MAX_ROWS = 1000;

    if (csvContent.length > MAX_CSV_SIZE) {
      errors.push(`파일 크기가 너무 큽니다. 최대 ${MAX_CSV_SIZE / 1024}KB까지 허용됩니다.`);
      return { imported: [], errors };
    }

    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      errors.push('CSV 파일에 데이터가 없습니다.');
      return { imported: [], errors };
    }

    if (lines.length - 1 > MAX_ROWS) {
      errors.push(`행 수가 너무 많습니다. 최대 ${MAX_ROWS}개까지 허용됩니다.`);
      return { imported: [], errors };
    }

    const headers = lines[0].split(',');
    const toImport: Omit<QueryItem, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const categoryIds = new Set(categories.map(c => c.id));

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length >= 4) {
        const textIndex = headers.indexOf('text');
        const categoryIdIndex = headers.indexOf('categoryId');
        const answerIndex = headers.indexOf('answer');
        const aiEngineIndex = headers.indexOf('aiEngine');

        const text = textIndex >= 0 ? values[textIndex]?.replace(/""/g, '"') : values[2]?.replace(/""/g, '"');
        const categoryId = categoryIdIndex >= 0 ? values[categoryIdIndex] : values[1];
        const answerRaw = answerIndex >= 0 ? values[answerIndex]?.replace(/""/g, '"').replace(/\\n/g, '\n') : undefined;
        const aiEngineRaw = aiEngineIndex >= 0 ? values[aiEngineIndex] : undefined;

        if (!categoryId || !categoryIds.has(categoryId)) {
          errors.push(`행 ${i + 1}: 유효하지 않은 카테고리 ID입니다.`);
          continue;
        }

        if (text && categoryId) {
          toImport.push({
            categoryId,
            text,
            tags: [],
            source: 'manual',
            status: 'active',
            answer: answerRaw || undefined,
            aiEngine: aiEngineRaw || undefined,
          });
        }
      }
    }

    if (toImport.length === 0) {
      return { imported: [], errors };
    }

    const imported = await addQueries(toImport);
    return { imported, errors };
  }, [userId, categories, addQueries]);

  return {
    categories,
    queries,
    selectedCategoryId,
    setSelectedCategoryId,
    addCategory,
    updateCategory,
    deleteCategory,
    addQuery,
    addQueries,
    updateQuery,
    deleteQuery,
    getQueriesByCategory,
    exportQueries,
    importQueriesFromCSV,
    isLoading,
  };
}
