import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Bot, Sparkles, Key, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export type AIProvider = 'gemini' | 'chatgpt';

export interface AISettings {
  provider: AIProvider;
  generateCount: number;
  useCustomKey: boolean;
  openaiApiKey: string;
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
    requiresKey: false,
  },
  {
    id: 'chatgpt' as AIProvider,
    name: 'ChatGPT',
    description: 'gpt-4o-mini - OpenAI의 강력한 모델',
    icon: Bot,
    requiresKey: true,
  },
];

export function AISettingsModal({ open, onOpenChange, settings, onSave }: AISettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AISettings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    onOpenChange(false);
  };

  const selectedProvider = AI_PROVIDERS.find(p => p.id === localSettings.provider);
  const needsApiKey = localSettings.provider === 'chatgpt' && localSettings.useCustomKey;

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
                      {provider.requiresKey && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">API 키 필요</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {provider.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {localSettings.provider === 'chatgpt' && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">직접 API 키 사용</Label>
                </div>
                <Switch
                  checked={localSettings.useCustomKey}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, useCustomKey: checked }))}
                />
              </div>
              
              {localSettings.useCustomKey && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">OpenAI API 키</Label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={localSettings.openaiApiKey}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    API 키는 브라우저에 로컬 저장됩니다.
                  </p>
                </div>
              )}
              
              {!localSettings.useCustomKey && (
                <p className="text-xs text-muted-foreground">
                  기본 Lovable AI 게이트웨이를 통해 ChatGPT를 사용합니다.
                </p>
              )}
            </div>
          )}

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
          <Button 
            onClick={handleSave}
            disabled={needsApiKey && !localSettings.openaiApiKey}
          >
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
