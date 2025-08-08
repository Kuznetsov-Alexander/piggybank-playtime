import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Send, Search, UserCheck, ArrowLeftRight, Users } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
}

interface Account {
  id: string;
  balance: number;
  account_number: string;
}

export default function Transfers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (user) {
      loadAccount();
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

  const searchProfiles = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.rpc('search_profiles', {
        search_query: searchQuery,
      });
      if (error) throw error;
      const mapped = (data || []).filter((p: any) => p.user_id !== user?.id).map((p: any) => ({
        id: p.user_id,
        user_id: p.user_id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
      }));
      setProfiles(mapped);
    } catch (error: any) {
      toast({
        title: 'Ошибка поиска',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedProfile || !amount || !account) return;

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast({
        title: 'Ошибка перевода',
        description: 'Укажи корректную сумму',
        variant: 'destructive',
      });
      return;
    }
    if (transferAmount > account.balance) {
      toast({
        title: 'Недостаточно средств',
        description: 'Сумма превышает доступный баланс',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('transfer_funds', {
        to_user: selectedProfile.user_id,
        amount: transferAmount,
        description: `Перевод для ${selectedProfile.full_name}`,
      });
      if (error) throw error;

      toast({
        title: 'Перевод выполнен!',
        description: `${transferAmount} ₽ отправлено пользователю ${selectedProfile.full_name}`,
      });

      // Сброс формы и обновление данных
      setAmount('');
      setSelectedProfile(null);
      setProfiles([]);
      setSearchQuery('');
      await loadAccount();
    } catch (error: any) {
      toast({
        title: 'Ошибка перевода',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Send className="h-8 w-8 text-primary" />
            Переводы
          </h1>
          <p className="text-muted-foreground">Отправляй деньги своим друзьям</p>
        </div>

        {/* Баланс */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Твой баланс</p>
              <p className="text-3xl font-bold text-primary">
                {account?.balance || 0} ₽
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Поиск пользователей */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Найти получателя
            </CardTitle>
            <CardDescription>
              Найди друга по имени
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="search">Имя пользователя</Label>
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Введи имя друга..."
                  onKeyPress={(e) => e.key === 'Enter' && searchProfiles()}
                />
              </div>
              <Button 
                onClick={searchProfiles} 
                disabled={searching || !searchQuery.trim()}
                className="mt-6"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Результаты поиска */}
            {profiles.length > 0 && (
              <div className="space-y-2">
                <Label>Найденные пользователи:</Label>
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedProfile?.id === profile.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {profile.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{profile.full_name}</span>
                      </div>
                      {selectedProfile?.id === profile.id && (
                        <UserCheck className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Форма перевода */}
        {selectedProfile && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                Перевод для {selectedProfile.full_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Сумма перевода</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Введи сумму..."
                  min="1"
                  max={account?.balance || 0}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Максимум: {account?.balance || 0} ₽
                </p>
              </div>

              <Button
                onClick={handleTransfer}
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Отправить {amount} ₽
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}