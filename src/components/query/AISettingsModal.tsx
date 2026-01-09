import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Bot, Sparkles } from 'lucide-react';

export type AIProvider = 'gemini' | 'chatgpt';

export interface AISettings {
  provider: AIProvider;
  generateCount: number;
}

interface AISettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AISettings;
  onSave: (settings: AISettings) => void;
}

const AI_PROVIDERS = [
  {
    id: 'gemini' as AIProvider,
    name: 'Google Gemini',
    description: 'google/gemini-2.5-flash - 빠르고 효율적인 응답',
    icon: Sparkles,
  },
  {
    id: 'chatgpt' as AIProvider,
    name: 'ChatGPT',
    description: 'openai/gpt-5-mini - 정교한 추론 능력',
    icon: Bot,
  },
];

export function AISettingsModal({ open, onOpenChange, settings, onSave }: AISettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AISettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI 설정
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">AI 모델 선택</Label>
            <RadioGroup
              value={localSettings.provider}
              onValueChange={(value) => setLocalSettings(prev => ({ ...prev, provider: value as AIProvider }))}
              className="space-y-3"
            >
              {AI_PROVIDERS.map((provider) => (
                <div
                  key={provider.id}
                  className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    localSettings.provider === provider.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setLocalSettings(prev => ({ ...prev, provider: provider.id }))}
                >
                  <RadioGroupItem value={provider.id} id={provider.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <provider.icon className="h-4 w-4 text-primary" />
                      <Label htmlFor={provider.id} className="font-medium cursor-pointer">
                        {provider.name}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {provider.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">생성 개수</Label>
              <span className="text-sm text-muted-foreground">{localSettings.generateCount}개</span>
            </div>
            <Slider
              value={[localSettings.generateCount]}
              onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, generateCount: value }))}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1개</span>
              <span>20개</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
