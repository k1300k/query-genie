import { useState, useCallback } from 'react';
import { Category, QueryItem, DEFAULT_CATEGORIES, SAMPLE_QUERIES } from '@/lib/types';

export function useQueryStore() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [queries, setQueries] = useState<QueryItem[]>(SAMPLE_QUERIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('weather');

  const addCategory = useCallback((category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, ...updates, updatedAt: new Date().toISOString() } : cat
    ));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    setQueries(prev => prev.filter(q => q.categoryId !== id));
  }, []);

  const addQuery = useCallback((query: Omit<QueryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newQuery: QueryItem = {
      ...query,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setQueries(prev => [...prev, newQuery]);
    return newQuery;
  }, []);

  const addQueries = useCallback((newQueries: Omit<QueryItem, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const timestamp = new Date().toISOString();
    const queriesToAdd = newQueries.map(q => ({
      ...q,
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    setQueries(prev => [...prev, ...queriesToAdd]);
    return queriesToAdd;
  }, []);

  const updateQuery = useCallback((id: string, updates: Partial<QueryItem>) => {
    setQueries(prev => prev.map(q => 
      q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
    ));
  }, []);

  const deleteQuery = useCallback((id: string) => {
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
      const headers = ['id', 'categoryId', 'text', 'tags', 'source', 'status', 'createdAt', 'updatedAt'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(q => [
          q.id,
          q.categoryId,
          `"${q.text.replace(/"/g, '""')}"`,
          `"${q.tags.join(';')}"`,
          q.source,
          q.status,
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

  const importQueries = useCallback((data: QueryItem[]) => {
    setQueries(prev => [...prev, ...data]);
  }, []);

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
    importQueries,
  };
}
