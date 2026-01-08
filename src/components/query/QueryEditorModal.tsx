import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { QueryItem } from '@/lib/types';

interface QueryEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (query: Partial<QueryItem>) => void;
  query?: QueryItem | null;
  categoryId: string;
}

export function QueryEditorModal({ open, onClose, onSave, query, categoryId }: QueryEditorModalProps) {
  const [text, setText] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (query) {
      setText(query.text);
      setTagsInput(query.tags.join(', '));
    } else {
      setText('');
      setTagsInput('');
    }
  }, [query, open]);

  const handleSave = () => {
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    onSave({
      text,
      tags,
      categoryId,
      source: query?.source || 'manual',
      status: 'active',
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{query ? '질의어 편집' : '새 질의어 추가'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="query-text">질의어 텍스트</Label>
            <Input
              id="query-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="예: 오늘 강수 확률은?"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="query-tags">태그 (쉼표로 구분)</Label>
            <Input
              id="query-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="예: 강수, 날씨, 기상"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!text.trim()}>
            {query ? '저장' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
