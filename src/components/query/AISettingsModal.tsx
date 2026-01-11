import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Sparkles, Key, Eye, EyeOff, Info, Bot } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type AIProvider = 'gemini' | 'openai' | 'lovable';

export interface AISettings {
  provider: AIProvider;
  generateCount: number;
  geminiApiKey?: string;
  geminiModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
}

interface AISettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AISettings;
  onSave: (settings: AISettings) => void;
}

const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: '빠르고 효율적인 모델' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: '더 정확하고 강력한 모델' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '이전 버전 Flash 모델' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '안정적인 Pro 모델' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: '안정적인 Flash 모델' },
];

const OPENAI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '빠르고 저렴한 모델' },
  { id: 'gpt-4o', name: 'GPT-4o', description: '강력한 멀티모달 모델' },
  { id: 'gpt-4.1-2025-04-14', name: 'GPT-4.1', description: '최신 GPT-4 플래그십 모델' },
  { id: 'gpt-4.1-mini-2025-04-14', name: 'GPT-4.1 Mini', description: '빠른 GPT-4.1 모델' },
  { id: 'gpt-5-2025-08-07', name: 'GPT-5', description: '최신 플래그십 모델' },
  { id: 'gpt-5-mini-2025-08-07', name: 'GPT-5 Mini', description: '빠르고 효율적인 GPT-5' },
];

const AI_PROVIDERS = [
  {
    id: 'lovable' as AIProvider,
    name: 'Lovable AI',
    description: 'API 키 불필요, 기본 제공 AI 서비스',
    icon: Sparkles,
  },
  {
    id: 'gemini' as AIProvider,
    name: 'Google Gemini',
    description: '직접 Gemini API 키를 사용하여 연결',
    icon: Key,
  },
  {
    id: 'openai' as AIProvider,
    name: 'OpenAI ChatGPT',
    description: '직접 OpenAI API 키를 사용하여 연결',
    icon: Bot,
  },
];

// Load settings from localStorage
const loadSettingsFromStorage = (): Partial<AISettings> => {
  try {
    const stored = localStorage.getItem('ai-settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load AI settings from localStorage');
  }
  return {};
};

// Save settings to localStorage
const saveSettingsToStorage = (settings: AISettings) => {
  try {
    localStorage.setItem('ai-settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save AI settings to localStorage');
  }
};

export function AISettingsModal({ open, onOpenChange, settings, onSave }: AISettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AISettings>(settings);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  useEffect(() => {
    // Merge stored settings with passed settings
    const stored = loadSettingsFromStorage();
    setLocalSettings({
      ...settings,
      ...stored,
    });
  }, [settings, open]);

  const handleSave = () => {
    saveSettingsToStorage(localSettings);
    onSave(localSettings);
    onOpenChange(false);
  };

  const isGeminiSelected = localSettings.provider === 'gemini';
  const isOpenaiSelected = localSettings.provider === 'openai';
  const hasValidGeminiKey = localSettings.geminiApiKey && localSettings.geminiApiKey.length > 0;
  const hasValidOpenaiKey = localSettings.openaiApiKey && localSettings.openaiApiKey.length > 0;

  const canSave = 
    localSettings.provider === 'lovable' ||
    (isGeminiSelected && hasValidGeminiKey) ||
    (isOpenaiSelected && hasValidOpenaiKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI 설정
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Provider Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">AI 서비스 선택</Label>
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

          {/* Gemini Settings */}
          {isGeminiSelected && (
            <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="gemini-api-key" className="text-sm font-medium">
                    Gemini API 키
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Google AI Studio에서 API 키를 발급받을 수 있습니다.</p>
                        <a 
                          href="https://aistudio.google.com/apikey" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          API 키 발급받기 →
                        </a>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    id="gemini-api-key"
                    type={showGeminiKey ? "text" : "password"}
                    value={localSettings.geminiApiKey || ''}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                    placeholder="AIza..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gemini-model" className="text-sm font-medium">
                  Gemini 모델
                </Label>
                <Select
                  value={localSettings.geminiModel || 'gemini-2.5-flash'}
                  onValueChange={(value) => setLocalSettings(prev => ({ ...prev, geminiModel: value }))}
                >
                  <SelectTrigger id="gemini-model">
                    <SelectValue placeholder="모델 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {GEMINI_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!hasValidGeminiKey && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Gemini API 키를 입력해주세요
                </p>
              )}
            </div>
          )}

          {/* OpenAI Settings */}
          {isOpenaiSelected && (
            <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="openai-api-key" className="text-sm font-medium">
                    OpenAI API 키
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>OpenAI Platform에서 API 키를 발급받을 수 있습니다.</p>
                        <a 
                          href="https://platform.openai.com/api-keys" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          API 키 발급받기 →
                        </a>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    id="openai-api-key"
                    type={showOpenaiKey ? "text" : "password"}
                    value={localSettings.openaiApiKey || ''}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                    placeholder="sk-..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-model" className="text-sm font-medium">
                  OpenAI 모델
                </Label>
                <Select
                  value={localSettings.openaiModel || 'gpt-4o-mini'}
                  onValueChange={(value) => setLocalSettings(prev => ({ ...prev, openaiModel: value }))}
                >
                  <SelectTrigger id="openai-model">
                    <SelectValue placeholder="모델 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPENAI_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!hasValidOpenaiKey && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ OpenAI API 키를 입력해주세요
                </p>
              )}
            </div>
          )}

          {/* Generate Count */}
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
            disabled={!canSave}
          >
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
