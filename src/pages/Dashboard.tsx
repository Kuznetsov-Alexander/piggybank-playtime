import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  PiggyBank, 
  Target, 
  Trophy, 
  TrendingUp, 
  Plus,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Account {
  id: string;
  balance: number;
  account_number: string;
}

interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  image_url?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState<Account | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load account data
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (accountError && accountError.code !== 'PGRST116') {
        throw accountError;
      }
      setAccount(accountData);

      // Load savings goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (goalsError) throw goalsError;
      setGoals(goalsData || []);

      // Load recent achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user?.id)
        .order('earned_at', { ascending: false })
        .limit(3);

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

    } catch (error: any) {
      toast({
        title: 'Ошибка загрузки данных',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Привет! 👋</h1>
            <p className="text-muted-foreground">Добро пожаловать в КидБанк</p>
          </div>
          <div className="flex items-center gap-2">
            <PiggyBank className="h-8 w-8 text-primary" />
            <span className="text-lg font-semibold text-primary">КидБанк</span>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Мой счёт</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBalance(!showBalance)}
              className="text-white hover:bg-white/20"
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {showBalance ? `${account?.balance || 0} ₽` : '****'}
            </div>
            <p className="text-white/80 text-sm">
              Счёт: {account?.account_number || 'Не найден'}
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/goals">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-secondary/10 border-secondary/20">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Target className="h-8 w-8 text-secondary mb-2" />
                <span className="text-sm font-medium">Цели</span>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/transactions">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-primary/10 border-primary/20">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <span className="text-sm font-medium">Транзакции</span>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/achievements">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-accent/10 border-accent/20">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Trophy className="h-8 w-8 text-accent mb-2" />
                <span className="text-sm font-medium">Достижения</span>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/profile">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Sparkles className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Профиль</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Savings Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Мои цели</CardTitle>
              <CardDescription>Прогресс накоплений</CardDescription>
            </div>
            <Link to="/goals">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Новая цель
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((goal) => {
                  const progress = (goal.current_amount / goal.target_amount) * 100;
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{goal.title}</h4>
                        <span className="text-sm text-muted-foreground">
                          {goal.current_amount} / {goal.target_amount} ₽
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                У тебя пока нет целей. Создай свою первую цель!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Последние достижения</CardTitle>
            <CardDescription>Твои успехи</CardDescription>
          </CardHeader>
          <CardContent>
            {achievements.length > 0 ? (
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-4 p-3 bg-accent/10 rounded-lg">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    <div className="text-accent font-semibold">+{achievement.points}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Пока нет достижений. Начни копить и получай награды!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}