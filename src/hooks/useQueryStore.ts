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
      const headers = ['id', 'categoryId', 'text', 'tags', 'source', 'status', 'answer', 'sourceUrl', 'aiEngine', 'createdAt', 'updatedAt'];
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

  // Security: Maximum limits for CSV import
  const MAX_CSV_SIZE = 1024 * 1024; // 1MB
  const MAX_ROWS = 1000;
  const MAX_TEXT_LENGTH = 5000;
  const MAX_TAG_LENGTH = 100;
  const MAX_TAGS_COUNT = 20;

  // Security: Sanitize text to prevent CSV injection
  const sanitizeForCSV = (value: string): string => {
    if (!value) return '';
    const trimmed = value.trim();
    // Remove dangerous characters that could trigger formula execution in spreadsheets
    if (/^[=+\-@\t\r]/.test(trimmed)) {
      return "'" + trimmed; // Prefix with single quote to neutralize
    }
    return trimmed;
  };

  // Security: Validate enum values
  const isValidSource = (value: string): value is 'generated' | 'manual' => {
    return value === 'generated' || value === 'manual';
  };

  const isValidStatus = (value: string): value is 'active' | 'archived' => {
    return value === 'active' || value === 'archived';
  };

  const importQueriesFromCSV = useCallback((csvContent: string): { imported: QueryItem[]; errors: string[] } => {
    const errors: string[] = [];

    // Security: Check file size
    if (csvContent.length > MAX_CSV_SIZE) {
      errors.push(`파일 크기가 너무 큽니다. 최대 ${MAX_CSV_SIZE / 1024}KB까지 허용됩니다.`);
      return { imported: [], errors };
    }

    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      errors.push('CSV 파일에 데이터가 없습니다.');
      return { imported: [], errors };
    }

    // Security: Check row count
    if (lines.length - 1 > MAX_ROWS) {
      errors.push(`행 수가 너무 많습니다. 최대 ${MAX_ROWS}개까지 허용됩니다.`);
      return { imported: [], errors };
    }

    const headers = lines[0].split(',');
    const imported: QueryItem[] = [];
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
        const tagsIndex = headers.indexOf('tags');
        const categoryIdIndex = headers.indexOf('categoryId');
        const sourceIndex = headers.indexOf('source');
        const statusIndex = headers.indexOf('status');
        const answerIndex = headers.indexOf('answer');
        const sourceUrlIndex = headers.indexOf('sourceUrl');
        const aiEngineIndex = headers.indexOf('aiEngine');

        let text = textIndex >= 0 ? values[textIndex]?.replace(/""/g, '"') : values[2]?.replace(/""/g, '"');
        const tagsRaw = tagsIndex >= 0 ? values[tagsIndex] : values[3];
        const categoryId = categoryIdIndex >= 0 ? values[categoryIdIndex] : values[1];
        let answerRaw = answerIndex >= 0 ? values[answerIndex]?.replace(/""/g, '"').replace(/\\n/g, '\n') : undefined;
        const sourceRaw = sourceIndex >= 0 ? values[sourceIndex] : 'manual';
        const statusRaw = statusIndex >= 0 ? values[statusIndex] : 'active';
        let sourceUrlRaw = sourceUrlIndex >= 0 ? values[sourceUrlIndex]?.replace(/""/g, '"') : undefined;
        const aiEngineRaw = aiEngineIndex >= 0 ? values[aiEngineIndex] : undefined;

        // Security: Sanitize text fields
        text = sanitizeForCSV(text || '');
        answerRaw = answerRaw ? sanitizeForCSV(answerRaw) : undefined;
        sourceUrlRaw = sourceUrlRaw ? sanitizeForCSV(sourceUrlRaw) : undefined;

        // Security: Validate text length
        if (text.length > MAX_TEXT_LENGTH) {
          errors.push(`행 ${i + 1}: 텍스트가 너무 깁니다.`);
          continue;
        }

        // Security: Validate categoryId exists
        if (!categoryId || !categoryIds.has(categoryId)) {
          errors.push(`행 ${i + 1}: 유효하지 않은 카테고리 ID입니다.`);
          continue;
        }

        // Security: Validate source and status enum values
        const source = isValidSource(sourceRaw) ? sourceRaw : 'manual';
        const status = isValidStatus(statusRaw) ? statusRaw : 'active';

        // Security: Validate and sanitize tags
        const tags = tagsRaw 
          ? tagsRaw.split(';')
              .filter(Boolean)
              .slice(0, MAX_TAGS_COUNT)
              .map(tag => sanitizeForCSV(tag).slice(0, MAX_TAG_LENGTH))
          : [];

        if (text && categoryId) {
          imported.push({
            id: crypto.randomUUID(),
            categoryId,
            text,
            tags,
            source,
            status,
            answer: answerRaw || undefined,
            sourceUrl: sourceUrlRaw || undefined,
            aiEngine: aiEngineRaw || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    setQueries(prev => [...prev, ...imported]);
    return { imported, errors };
  }, [categories]);

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
