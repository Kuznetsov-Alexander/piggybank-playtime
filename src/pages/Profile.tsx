import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { User, Settings, LogOut, Star, Target, TrendingUp } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  age?: number;
  avatar_url?: string;
}

interface Stats {
  totalGoals: number;
  completedGoals: number;
  totalSaved: number;
  totalPoints: number;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalGoals: 0,
    completedGoals: 0,
    totalSaved: 0,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setProfile(data);
    } catch (error: any) {
      toast({
        title: 'Ошибка загрузки профиля',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadStats = async () => {
    try {
      const [goalsResult, achievementsResult, transactionsResult] = await Promise.all([
        supabase
          .from('savings_goals')
          .select('*')
          .eq('user_id', user?.id),
        supabase
          .from('achievements')
          .select('points')
          .eq('user_id', user?.id),
        supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'goal_deposit')
          .eq('from_user_id', user?.id)
      ]);

      const goals = goalsResult.data || [];
      const achievements = achievementsResult.data || [];
      const transactions = transactionsResult.data || [];

      setStats({
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.is_completed).length,
        totalSaved: transactions.reduce((sum, t) => sum + t.amount, 0),
        totalPoints: achievements.reduce((sum, a) => sum + a.points, 0)
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка загрузки статистики',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const updates = {
      full_name: formData.get('full_name') as string,
      age: formData.get('age') ? parseInt(formData.get('age') as string) : null,
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      toast({ title: 'Профиль обновлён!' });
      loadProfile();
    } catch (error: any) {
      toast({
        title: 'Ошибка обновления',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: 'До свидания!' });
    } catch (error: any) {
      toast({
        title: 'Ошибка выхода',
        description: error.message,
        variant: 'destructive',
      });
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8 text-primary" />
              Мой профиль
            </h1>
            <p className="text-muted-foreground">Управляй своим аккаунтом</p>
          </div>
          
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-lg">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'У'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{profile?.full_name || 'Пользователь'}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
                {profile?.age && (
                  <p className="text-sm text-muted-foreground">Возраст: {profile.age} лет</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-accent/10 border-accent/20">
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-accent">{stats.totalPoints}</p>
              <p className="text-sm text-muted-foreground">Очков</p>
            </CardContent>
          </Card>

          <Card className="bg-secondary/10 border-secondary/20">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-secondary">{stats.totalGoals}</p>
              <p className="text-sm text-muted-foreground">Целей</p>
            </CardContent>
          </Card>

          <Card className="bg-success/10 border-success/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-success">{stats.completedGoals}</p>
              <p className="text-sm text-muted-foreground">Достигнуто</p>
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">💰</div>
              <p className="text-2xl font-bold text-primary">{stats.totalSaved} ₽</p>
              <p className="text-sm text-muted-foreground">Накоплено</p>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Редактировать профиль
            </CardTitle>
            <CardDescription>Обнови информацию о себе</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Полное имя</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={profile?.full_name}
                    placeholder="Иван Петров"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Возраст</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="1"
                    max="100"
                    defaultValue={profile?.age}
                    placeholder="15"
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Сохраняем...' : 'Сохранить изменения'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Информация об аккаунте</CardTitle>
            <CardDescription>Данные твоего аккаунта</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Дата регистрации</Label>
                <p className="font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}