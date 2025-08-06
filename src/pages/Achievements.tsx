import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Star, Calendar, Gift } from 'lucide-react';

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  earned_at: string;
}

interface AchievementCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  required_count: number;
  points: number;
  current_count: number;
  unlocked: boolean;
}

export default function Achievements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [categories, setCategories] = useState<AchievementCategory[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAchievements();
      loadProgress();
    }
  }, [user]);

  const loadAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user?.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      
      setAchievements(data || []);
      setTotalPoints(data?.reduce((sum, achievement) => sum + achievement.points, 0) || 0);
    } catch (error: any) {
      toast({
        title: 'Ошибка загрузки достижений',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadProgress = async () => {
    try {
      // Get user statistics for calculating progress
      const [goalsResult, transactionsResult] = await Promise.all([
        supabase
          .from('savings_goals')
          .select('*')
          .eq('user_id', user?.id),
        supabase
          .from('transactions')
          .select('*')
          .or(`from_user_id.eq.${user?.id},to_user_id.eq.${user?.id}`)
      ]);

      const goals = goalsResult.data || [];
      const transactions = transactionsResult.data || [];
      const completedGoals = goals.filter(g => g.is_completed).length;
      const goalDeposits = transactions.filter(t => t.type === 'goal_deposit').length;

      // Define achievement categories with progress
      const progressCategories: AchievementCategory[] = [
        {
          id: 'first_goal',
          title: 'Первая цель 🎯',
          description: 'Создай свою первую цель накоплений',
          icon: '🎯',
          required_count: 1,
          points: 50,
          current_count: goals.length,
          unlocked: goals.length >= 1
        },
        {
          id: 'goal_master',
          title: 'Мастер целей 🏆',
          description: 'Создай 5 целей накоплений',
          icon: '🏆',
          required_count: 5,
          points: 200,
          current_count: goals.length,
          unlocked: goals.length >= 5
        },
        {
          id: 'first_save',
          title: 'Первые накопления 💰',
          description: 'Пополни цель в первый раз',
          icon: '💰',
          required_count: 1,
          points: 25,
          current_count: goalDeposits,
          unlocked: goalDeposits >= 1
        },
        {
          id: 'save_streak',
          title: 'Активный накопитель 📈',
          description: 'Сделай 10 пополнений целей',
          icon: '📈',
          required_count: 10,
          points: 150,
          current_count: goalDeposits,
          unlocked: goalDeposits >= 10
        },
        {
          id: 'goal_achiever',
          title: 'Достигатор целей ⭐',
          description: 'Достигни свою первую цель',
          icon: '⭐',
          required_count: 1,
          points: 100,
          current_count: completedGoals,
          unlocked: completedGoals >= 1
        },
        {
          id: 'goal_champion',
          title: 'Чемпион целей 👑',
          description: 'Достигни 3 цели',
          icon: '👑',
          required_count: 3,
          points: 300,
          current_count: completedGoals,
          unlocked: completedGoals >= 3
        }
      ];

      setCategories(progressCategories);
    } catch (error: any) {
      toast({
        title: 'Ошибка загрузки прогресса',
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-accent" />
              Достижения
            </h1>
            <p className="text-muted-foreground">Твои успехи и награды</p>
          </div>
          
          <Card className="bg-gradient-to-r from-accent/20 to-warning/20 border-accent/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Star className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Общие очки</p>
                  <p className="text-2xl font-bold text-accent">{totalPoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Прогресс достижений
            </CardTitle>
            <CardDescription>Выполняй задания и получай награды!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => {
                const progress = Math.min((category.current_count / category.required_count) * 100, 100);
                return (
                  <div
                    key={category.id}
                    className={`p-4 rounded-lg border ${
                      category.unlocked 
                        ? 'bg-success/10 border-success/20' 
                        : 'bg-muted/20 border-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{category.icon}</div>
                        <div>
                          <h4 className="font-semibold">{category.title}</h4>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={category.unlocked ? 'default' : 'secondary'}
                        className={category.unlocked ? 'bg-success text-success-foreground' : ''}
                      >
                        {category.unlocked ? 'Получено!' : `+${category.points}`}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Прогресс</span>
                        <span>{category.current_count}/{category.required_count}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Earned Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Полученные награды
            </CardTitle>
            <CardDescription>
              {achievements.length} достижений на {totalPoints} очков
            </CardDescription>
          </CardHeader>
          <CardContent>
            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} className="bg-gradient-to-br from-accent/10 to-warning/10 border-accent/20">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <Badge className="bg-accent/20 text-accent">
                              +{achievement.points} очков
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(achievement.earned_at).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">Пока нет достижений</CardTitle>
                <CardDescription>
                  Начни копить деньги и создавать цели, чтобы получить первые награды!
                </CardDescription>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}