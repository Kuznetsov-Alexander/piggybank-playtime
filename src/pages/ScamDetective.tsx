import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// LocalStorage keys
const STORAGE_KEY = "scam-detective";
const BEST_KEY = `${STORAGE_KEY}-best`;

// Types
type QuestionBinary = {
  id: string;
  type: "binary";
  title: string;
  story: string;
  question: string;
  correct: boolean;
  explanation: string;
  points?: number;
};

type QuestionSingle = {
  id: string;
  type: "single";
  title: string;
  story: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points?: number;
};

type Question = QuestionBinary | QuestionSingle;

const QUESTIONS: Question[] = [
  {
    id: "sms-link",
    type: "binary",
    title: "СМС от банка",
    story:
      "Пришла СМС: ‘Подозрительная активность! Срочно подтвердите личность по ссылке bank-secure.ru/verify’.",
    question: "Это похоже на мошенничество?",
    correct: true,
    explanation:
      "Банк не просит подтверждать личность через ссылки в СМС. Переход по таким ссылкам ведёт на фишинг.",
    points: 10,
  },
  {
    id: "call-code",
    type: "binary",
    title: "Код из СМС",
    story:
      "Звонит ‘служба безопасности’ и просит продиктовать код из СМС, чтобы отменить списание.",
    question: "Нужно ли говорить код?",
    correct: false,
    explanation:
      "Никому нельзя говорить коды из СМС/приложений. Это ключ к вашему счёту.",
    points: 10,
  },
  {
    id: "mega-sale",
    type: "single",
    title: "Супер‑скидка",
    story:
      "Интернет‑магазин предлагает приставку за 1₽ — только ‘сегодня’. Сайт похож на известный, но адрес странный.",
    question: "Как поступить правильно?",
    options: [
      "Быстро оплатить, вдруг закончится",
      "Проверить адрес сайта/отзывы и не платить, если есть сомнения",
      "Написать в поддержку и отправить данные карты для проверки",
    ],
    correctIndex: 1,
    explanation:
      "Проверяйте домен, отзывы и способы оплаты с защитой. Чудесных цен почти не бывает.",
    points: 15,
  },
  {
    id: "friend-urgent",
    type: "single",
    title: "‘Друг’ в мессенджере",
    story:
      "В мессенджере пишет ‘друг’: срочно нужны деньги, телефон сломался, переведи на номер.",
    question: "Что делать?",
    options: [
      "Сразу перевести — вдруг беда",
      "Позвонить реальному другу/родителям и проверить",
      "Отправить фото карты, чтобы он сам списал",
    ],
    correctIndex: 1,
    explanation:
      "Всегда проверяйте, кто пишет. Часто взламывают аккаунты или подделывают профили.",
    points: 15,
  },
  {
    id: "qr-promo",
    type: "binary",
    title: "QR‑квест",
    story: "На остановке висит плакат ‘Сканируй QR — получи подарок’.",
    question: "Сканировать и вводить данные карты безопасно?",
    correct: false,
    explanation:
      "Никогда не вводите данные карты после случайного QR. Сначала проверьте источник акции.",
    points: 10,
  },
  {
    id: "prize-fee",
    type: "binary",
    title: "Вы выиграли!",
    story:
      "Письмо: ‘Вы выиграли смартфон! Оплатите 300₽ пошлины, чтобы получить приз’.",
    question: "Это честно?",
    correct: false,
    explanation:
      "Настоящие призы не требуют ‘пошлины’ заранее — это уловка для списания денег.",
    points: 10,
  },
  {
    id: "wifi-login",
    type: "single",
    title: "Публичный Wi‑Fi",
    story:
      "В кафе Wi‑Fi просит ‘войти через банк’ и ввести логин/пароль от интернет‑банка.",
    question: "Ваши действия?",
    options: [
      "Ввести данные — всем же нужно интернет",
      "Не вводить данные и использовать мобильный интернет/ВПН",
      "Сфоткать экран и отправить ‘в поддержку’",
    ],
    correctIndex: 1,
    explanation:
      "Никогда не вводите банковские данные в публичных сетях и на незнакомых страницах.",
    points: 15,
  },
  {
    id: "permissions-app",
    type: "single",
    title: "Незнакомое приложение",
    story:
      "Приложение просит доступ к СМС, звонкам и контактам без причины.",
    question: "Что правильно?",
    options: [
      "Дать все разрешения — вдруг пригодится",
      "Удалить/не устанавливать, найти официальный источник",
      "Написать разработчику номер карты для ‘верификации’",
    ],
    correctIndex: 1,
    explanation:
      "Скачивайте приложения из официальных сто́ров и проверяйте запрашиваемые разрешения.",
    points: 10,
  },
  {
    id: "guru-profit",
    type: "binary",
    title: "Инвест‑гуру",
    story:
      "В рекламе обещают ‘+5% каждый день без риска’. Нужно перевести ‘в управляющую компанию’.",
    question: "Стоит верить?",
    correct: false,
    explanation:
      "Гарантированной сверхприбыли не бывает. Это типичный инвестиционный обман.",
    points: 10,
  },
  {
    id: "courier-prepay",
    type: "binary",
    title: "Курьер и предоплата",
    story:
      "‘Курьер’ просит заранее оплатить доставку переводом на карту личного лица.",
    question: "Безопасно ли переводить?",
    correct: false,
    explanation:
      "Переводы на личные карты незнакомцам без защиты — риск. Используйте безопасные сервисы и оплату с защитой.",
    points: 10,
  },
];

