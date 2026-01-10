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
      const headers = ['id', 'categoryId', 'text', 'tags', 'source', 'status', 'answer', 'createdAt', 'updatedAt'];
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

  const importQueriesFromCSV = useCallback((csvContent: string) => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const imported: QueryItem[] = [];

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
        const tagsIndex = headers.indexOf('tags');
        const categoryIdIndex = headers.indexOf('categoryId');
        const sourceIndex = headers.indexOf('source');
        const statusIndex = headers.indexOf('status');
        const answerIndex = headers.indexOf('answer');

        const text = textIndex >= 0 ? values[textIndex]?.replace(/""/g, '"') : values[2]?.replace(/""/g, '"');
        const tagsRaw = tagsIndex >= 0 ? values[tagsIndex] : values[3];
        const categoryId = categoryIdIndex >= 0 ? values[categoryIdIndex] : values[1];
        const answerRaw = answerIndex >= 0 ? values[answerIndex]?.replace(/""/g, '"').replace(/\\n/g, '\n') : undefined;

        if (text && categoryId) {
          imported.push({
            id: crypto.randomUUID(),
            categoryId,
            text,
            tags: tagsRaw ? tagsRaw.split(';').filter(Boolean) : [],
            source: (sourceIndex >= 0 ? values[sourceIndex] : 'manual') as 'generated' | 'manual',
            status: (statusIndex >= 0 ? values[statusIndex] : 'active') as 'active' | 'archived',
            answer: answerRaw || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    setQueries(prev => [...prev, ...imported]);
    return imported;
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
    importQueriesFromCSV,
  };
}
