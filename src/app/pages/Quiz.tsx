import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import clsx from "clsx";
import { useAllCocktails } from "@/data/useCocktails";
import { isEssential } from "@/domain/inventory";
import type { Cocktail } from "@/types/cocktail";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Question {
  cocktail: Cocktail;
  options: Cocktail[];
  clues: string[];
}

function makeQuestion(all: Cocktail[]): Question {
  const cocktail = all[Math.floor(Math.random() * all.length)];
  const others = shuffle(all.filter((c) => c.id !== cocktail.id)).slice(0, 3);
  const options = shuffle([cocktail, ...others]);
  const essential = cocktail.ingredients.filter(isEssential).map((i) => i.name);
  const clues = essential.length
    ? essential
    : cocktail.ingredients.filter((i) => !i.name.toLowerCase().includes("лід")).map((i) => i.name);
  return { cocktail, options, clues };
}

export default function Quiz() {
  const all = useAllCocktails();
  const [q, setQ] = useState<Question | null>(() => (all.length ? makeQuestion(all) : null));
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [streak, setStreak] = useState(0);

  if (!q) return <div className="px-6 py-16 text-center text-text-dim">Немає коктейлів</div>;

  const pick = (id: string) => {
    if (picked) return;
    setPicked(id);
    setAnswered((n) => n + 1);
    if (id === q.cocktail.id) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else setStreak(0);
  };
  const next = () => {
    setPicked(null);
    setQ(makeQuestion(all));
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-text">Вікторина</h1>
        <div className="text-sm text-text-dim tabular-nums">
          {score}/{answered}
          {streak > 1 ? ` · 🔥 ${streak}` : ""}
        </div>
      </div>
      <p className="mt-1 text-sm text-text-faint">Вгадай коктейль за інгредієнтами</p>

      <div className="mt-4 rounded-xl border border-border bg-surface p-4">
        <div className="text-xs font-bold text-gold">Інгредієнти</div>
        <ul className="mt-2 space-y-1">
          {q.clues.map((c, i) => (
            <li key={i} className="text-base text-text">
              • {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {q.options.map((o) => {
          const isCorrect = o.id === q.cocktail.id;
          const state = !picked ? "idle" : isCorrect ? "correct" : o.id === picked ? "wrong" : "idle";
          return (
            <button
              key={o.id}
              onClick={() => pick(o.id)}
              disabled={!!picked}
              className={clsx(
                "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-text transition",
                state === "correct"
                  ? "border-success bg-success/15"
                  : state === "wrong"
                    ? "border-danger bg-danger/15"
                    : "border-border bg-surface",
              )}
            >
              {o.name}
              {state === "correct" && <Check size={18} className="text-success" />}
              {state === "wrong" && <X size={18} className="text-danger" />}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="mt-4 flex gap-2">
          <Link
            to={`/cocktail/${q.cocktail.id}`}
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-center font-bold text-text"
          >
            Деталі
          </Link>
          <button onClick={next} className="flex-1 rounded-xl bg-gold px-4 py-3 text-center font-bold text-bg">
            Далі →
          </button>
        </div>
      )}
    </div>
  );
}
