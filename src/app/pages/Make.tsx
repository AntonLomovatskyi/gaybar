import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCocktailById } from "@/data/useCocktails";
import { formatIngredient, stepProgress } from "@/domain/cocktails";
import { useT } from "@/i18n";
import { useUserStore } from "@/store/userStore";

export default function Make() {
  const t = useT();
  const nav = useNavigate();
  const { id } = useParams();
  const cocktail = useCocktailById(id);
  const units = useUserStore((s) => s.units);
  const logPreparation = useUserStore((s) => s.logPreparation);

  // -1 = mise en place, 0..n-1 = steps, n = finished
  const [index, setIndex] = useState(-1);
  const loggedRef = useRef(false);

  const total = cocktail?.steps.length ?? 0;
  const finished = index >= total;

  useEffect(() => {
    if (cocktail && finished && !loggedRef.current) {
      loggedRef.current = true;
      logPreparation(cocktail.id, Date.now());
    }
  }, [cocktail, finished, logPreparation]);

  if (!cocktail) {
    return <div className="px-6 py-16 text-center text-text-dim">{t.common.none}</div>;
  }

  // Mise en place
  if (index < 0) {
    return (
      <div className="px-4 py-4">
        <h1 className="font-display text-2xl text-text">{cocktail.name}</h1>
        <p className="mt-1 text-sm text-text-faint">Підготуй усе перед тим, як почати</p>

        <div className="mt-5 rounded-xl border border-border bg-surface p-4">
          <div className="text-sm font-bold text-gold">{t.recipe.ingredients}</div>
          <ul className="mt-2 space-y-1.5">
            {cocktail.ingredients.map((ing, i) => (
              <li key={i} className="text-base text-text">
                {formatIngredient(ing, 1, units)}
              </li>
            ))}
          </ul>
        </div>

        {cocktail.tools.length > 0 && (
          <div className="mt-3 rounded-xl border border-border bg-surface p-4">
            <div className="text-sm font-bold text-gold">{t.recipe.tools}</div>
            <ul className="mt-2 space-y-1.5">
              {cocktail.tools.map((tool, i) => (
                <li key={i} className="text-base text-text">
                  {tool}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => setIndex(0)}
          disabled={total === 0}
          className="mt-6 w-full rounded-xl bg-gold px-4 py-3 text-center font-bold text-bg disabled:opacity-40"
        >
          {t.stepper.next}
        </button>
      </div>
    );
  }

  // Finished
  if (finished) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <PartyPopper size={56} className="text-gold" />
        <h1 className="mt-4 font-display text-3xl text-text">{t.stepper.finished}</h1>
        <p className="mt-2 text-text-dim">{cocktail.name}</p>
        <button
          onClick={() => nav(-1)}
          className="mt-8 w-full max-w-xs rounded-xl bg-gold px-4 py-3 text-center font-bold text-bg"
        >
          {t.recipe.viewCard}
        </button>
      </div>
    );
  }

  // Step view
  const progress = stepProgress(total, index);
  const isLast = index === total - 1;

  return (
    <div className="flex min-h-[60vh] flex-col px-4 py-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className="h-full rounded-full bg-gold transition-all"
          style={{ width: `${Math.round(progress.pct * 100)}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-text-faint">
        {t.stepper.step} {progress.current} {t.stepper.of} {progress.total}
      </div>

      <div className="flex flex-1 items-center py-6">
        <p className="text-2xl leading-relaxed text-text">{cocktail.steps[index]}</p>
      </div>

      {/* Always-visible amounts so you know how much to pour */}
      <div className="mb-3 rounded-xl border border-border bg-surface p-3">
        <div className="mb-1.5 text-xs font-bold text-gold">{t.recipe.ingredients}</div>
        <div className="flex flex-col gap-1">
          {cocktail.ingredients.map((ing, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-text">{ing.name}</span>
              <span className="shrink-0 tabular-nums text-text-dim">
                {formatIngredient(ing, 1, units).split(" — ")[1] ?? ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setIndex((i) => i - 1)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-3 text-text-dim"
        >
          <ArrowLeft size={18} /> {t.stepper.back}
        </button>
        <button
          onClick={() => setIndex((i) => i + 1)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold px-4 py-3 font-bold text-bg"
        >
          {isLast ? (
            <>
              {t.stepper.done} <Check size={18} />
            </>
          ) : (
            <>
              {t.stepper.next} <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
