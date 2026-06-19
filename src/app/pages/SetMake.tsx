import { ArrowRight, Check, ChevronRight, Home } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAllCocktails } from "@/data/useCocktails";
import { stepProgress } from "@/domain/cocktails";
import { useT } from "@/i18n";
import { usePartyStore } from "@/store/partyStore";
import { useUserStore } from "@/store/userStore";

export default function SetMake() {
  const t = useT();
  const nav = useNavigate();
  const all = useAllCocktails();
  const items = usePartyStore((s) => s.items);
  const logPreparation = useUserStore((s) => s.logPreparation);

  // Resolve plan items (in order) to actual cocktails, dropping any unknown ids.
  const queue = useMemo(
    () => items.map((it) => all.find((c) => c.id === it.id)).filter((c): c is NonNullable<typeof c> => c != null),
    [items, all],
  );

  const [cocktailIndex, setCocktailIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  if (queue.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-text-dim">
        План вечірки порожній.
        <div className="mt-6">
          <button onClick={() => nav("/sets")} className="rounded-full border border-gold px-4 py-2 text-sm text-gold">
            {t.sets.builder}
          </button>
        </div>
      </div>
    );
  }

  const finishedAll = cocktailIndex >= queue.length;

  if (finishedAll) {
    return (
      <div className="flex flex-col items-center px-6 py-20 text-center">
        <div className="font-display text-3xl text-gold">{t.stepper.finished}</div>
        <p className="mt-3 text-text-dim">{queue.length} коктейлів готово.</p>
        <button
          onClick={() => nav("/")}
          className="mt-8 flex items-center gap-2 rounded-xl bg-gold px-6 py-3 font-bold text-bg"
        >
          <Home size={18} /> {t.tabs.collection}
        </button>
      </div>
    );
  }

  const cocktail = queue[cocktailIndex];
  const steps = cocktail.steps;
  const progress = stepProgress(steps.length, stepIndex);
  const onLastStep = stepIndex >= steps.length - 1;
  const isLastCocktail = cocktailIndex >= queue.length - 1;

  const goNextStep = () => {
    if (!onLastStep) setStepIndex((i) => i + 1);
  };
  const goPrevStep = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const finishCocktail = () => {
    logPreparation(cocktail.id, Date.now());
    setCocktailIndex((i) => i + 1);
    setStepIndex(0);
  };

  return (
    <div className="px-4 py-4">
      {/* Overall party progress */}
      <div className="text-xs font-bold uppercase tracking-wide text-text-faint">
        {t.sets.cocktails} {cocktailIndex + 1} {t.stepper.of} {queue.length}
      </div>

      {/* Upcoming cocktails strip */}
      <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-1">
        {queue.map((c, i) => (
          <span
            key={`${c.id}-${i}`}
            className={
              "shrink-0 rounded-full border px-2.5 py-1 text-xs " +
              (i === cocktailIndex
                ? "border-gold text-gold"
                : i < cocktailIndex
                  ? "border-border text-text-faint line-through"
                  : "border-border text-text-dim")
            }
          >
            {c.name}
          </span>
        ))}
      </div>

      {/* Current cocktail */}
      <h1 className="mt-4 font-display text-2xl text-text">{cocktail.name}</h1>

      {/* Step progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-text-dim">
          <span>
            {t.stepper.step} {progress.current} {t.stepper.of} {progress.total}
          </span>
          <span className="text-text-faint">{Math.round(progress.pct * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress.pct * 100}%` }} />
        </div>
      </div>

      {/* Current step */}
      <div className="mt-4 rounded-xl border border-border bg-surface p-5">
        <div className="text-sm font-bold text-gold">
          {t.stepper.step} {progress.current}
        </div>
        <p className="mt-2 text-lg leading-relaxed text-text">{steps[stepIndex] ?? ""}</p>
      </div>

      {/* Step navigation */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={goPrevStep}
          disabled={stepIndex === 0}
          className="rounded-full border border-border px-4 py-2.5 text-sm text-text-dim disabled:opacity-40"
        >
          {t.stepper.back}
        </button>
        {onLastStep ? (
          <button
            onClick={finishCocktail}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 font-bold text-bg"
          >
            {isLastCocktail ? (
              <>
                <Check size={18} /> {t.stepper.done}
              </>
            ) : (
              <>
                {t.sets.nextCocktail} <ArrowRight size={18} />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={goNextStep}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 font-bold text-bg"
          >
            {t.stepper.next} <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