function hearts(lives: number) {
  return "❤".repeat(lives) + "♡".repeat(Math.max(0, 3 - lives));
}

export default function ScamDetective() {
  const [index, setIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-index`);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState<number>(() => {
    try {
      const v = localStorage.getItem(BEST_KEY);
      return v ? Number(v) : 0;
    } catch {
      return 0;
    }
  });
  const [finished, setFinished] = useState(false);

  // SEO meta
  useEffect(() => {
    const title = "Детектив‑мошенник — учимся распознавать обман";
    const description = "Игра с сюжетами, выборами и прогрессом: прокачай безопасность и финансовую грамотность.";
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
    let link = document.querySelector("link[rel=canonical]") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.origin + "/detective";
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}-index`, String(index));
    } catch {}
  }, [index]);

  const progress = useMemo(() => Math.round(((index) / QUESTIONS.length) * 100), [index]);

  const cur = QUESTIONS[index];

  const rank = useMemo(() => {
    if (score >= 100) return { label: "Супер‑агент", color: "bg-primary text-primary-foreground" };
    if (score >= 70) return { label: "Агент", color: "bg-secondary text-secondary-foreground" };
    return { label: "Новичок", color: "bg-muted text-foreground" };
  }, [score]);

  const nextQuestion = () => {
    if (index + 1 >= QUESTIONS.length || lives <= 0) {
      setFinished(true);
      try {
        if (score > best) {
          localStorage.setItem(BEST_KEY, String(score));
          setBest(score);
        }
      } catch {}
      return;
    }
    setIndex((i) => i + 1);
  };

  const handleAnswer = (answer: boolean | number) => {
    if (!cur) return;

    if (cur.type === "binary") {
      const ok = answer === cur.correct;
      if (ok) {
        const pts = cur.points ?? 10;
        setScore((s) => s + pts);
        toast.success("Верно! +" + pts + " очков");
      } else {
        setLives((l) => Math.max(0, l - 1));
        toast(cur.explanation);
      }
    } else {
      const ok = answer === cur.correctIndex;
      if (ok) {
        const pts = cur.points ?? 10;
        setScore((s) => s + pts);
        toast.success("Отличный выбор! +" + pts + " очков");
      } else {
        setLives((l) => Math.max(0, l - 1));
        toast(cur.explanation);
      }
    }

    setTimeout(nextQuestion, 400);
  };

  const reset = () => {
    setIndex(0);
    setScore(0);
    setLives(3);
    setFinished(false);
  };

  return (
    <main className="w-full">
      <header className="w-full border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Детектив‑мошенник
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Пройди сюжеты, делай выбор и копи очки — стань мастером финансовой безопасности
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Прогресс</CardTitle>
              <CardDescription>
                Вопрос {Math.min(index + 1, QUESTIONS.length)} из {QUESTIONS.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={finished ? 100 : progress} />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Очки: <span className="font-semibold text-foreground">{score}</span></span>
                <span>Жизни: <span className="font-semibold text-red-600">{hearts(lives)}</span></span>
                <Badge variant="outline" className="uppercase tracking-wide">{rank.label}</Badge>
              </div>
            </CardContent>
          </Card>

          {!finished && cur && (
            <Card className="animate-enter">
              <CardHeader>
                <CardTitle>{cur.title}</CardTitle>
                <CardDescription>Внимательно прочитай историю и ответь на вопрос</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{cur.story}</p>
                <Separator />
                <p className="font-medium">{cur.question}</p>

                {cur.type === "binary" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <Button onClick={() => handleAnswer(true)} className="hover-scale">Это мошенничество</Button>
                    <Button variant="outline" onClick={() => handleAnswer(false)} className="hover-scale">Всё честно</Button>
                  </div>
                ) : (
                  <div className="grid gap-3 pt-2">
                    {cur.options.map((opt, i) => (
                      <Button key={i} variant="outline" onClick={() => handleAnswer(i)} className="justify-start hover-scale">
                        {opt}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {finished && (
            <Card className="animate-enter">
              <CardHeader>
                <CardTitle>Финиш!</CardTitle>
                <CardDescription>Твой результат и рекомендации</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Набрано очков</div>
                    <div className="text-2xl font-bold">{score}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Лучший результат</div>
                    <div className="text-2xl font-bold">{best}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground">{rank.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Запомни главное: никому не сообщай коды, проверяй адрес сайта, не спеши платить и перепроверяй личности.
                </p>
                <div className="flex gap-3 pt-2">
                  <Button onClick={reset}>Сыграть ещё раз</Button>
                  <Button variant="outline" onClick={() => { setFinished(false); setIndex(Math.max(0, QUESTIONS.length - 3)); setScore(0); setLives(3); }}>Сложные кейсы</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        <aside className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Подсказки</CardTitle>
              <CardDescription>Короткие правила безопасности</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>— Банк и сервисы не спрашивают коды и пароли в звонках/чатах.</p>
              <p>— Проверяй домен сайта и способ оплаты с защитой покупателя.</p>
              <p>— ‘Срочно переведи’ — почти всегда красный флаг.</p>
              <p>— Не сканируй случайные QR, не ставь сомнительные приложения.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Зачем это нужно</CardTitle>
              <CardDescription>Финансовая грамотность = свобода</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                Эта игра тренирует навык распознавать уловки и защищать свои деньги. 
                Регулярно играй и улучшай лучший результат!
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
