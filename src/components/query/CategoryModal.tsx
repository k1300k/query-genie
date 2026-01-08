import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category } from '@/lib/types';

const ICON_OPTIONS = [
  { value: 'Cloud', label: '🌤️ 구름' },
  { value: 'Car', label: '🚗 자동차' },
  { value: 'Users', label: '👥 사용자' },
  { value: 'AlertTriangle', label: '⚠️ 경고' },
  { value: 'ShieldAlert', label: '🛡️ 안전' },
  { value: 'Map', label: '🗺️ 지도' },
  { value: 'Navigation', label: '🧭 네비게이션' },
  { value: 'Layers', label: '📚 레이어' },
];

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void;
  category?: Category | null;
}

export function CategoryModal({ open, onClose, onSave, category }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Layers');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description);
      setIcon(category.icon);
    } else {
      setName('');
      setDescription('');
      setIcon('Layers');
    }
  }, [category, open]);

  const handleSave = () => {
    onSave({ name, description, icon });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{category ? '카테고리 편집' : '새 카테고리 추가'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">카테고리 이름</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 실시간 알림"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cat-desc">설명</Label>
            <Input
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 실시간 알림 관련 질의어"
            />
          </div>

          <div className="space-y-2">
            <Label>아이콘</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {category ? '저장' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
