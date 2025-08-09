import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Simple localStorage helpers
const STORAGE_KEY = "budget-challenge-progress";

type Allocations = {
  needs: number; // обязательные нужды
  wants: number; // желания
  savings: number; // сбережения
  charity: number; // благотворительность
};

const DEFAULT_ALLOCATIONS: Allocations = {
  needs: 50,
  wants: 30,
  savings: 20,
  charity: 0,
};

export default function BudgetChallenge() {
  const [income, setIncome] = useState<number>(2000);
  const [alloc, setAlloc] = useState<Allocations>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ALLOCATIONS;
  });
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-best`);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  // SEO meta
  useEffect(() => {
    const title = "Бюджет‑челлендж — игра по финансовой грамотности";
    const description = "Распредели бюджет по правилу 50/30/20, прокачай финнавыки и получай очки.";
    document.title = title;

    const ensureMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    ensureMeta("description", description);

    // canonical
    let link = document.querySelector("link[rel=canonical]") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.origin + "/budget";
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alloc));
  }, [alloc]);

  const totalPercent = alloc.needs + alloc.wants + alloc.savings + alloc.charity;
  const remaining = Math.max(0, 100 - totalPercent);

  // Score based on closeness to 50/30/20 (+бонус за благотворительность до 5%)
  const score = useMemo(() => {
    const diffNeeds = Math.abs(alloc.needs - 50);
    const diffWants = Math.abs(alloc.wants - 30);
    const diffSavings = Math.abs(alloc.savings - 20);
    // charity: 0-5% — лучший диапазон
    const charityPenalty = alloc.charity <= 5 ? 0 : (alloc.charity - 5) * 2;

    const raw = 100 - (diffNeeds + diffWants + diffSavings) * 0.8 - charityPenalty;
    return Math.round(Math.max(0, Math.min(100, raw)));
  }, [alloc]);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem(`${STORAGE_KEY}-best`, String(score));
    }
  }, [score, bestScore]);

  const handleAdjust = (key: keyof Allocations, next: number[]) => {
    const value = Math.round(next[0]);
    // ограничим так, чтобы суммарно не превышать 100
    const othersSum = totalPercent - alloc[key];
    const maxAllowed = Math.max(0, 100 - othersSum);
    setAlloc(prev => ({ ...prev, [key]: Math.min(value, maxAllowed) }));
  };

  const allocatedAmount = (p: number) => Math.round((income * p) / 100);

  const handleCheck = () => {
    if (remaining > 0) {
      toast("Распредели 100% дохода, чтобы проверить результат");
      return;
    }
    if (score >= 85) {
      toast.success("Отлично! Ты мастер бюджета 🏆");
    } else if (score >= 70) {
      toast("Хорошо! Есть ещё куда расти ✨");
    } else {
      toast("Попробуй приблизиться к 50/30/20 — получится! 💪");
    }
  };

  const handleReset = () => {
    setAlloc(DEFAULT_ALLOCATIONS);
    toast("Сброс настроек бюджета");
  };

  return (
    <main className="w-full">
      <header className="w-full border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Бюджет‑челлендж
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Распредели доход по категориям и сравни с правилом 50/30/20
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Мой ежемесячный доход</CardTitle>
              <CardDescription>Укажи сумму, которую хочешь распределить</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  className="w-40 rounded-md border border-input bg-background px-3 py-2"
                  value={income}
                  min={0}
                  onChange={(e) => setIncome(Math.max(0, Number(e.target.value)))}
                  aria-label="Ежемесячный доход"
                />
                <span className="text-sm text-muted-foreground">₽</span>
              </div>
              <Separator />
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Нужды (еда, жильё, транспорт)</span>
                    <span className="text-sm text-muted-foreground">{alloc.needs}% • ₽{allocatedAmount(alloc.needs).toLocaleString()}</span>
                  </div>
                  <Slider
                    max={100}
                    step={1}
                    value={[alloc.needs]}
                    onValueChange={(v) => handleAdjust("needs", v)}
                    aria-label="Нужды"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Желания (развлечения, подарки)</span>
                    <span className="text-sm text-muted-foreground">{alloc.wants}% • ₽{allocatedAmount(alloc.wants).toLocaleString()}</span>
                  </div>
                  <Slider
                    max={100}
                    step={1}
                    value={[alloc.wants]}
                    onValueChange={(v) => handleAdjust("wants", v)}
                    aria-label="Желания"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Сбережения (накопления, цели)</span>
                    <span className="text-sm text-muted-foreground">{alloc.savings}% • ₽{allocatedAmount(alloc.savings).toLocaleString()}</span>
                  </div>
                  <Slider
                    max={100}
                    step={1}
                    value={[alloc.savings]}
                    onValueChange={(v) => handleAdjust("savings", v)}
                    aria-label="Сбережения"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Благотворительность</span>
                    <span className="text-sm text-muted-foreground">{alloc.charity}% • ₽{allocatedAmount(alloc.charity).toLocaleString()}</span>
                  </div>
                  <Slider
                    max={100}
                    step={1}
                    value={[alloc.charity]}
                    onValueChange={(v) => handleAdjust("charity", v)}
                    aria-label="Благотворительность"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">Осталось распределить: {remaining}%</div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReset}>Сбросить</Button>
                  <Button onClick={handleCheck}>Проверить</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Результат</CardTitle>
              <CardDescription>Насколько твой план близок к идеалу</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Текущий счёт</span>
                <span className="font-bold">{score}/100</span>
              </div>
              <Progress value={score} />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Лучший результат</span>
                <span className="font-bold">{bestScore}/100</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Рекомендация: 50% нужды, 30% желания, 20% сбережения. Благотворительность — по желанию (до 5%).
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Подсказки</CardTitle>
              <CardDescription>Как распределять деньги разумно</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>— Начни с сбережений: плати себе первым (минимум 10–20%).</p>
              <p>— Проверь обязательные траты: можно ли снизить коммуналку, связь, подписки?</p>
              <p>— Желания — это классно, но не в ущерб целям. Помни о балансе.</p>
              <p>— Благотворительность учит делиться и планировать.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Цель игры</CardTitle>
              <CardDescription>Формируем полезные привычки</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                Эта мини‑игра помогает закрепить правило 50/30/20. Регулярно
                тренируйся и следи за лучшим счётом — так навык станет привычкой.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
