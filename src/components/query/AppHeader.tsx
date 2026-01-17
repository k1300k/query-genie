import { Bot, Bell, LogOut, Menu, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AppHeaderProps {
  onMenuClick?: () => void;
  onStatsClick?: () => void;
  isMobile?: boolean;
}

export function AppHeader({ onMenuClick, onStatsClick, isMobile }: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('로그아웃 중 오류가 발생했습니다');
    } else {
      toast.success('로그아웃 되었습니다');
      navigate('/auth');
    }
  };

  const getInitials = () => {
    if (!user?.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="h-14 border-b border-border bg-card px-3 md:px-4 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Menu Button */}
        {isMobile && onMenuClick && (
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
          <Bot className="h-5 w-5" />
        </div>
        <h1 className="text-base md:text-lg font-semibold text-foreground truncate">
          {isMobile ? 'AI Agent' : 'AI Agent 질의어 관리'}
        </h1>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {/* Mobile Stats Button */}
        {isMobile && onStatsClick && (
          <Button variant="ghost" size="icon" onClick={onStatsClick}>
            <BarChart3 className="h-5 w-5" />
          </Button>
        )}

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1 md:gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-secondary">{getInitials()}</AvatarFallback>
                </Avatar>
                {!isMobile && (
                  <span className="text-sm font-medium max-w-32 truncate">{user.email}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
            로그인
          </Button>
        )}
      </div>
    </header>
  );
}