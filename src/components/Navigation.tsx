import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
  Gamepad2
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/goals', icon: Target, label: 'Цели' },
  { path: '/transfers', icon: Send, label: 'Переводы' },
  { path: '/transactions', icon: TrendingUp, label: 'Транзакции' },
  { path: '/game', icon: Gamepad2, label: 'Игра' },
  { path: '/achievements', icon: Trophy, label: 'Достижения' },
  { path: '/profile', icon: User, label: 'Профиль' },
];

export default function Navigation() {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

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
        md:translate-x-0 md:static md:z-auto
      `}>
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <PiggyBank className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              КидБанк
            </h1>
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
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom section */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground text-center">
              Копи, мечтай, достигай! 🌟
            </p>
          </div>
        </div>
      </nav>

      {/* Main content spacer for desktop */}
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  );
}