import { Plus, Cloud, Car, Users, AlertTriangle, ShieldAlert, Map, Navigation, Layers, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ReactNode> = {
  Cloud: <Cloud className="h-4 w-4" />,
  Car: <Car className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  AlertTriangle: <AlertTriangle className="h-4 w-4" />,
  ShieldAlert: <ShieldAlert className="h-4 w-4" />,
  Map: <Map className="h-4 w-4" />,
  Navigation: <Navigation className="h-4 w-4" />,
  Layers: <Layers className="h-4 w-4" />,
};

interface CategorySidebarProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onAddCategory: () => void;
  queryCounts: Record<string, number>;
}

export function CategorySidebar({ 
  categories, 
  selectedCategoryId, 
  onSelectCategory, 
  onAddCategory,
  queryCounts 
}: CategorySidebarProps) {
  return (
    <aside className="w-[280px] border-r border-border bg-sidebar flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-sidebar-foreground">카테고리</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left group",
                selectedCategoryId === category.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <span className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md",
                selectedCategoryId === category.id 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "bg-sidebar-accent text-sidebar-foreground"
              )}>
                {iconMap[category.icon] || <Layers className="h-4 w-4" />}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-medium block truncate">{category.name}</span>
                <span className="text-xs text-muted-foreground">{queryCounts[category.id] || 0}개 질의어</span>
              </div>
              <ChevronRight className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                selectedCategoryId === category.id && "transform rotate-90"
              )} />
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={onAddCategory}
        >
          <Plus className="h-4 w-4" />
          항목 추가
        </Button>
      </div>
    </aside>
  );
}
