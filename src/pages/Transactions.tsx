import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpRight, ArrowDownLeft, Target, TrendingUp, Calendar, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  created_at: string;
  goal_id?: string;
  from_user_id?: string;
  to_user_id?: string;
  savings_goals?: {
    title: string;
  };
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'goal_deposit':
      return <Target className="h-4 w-4" />;
    case 'income':
      return <ArrowDownLeft className="h-4 w-4 text-success" />;
    case 'expense':
      return <ArrowUpRight className="h-4 w-4 text-destructive" />;
    default:
      return <TrendingUp className="h-4 w-4" />;
  }
};

const getTransactionType = (type: string) => {
  switch (type) {
    case 'goal_deposit':
      return 'Пополнение цели';
    case 'income':
      return 'Доходы';
    case 'expense':
      return 'Расходы';
    case 'transfer':
      return 'Перевод';
    default:
      return type;
  }
};

const getTransactionColor = (type: string) => {
  switch (type) {
    case 'goal_deposit':
      return 'bg-secondary/10 text-secondary border-secondary/20';
    case 'income':
      return 'bg-success/10 text-success border-success/20';
    case 'expense':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'transfer':
      return 'bg-primary/10 text-primary border-primary/20';
    default:
      return 'bg-muted/10 text-muted-foreground';
  }
};

export default function Transactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, filter]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          savings_goals (
            title
          )
        `)
        .or(`from_user_id.eq.${user?.id},to_user_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: 'Ошибка загрузки транзакций',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    if (filter === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter(t => t.type === filter));
    }
  };

  const getTransactionAmount = (transaction: Transaction) => {
    const isIncoming = transaction.to_user_id === user?.id || transaction.type === 'income';
    const sign = isIncoming ? '+' : '-';
    const color = isIncoming ? 'text-success' : 'text-destructive';
    
    return (
      <span className={`font-semibold ${color}`}>
        {sign}{transaction.amount} ₽
      </span>
    );
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
              <TrendingUp className="h-8 w-8 text-primary" />
              Транзакции
            </h1>
            <p className="text-muted-foreground">История твоих операций</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Фильтр" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все транзакции</SelectItem>
                <SelectItem value="goal_deposit">Пополнения целей</SelectItem>
                <SelectItem value="income">Доходы</SelectItem>
                <SelectItem value="expense">Расходы</SelectItem>
                <SelectItem value="transfer">Переводы</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-success/10 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <ArrowDownLeft className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Доходы</p>
                  <p className="text-xl font-bold text-success">
                    +{transactions
                      .filter(t => t.type === 'income' || t.to_user_id === user?.id)
                      .reduce((sum, t) => sum + t.amount, 0)} ₽
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <ArrowUpRight className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Расходы</p>
                  <p className="text-xl font-bold text-destructive">
                    -{transactions
                      .filter(t => t.type === 'expense' || (t.from_user_id === user?.id && t.type !== 'income'))
                      .reduce((sum, t) => sum + t.amount, 0)} ₽
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/10 border-secondary/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Target className="h-8 w-8 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">В цели</p>
                  <p className="text-xl font-bold text-secondary">
                    {transactions
                      .filter(t => t.type === 'goal_deposit')
                      .reduce((sum, t) => sum + t.amount, 0)} ₽
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>История операций</CardTitle>
            <CardDescription>
              {filteredTransactions.length} {filter === 'all' ? 'транзакций' : 'операций'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length > 0 ? (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-background rounded-full">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {transaction.description || getTransactionType(transaction.type)}
                          </h4>
                          <Badge className={getTransactionColor(transaction.type)}>
                            {getTransactionType(transaction.type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(transaction.created_at).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {transaction.savings_goals?.title && (
                            <span>Цель: {transaction.savings_goals.title}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getTransactionAmount(transaction)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">Пока нет транзакций</CardTitle>
                <CardDescription>
                  {filter === 'all' 
                    ? 'Когда ты совершишь первую операцию, она появится здесь'
                    : 'Нет транзакций выбранного типа'
                  }
                </CardDescription>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}