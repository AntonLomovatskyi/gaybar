import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Share2, ShoppingCart } from "lucide-react";
import clsx from "clsx";
import { Stepper } from "@/components/Stepper";
import { cocktailAvailability, type Availability } from "@/data/catalog/availability";
import { useAllCocktails } from "@/data/useCocktails";
import { splitShoppingList, type ShoppingSelection } from "@/domain/shopping";
import { useT } from "@/i18n";
import { decodePlan, encodePlan, shareLink } from "@/lib/share";
import { usePartyStore } from "@/store/partyStore";
import { useUserStore } from "@/store/userStore";

const AVAIL_STYLE: Record<Availability, string> = {
  common: "border-success text-success",
  specialty: "border-gold text-gold",
  rare: "border-danger text-danger",
};

export default function SetPlan() {
  const t = useT();
  const nav = useNavigate();
  const all = useAllCocktails();
  const title = usePartyStore((s) => s.title);
  const items = usePartyStore((s) => s.items);
  const bumpServings = usePartyStore((s) => s.bumpServings);
  const setPlan = usePartyStore((s) => s.setPlan);
  const ownedIngredients = useUserStore((s) => s.ownedIngredients);
  const shoppingCart = useUserStore((s) => s.shopping);
  const setShoppingServings = useUserStore((s) => s.setShoppingServings);
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

  const availLabel: Record<Availability, string> = {
    common: t.sets.availLocal,
    specialty: t.sets.availSpecialty,
    rare: t.sets.availRare,
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

  const addAllToShopping = () => {
    for (const { item } of planned) setShoppingServings(item.id, (shoppingCart[item.id] ?? 0) + item.servings);
    nav("/shopping");
  };

  const shopping = useMemo(() => {
    const selections: ShoppingSelection[] = planned.map((p) => ({ cocktail: p.cocktail, servings: p.item.servings }));
    return splitShoppingList(selections, ownedIngredients);
  }, [planned, ownedIngredients]);

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
        </div>
        <button
          onClick={sharePlan}
          aria-label="Поділитися"
          className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-text-dim hover:text-gold"
        >
          <Share2 size={17} />
        </button>
      </div>
      <div className="mt-1 text-xs text-text-faint">
        {t.sets.total}: {totalDrinks}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {planned.map(({ item, cocktail }) => {
          const avail = cocktailAvailability(cocktail);
          return (
            <div key={item.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/cocktail/${cocktail.id}`} className="min-w-0 flex-1">
                  <div className="truncate text-base text-text">{cocktail.name}</div>
                  <div className="mt-1">
                    <span
                      className={clsx(
                        "inline-block rounded-full border px-2 py-0.5 text-[11px]",
                        AVAIL_STYLE[avail.tier],
                      )}
                    >
                      {availLabel[avail.tier]}
                    </span>
                  </div>
                </Link>
                <div className="shrink-0">
                  <Stepper
                    value={item.servings}
                    onChange={(v) => bumpServings(item.id, v - item.servings)}
                    min={1}
                    max={99}
                  />
                </div>
              </div>
            </div>
          );
        })}
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
        onClick={addAllToShopping}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gold px-4 py-3 text-center font-bold text-gold"
      >
        <ShoppingCart size={18} /> Додати все в покупки
      </button>

      <button
        onClick={() => nav("/set/make")}
        className="mt-2 block w-full rounded-xl bg-gold px-4 py-3 text-center font-bold text-bg"
      >
        {t.sets.start}
      </button>
    </div>
  );
}
