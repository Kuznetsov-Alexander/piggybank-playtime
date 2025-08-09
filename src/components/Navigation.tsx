import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  Target, 
  TrendingUp, 
  Trophy, 
  User, 
  PiggyBank,
  Menu,
  X,
  Send,
  Gamepad2,
  Bell,
  Star,
  Coins,
  BookOpen,
  ShieldAlert
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { path: '/', icon: Home, label: 'Главная', badge: null },
  { path: '/goals', icon: Target, label: 'Цели', badge: null },
  { path: '/transfers', icon: Send, label: 'Переводы', badge: null },
  { path: '/transactions', icon: TrendingUp, label: 'Транзакции', badge: null },
  { path: '/game', icon: Gamepad2, label: 'Игра', badge: null },
  { path: '/budget', icon: BookOpen, label: 'Бюджет‑челлендж', badge: 'NEW' },
  { path: '/detective', icon: ShieldAlert, label: 'Детектив‑мошенник', badge: 'NEW' },
  { path: '/achievements', icon: Trophy, label: 'Достижения', badge: null },
  { path: '/profile', icon: User, label: 'Профиль', badge: null },
];

export default function Navigation() {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [notifications, setNotifications] = useState(3);

  useEffect(() => {
    let isMounted = true;
    const loadBalance = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted) return;
      if (error) {
        console.error('Failed to load balance', error);
        return;
      }
      if (data?.balance != null) setBalance(Number(data.balance));
    };

    loadBalance();
    return () => { isMounted = false; };
  }, [user]);

  if (!user) return null;

  return (
    <>
      {/* Mobile Navigation Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-background/80 backdrop-blur"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <nav className={`
        fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-auto flex flex-col
      `}>
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center animate-pulse">
              <PiggyBank className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              КидБанк
            </h1>
          </div>

          {/* User Balance Card */}
          <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Мой баланс</p>
              <div className="flex items-center gap-1">
                <Coins className="h-3 w-3 text-primary" />
                <Bell className="h-3 w-3 text-muted-foreground" />
                {notifications > 0 && (
                  <Badge variant="destructive" className="h-4 w-4 p-0 text-xs flex items-center justify-center">
                    {notifications}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-lg font-bold text-primary">₽{balance.toLocaleString()}</p>
          </div>

          {/* Navigation Items */}
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    group flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 hover-scale
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant={isActive ? "secondary" : "default"} className="h-5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Уровень</span>
              </div>
              <Badge variant="outline">5</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Достижения</span>
              </div>
              <Badge variant="outline">12/20</Badge>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="p-6 border-t border-border">
          <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20 animate-pulse">
            <p className="text-sm text-muted-foreground text-center">
              Копи, мечтай, достигай! 🌟
            </p>
          </div>
        </div>
      </nav>

    </>
  );
}