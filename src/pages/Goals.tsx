import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Target, Calendar, Trash2, Edit } from 'lucide-react';

interface SavingsGoal {
  id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  is_completed: boolean;
  image_url?: string;
}

export default function Goals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      toast({
        title: 'Ошибка загрузки целей',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const goalData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      target_amount: parseFloat(formData.get('target_amount') as string),
      target_date: formData.get('target_date') as string || null,
      user_id: user?.id,
    };

    try {
      if (editingGoal) {
        const { error } = await supabase
          .from('savings_goals')
          .update(goalData)
          .eq('id', editingGoal.id);
        
        if (error) throw error;
        toast({ title: 'Цель обновлена!' });
      } else {
        const { error } = await supabase
          .from('savings_goals')
          .insert([goalData]);
        
        if (error) throw error;
        toast({ title: 'Цель создана!' });
      }
      
      setOpen(false);
      setEditingGoal(null);
      loadGoals();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: 'Цель удалена' });
      loadGoals();
    } catch (error: any) {
      toast({
        title: 'Ошибка удаления',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const addMoney = async (goalId: string, amount: number) => {
    try {
      const { data: currentGoal, error: fetchError } = await supabase
        .from('savings_goals')
        .select('current_amount, target_amount')
        .eq('id', goalId)
        .single();

      if (fetchError) throw fetchError;

      const newAmount = currentGoal.current_amount + amount;
      const isCompleted = newAmount >= currentGoal.target_amount;

      const { error } = await supabase
        .from('savings_goals')
        .update({ 
          current_amount: newAmount,
          is_completed: isCompleted
        })
        .eq('id', goalId);

      if (error) throw error;

      // Create transaction
      await supabase
        .from('transactions')
        .insert([{
          type: 'goal_deposit',
          amount: amount,
          goal_id: goalId,
          from_user_id: user?.id,
          description: 'Пополнение цели'
        }]);

      if (isCompleted) {
        // Add achievement for completing goal
        await supabase
          .from('achievements')
          .insert([{
            user_id: user?.id,
            type: 'goal_completed',
            title: 'Цель достигнута! 🎯',
            description: 'Ты успешно накопил на свою цель!',
            points: 100,
            icon: '🎯'
          }]);
      }

      toast({ title: 'Деньги добавлены к цели!' });
      loadGoals();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8 text-secondary" />
              Мои цели
            </h1>
            <p className="text-muted-foreground">Накопи на свои мечты!</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingGoal(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Новая цель
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? 'Редактировать цель' : 'Создать новую цель'}
                </DialogTitle>
                <DialogDescription>
                  Опиши свою мечту и начни копить!
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название цели</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Новый велосипед"
                    defaultValue={editingGoal?.title}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Красивый горный велосипед для прогулок..."
                    defaultValue={editingGoal?.description}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_amount">Сумма цели (₽)</Label>
                  <Input
                    id="target_amount"
                    name="target_amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="15000"
                    defaultValue={editingGoal?.target_amount}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_date">Дата цели (необязательно)</Label>
                  <Input
                    id="target_date"
                    name="target_date"
                    type="date"
                    defaultValue={editingGoal?.target_date}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingGoal ? 'Обновить цель' : 'Создать цель'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              return (
                <Card key={goal.id} className={`${goal.is_completed ? 'bg-success/10 border-success' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        {goal.description && (
                          <CardDescription className="mt-1">{goal.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingGoal(goal);
                            setOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Прогресс</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{goal.current_amount} ₽</span>
                        <span>{goal.target_amount} ₽</span>
                      </div>
                    </div>
                    
                    {goal.target_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(goal.target_date).toLocaleDateString('ru-RU')}
                      </div>
                    )}

                    {!goal.is_completed && (
                      <div className="space-y-2">
                        <Label htmlFor={`add-money-${goal.id}`}>Добавить деньги</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`add-money-${goal.id}`}
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="100"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.currentTarget;
                                const amount = parseFloat(input.value);
                                if (amount > 0) {
                                  addMoney(goal.id, amount);
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={(e) => {
                              const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                              const amount = parseFloat(input.value);
                              if (amount > 0) {
                                addMoney(goal.id, amount);
                                input.value = '';
                              }
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    )}

                    {goal.is_completed && (
                      <div className="text-center p-4 bg-success/20 rounded-lg">
                        <div className="text-2xl mb-2">🎉</div>
                        <p className="font-semibold text-success">Цель достигнута!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center p-12">
            <CardContent>
              <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">Пока нет целей</CardTitle>
              <CardDescription className="mb-4">
                Создай свою первую цель накоплений и начни путь к мечте!
              </CardDescription>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Создать первую цель
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}