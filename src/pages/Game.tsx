import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Gamepad2, 
  Coins, 
  Zap, 
  Target, 
  TrendingUp,
  Trophy,
  Star,
  Gift
} from 'lucide-react';

interface Account {
  id: string;
  balance: number;
}

interface GameStats {
  totalClicks: number;
  totalEarned: number;
  multiplier: number;
  energy: number;
  maxEnergy: number;
}

export default function Game() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState<Account | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalClicks: 0,
    totalEarned: 0,
    multiplier: 1,
    energy: 100,
    maxEnergy: 100
  });
  const [isClicking, setIsClicking] = useState(false);
  const [dailyBonus, setDailyBonus] = useState(false);
  const [coinAnimation, setCoinAnimation] = useState(false);

  useEffect(() => {
    if (user) {
      loadAccount();
      loadGameStats();
      const energyInterval = setInterval(restoreEnergy, 5000); // Восстанавливаем энергию каждые 5 секунд
      return () => clearInterval(energyInterval);
    }
  }, [user]);

  const loadAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setAccount(data);
    } catch (error: any) {
      toast({
        title: 'Ошибка загрузки счёта',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadGameStats = () => {
    const saved = localStorage.getItem(`gameStats_${user?.id}`);
    if (saved) {
      setGameStats(JSON.parse(saved));
    }
    
    // Проверяем ежедневный бонус
    const lastBonus = localStorage.getItem(`lastBonus_${user?.id}`);
    const today = new Date().toDateString();
    if (lastBonus !== today) {
      setDailyBonus(true);
    }
  };

  const saveGameStats = (stats: GameStats) => {
    localStorage.setItem(`gameStats_${user?.id}`, JSON.stringify(stats));
    setGameStats(stats);
  };

  const restoreEnergy = () => {
    setGameStats(prev => {
      const newStats = {
        ...prev,
        energy: Math.min(prev.energy + 2, prev.maxEnergy)
      };
      localStorage.setItem(`gameStats_${user?.id}`, JSON.stringify(newStats));
      return newStats;
    });
  };

  const handleCoinClick = async () => {
    if (gameStats.energy <= 0) {
      toast({
        title: 'Недостаточно энергии!',
        description: 'Подожди немного, энергия восстановится',
        variant: 'destructive',
      });
      return;
    }

    setIsClicking(true);
    setCoinAnimation(true);
    
    const earnedCoins = gameStats.multiplier;
    
    // Обновляем статистику игры
    const newStats = {
      ...gameStats,
      totalClicks: gameStats.totalClicks + 1,
      totalEarned: gameStats.totalEarned + earnedCoins,
      energy: gameStats.energy - 1
    };
    saveGameStats(newStats);

    // Добавляем монеты на счёт
    try {
      if (account) {
        const { error } = await supabase
          .from('accounts')
          .update({ balance: account.balance + earnedCoins })
          .eq('user_id', user?.id);

        if (error) throw error;
        
        setAccount({ ...account, balance: account.balance + earnedCoins });
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    }

    setTimeout(() => {
      setIsClicking(false);
      setCoinAnimation(false);
    }, 200);
  };

  const claimDailyBonus = async () => {
    const bonusAmount = 50;
    
    try {
      if (account) {
        const { error } = await supabase
          .from('accounts')
          .update({ balance: account.balance + bonusAmount })
          .eq('user_id', user?.id);

        if (error) throw error;
        
        setAccount({ ...account, balance: account.balance + bonusAmount });
        setDailyBonus(false);
        
        localStorage.setItem(`lastBonus_${user?.id}`, new Date().toDateString());
        
        toast({
          title: 'Ежедневный бонус получен!',
          description: `+${bonusAmount} монет добавлено на счёт`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const buyUpgrade = (type: 'multiplier' | 'energy') => {
    const costs = {
      multiplier: gameStats.multiplier * 100,
      energy: (gameStats.maxEnergy - 100) * 10 + 200
    };

    const cost = costs[type];
    
    if (!account || account.balance < cost) {
      toast({
        title: 'Недостаточно монет!',
        description: `Нужно ${cost} монет для улучшения`,
        variant: 'destructive',
      });
      return;
    }

    // Покупаем улучшение
    const newStats = { ...gameStats };
    if (type === 'multiplier') {
      newStats.multiplier += 1;
    } else {
      newStats.maxEnergy += 20;
      newStats.energy = newStats.maxEnergy;
    }
    
    saveGameStats(newStats);
    
    // Списываем монеты
    supabase
      .from('accounts')
      .update({ balance: account.balance - cost })
      .eq('user_id', user?.id)
      .then(() => {
        setAccount({ ...account, balance: account.balance - cost });
        toast({
          title: 'Улучшение куплено!',
          description: type === 'multiplier' ? 'Множитель увеличен!' : 'Энергия увеличена!',
        });
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
            Игра Кликер
          </h1>
          <p className="text-muted-foreground">Зарабатывай монеты кликами!</p>
        </div>

        {/* Ежедневный бонус */}
        {dailyBonus && (
          <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <CardContent className="p-6 text-center">
              <Gift className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Ежедневный бонус!</h3>
              <p className="text-muted-foreground mb-4">Получи 50 монет бесплатно</p>
              <Button onClick={claimDailyBonus} className="bg-gradient-to-r from-yellow-500 to-orange-500">
                <Gift className="h-4 w-4 mr-2" />
                Получить бонус
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Баланс</p>
              <p className="text-xl font-bold">{account?.balance || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Кликов</p>
              <p className="text-xl font-bold">{gameStats.totalClicks}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Заработано</p>
              <p className="text-xl font-bold">{gameStats.totalEarned}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Множитель</p>
              <p className="text-xl font-bold">x{gameStats.multiplier}</p>
            </CardContent>
          </Card>
        </div>

        {/* Игровая зона */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Кликер */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Кликай по монетке!</CardTitle>
              <CardDescription className="text-center">
                +{gameStats.multiplier} монет за клик
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {/* Энергия */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Энергия: {gameStats.energy}/{gameStats.maxEnergy}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(gameStats.energy / gameStats.maxEnergy) * 100}%` }}
                  />
                </div>
              </div>

              {/* Большая монетка */}
              <div className="relative">
                <Button
                  onClick={handleCoinClick}
                  disabled={gameStats.energy <= 0}
                  className={`
                    w-32 h-32 rounded-full text-4xl bg-gradient-to-br from-yellow-400 to-yellow-600 
                    hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200
                    ${isClicking ? 'scale-110' : 'scale-100'}
                    ${coinAnimation ? 'animate-pulse' : ''}
                  `}
                >
                  <Coins className="h-16 w-16" />
                </Button>
                
                {/* Анимация заработанных монет */}
                {coinAnimation && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 animate-fade-in">
                    <Badge className="bg-yellow-500 text-white">
                      +{gameStats.multiplier}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Улучшения */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Улучшения
              </CardTitle>
              <CardDescription>
                Покупай улучшения, чтобы зарабатывать больше!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Улучшение множителя */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Множитель кликов</h4>
                    <p className="text-sm text-muted-foreground">
                      Текущий: x{gameStats.multiplier}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {gameStats.multiplier * 100} монет
                  </Badge>
                </div>
                <Button 
                  onClick={() => buyUpgrade('multiplier')}
                  disabled={!account || account.balance < gameStats.multiplier * 100}
                  className="w-full"
                  variant="outline"
                >
                  Купить улучшение
                </Button>
              </div>

              {/* Улучшение энергии */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Больше энергии</h4>
                    <p className="text-sm text-muted-foreground">
                      Текущая: {gameStats.maxEnergy}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {(gameStats.maxEnergy - 100) * 10 + 200} монет
                  </Badge>
                </div>
                <Button 
                  onClick={() => buyUpgrade('energy')}
                  disabled={!account || account.balance < (gameStats.maxEnergy - 100) * 10 + 200}
                  className="w-full"
                  variant="outline"
                >
                  Купить улучшение
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}