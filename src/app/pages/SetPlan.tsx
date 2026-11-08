import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowDownUp, Check, RefreshCw, Share2, ShoppingCart } from "lucide-react";
import { Stepper } from "@/components/Stepper";
import { canonicalById } from "@/data/catalog/ingredients";
import { useAllCocktails } from "@/data/useCocktails";
import { useTriedIds } from "@/data/useFilteredCocktails";
import { estimateStrength, usesIngredient } from "@/domain/cocktails";
import { classifyIngredient, isEssential } from "@/domain/inventory";
import { replaceWithSimilar, sortByStrength } from "@/domain/party";
import { splitShoppingList, type ShoppingSelection } from "@/domain/shopping";
import { useT } from "@/i18n";
import { decodePlan, encodePlan, shareLink } from "@/lib/share";
import { usePartyStore } from "@/store/partyStore";
import { useUserStore } from "@/store/userStore";

export default function SetPlan() {
  const t = useT();
  const nav = useNavigate();
  const all = useAllCocktails();
  const title = usePartyStore((s) => s.title);
  const items = usePartyStore((s) => s.items);
  const config = usePartyStore((s) => s.config);
  const notice = usePartyStore((s) => s.notice);
  const bumpServings = usePartyStore((s) => s.bumpServings);
  const setPlan = usePartyStore((s) => s.setPlan);
  const ownedIngredients = useUserStore((s) => s.ownedIngredients);
  const flexibleMatching = useUserStore((s) => s.flexibleMatching);
  const triedIds = useTriedIds();
  const [params] = useSearchParams();

  // Load a shared plan from the URL (?s=id:qty,…) when there's no active plan.
  useEffect(() => {
    const s = params.get("s");
    if (s && items.length === 0) setPlan(decodePlan(s), "Спільний сет");
  }, [params, items.length, setPlan]);

  const sharePlan = () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}set/plan?s=${encodeURIComponent(encodePlan(items))}`;
    shareLink(title || "Сет коктейлів", url);
  };

  const planned = useMemo(
    () =>
      items
        .map((it) => ({ item: it, cocktail: all.find((c) => c.id === it.id) }))
        .filter((p): p is { item: (typeof items)[number]; cocktail: NonNullable<(typeof p)["cocktail"]> } =>
          Boolean(p.cocktail),
        ),
    [items, all],
  );

  const totalDrinks = useMemo(() => planned.reduce((sum, p) => sum + p.item.servings, 0), [planned]);

  /** Swap one pick for a similar drink that isn't already in the set. */
  const swap = (id: string) => {
    const current = planned.map((p) => ({ cocktail: p.cocktail, servings: p.item.servings }));
    const next = replaceWithSimilar(current, id, all, config.kind, Date.now(), {
      onlyMakeable: config.useMyBar,
      owned: ownedIngredients,
      flexible: flexibleMatching,
      tasted: config.tasted,
      triedIds,
      mustUse: config.mustUse,
    });
    setPlan(
      next.map((i) => ({ id: i.cocktail.id, servings: i.servings })),
      title,
      notice,
    );
  };

  /** Re-order the current plan from lightest to strongest. */
  const orderByStrength = () => {
    const sorted = sortByStrength(planned.map((p) => ({ cocktail: p.cocktail, servings: p.item.servings })));
    setPlan(
      sorted.map((i) => ({ id: i.cocktail.id, servings: i.servings })),
      title,
      notice,
    );
  };

  /** Which must-use products each drink brings, so the guarantee is visible on the plan. */
  const usedByC = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of planned) {
      const names = (config.mustUse ?? [])
        .filter((id) => usesIngredient(p.cocktail, id))
        .map((id) => canonicalById(id)?.nameUk ?? id);
      if (names.length) m.set(p.cocktail.id, names);
    }
    return m;
  }, [planned, config.mustUse]);

  const shopping = useMemo(() => {
    const selections: ShoppingSelection[] = planned.map((p) => ({ cocktail: p.cocktail, servings: p.item.servings }));
    return splitShoppingList(selections, ownedIngredients);
  }, [planned, ownedIngredients]);

  /** What each drink is still missing from your bar — shown per row so nothing hides. */
  const missingByC = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of planned) {
      const req = p.cocktail.ingredients.filter(isEssential);
      const miss = req
        .filter((i) => classifyIngredient(i, ownedIngredients, flexibleMatching).tier === "missing")
        .map((i) => i.name);
      if (miss.length) m.set(p.cocktail.id, miss);
    }
    return m;
  }, [planned, ownedIngredients, flexibleMatching]);

  if (planned.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-text-dim">
        {t.sets.plan} — {t.common.none}
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-text">{t.sets.plan}</h1>
          {title && <div className="mt-0.5 text-sm text-gold">{title}</div>}
          {notice && <p className="mt-1 text-xs text-danger">{notice}</p>}
        </div>
        <button
          onClick={sharePlan}
          aria-label="Поділитися"
          className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-text-dim hover:text-gold"
        >
          <Share2 size={17} />
        </button>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-xs text-text-faint">
          {t.sets.total}: {totalDrinks}
        </span>
        <button
          onClick={orderByStrength}
          className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-text-dim hover:border-gold/60 hover:text-gold"
        >
          <ArrowDownUp size={14} /> За градусом
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {planned.map(({ item, cocktail }, i) => (
          <div key={item.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                {i + 1}
              </span>
              <Link to={`/cocktail/${cocktail.id}`} className="min-w-0 flex-1 truncate text-base text-text">
                {cocktail.name}
                <span className="ml-2 text-xs text-text-faint">≈ {estimateStrength(cocktail).abv}%</span>
              </Link>
              <button
                onClick={() => swap(cocktail.id)}
                aria-label="Замінити схожим"
                title="Замінити схожим"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-text-dim hover:border-gold/60 hover:text-gold"
              >
                <RefreshCw size={15} />
              </button>
              <div className="shrink-0">
                <Stepper
                  value={item.servings}
                  onChange={(v) => bumpServings(item.id, v - item.servings)}
                  min={1}
                  max={99}
                />
              </div>
            </div>
            {usedByC.get(cocktail.id) && (
              <div className="mt-1.5 pl-9 text-xs text-gold">✓ {usedByC.get(cocktail.id)!.join(", ")}</div>
            )}
            {missingByC.get(cocktail.id) && (
              <div className="mt-1.5 pl-9 text-xs text-danger">бракує: {missingByC.get(cocktail.id)!.join(", ")}</div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-gold">
          <ShoppingCart size={16} /> {t.sets.shoppingFor}
        </div>

        <div className="mt-3 text-xs font-bold text-text-faint">Купити ({shopping.need.length})</div>
        {shopping.need.length === 0 ? (
          <div className="mt-1 text-sm text-text-dim">Усе є 🎉</div>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {shopping.need.map((line) => (
              <li
                key={line.name}
                className="flex items-baseline justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="text-sm text-text">{line.name}</div>
                  {line.fromCocktails.length > 0 && (
                    <div className="truncate text-[11px] text-text-faint">{line.fromCocktails.join(", ")}</div>
                  )}
                </div>
                <div className="shrink-0 text-sm tabular-nums text-text-dim">
                  {line.mixedUnits
                    ? "—"
                    : line.amount != null
                      ? `${line.amount} ${line.unit ?? ""}`.trim()
                      : (line.unit ?? "")}
                </div>
              </li>
            ))}
          </ul>
        )}

        {shopping.have.length > 0 && (
          <>
            <div className="mt-4 text-xs font-bold text-text-faint">Вже є ({shopping.have.length})</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {shopping.have.map((line) => (
                <span
                  key={line.name}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-alt px-2.5 py-1 text-xs text-text-dim"
                >
                  <Check size={12} className="text-success" /> {line.name}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => nav("/set/make")}
        className="mt-4 block w-full rounded-xl bg-gold px-4 py-3 text-center font-bold text-bg"
      >
        {t.sets.start}
      </button>
    </div>
  );
}
