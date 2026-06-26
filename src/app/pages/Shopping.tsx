import { Check } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Stepper } from "@/components/Stepper";
import { useAllCocktails } from "@/data/useCocktails";
import { formatQty } from "@/domain/cocktails";
import { buildShoppingList, type ShoppingSelection } from "@/domain/shopping";
import { useT } from "@/i18n";
import { useUserStore } from "@/store/userStore";

export default function Shopping() {
  const t = useT();
  const all = useAllCocktails();
  const shopping = useUserStore((s) => s.shopping);
  const setShoppingServings = useUserStore((s) => s.setShoppingServings);
  const ownedIngredients = useUserStore((s) => s.ownedIngredients);
  const bought = useUserStore((s) => s.boughtIngredients);
  const toggleBought = useUserStore((s) => s.toggleBought);
  const clearBought = useUserStore((s) => s.clearBought);
  const units = useUserStore((s) => s.units);

  const selected = useMemo(
    () => all.filter((c) => (shopping[c.id] ?? 0) > 0).sort((a, b) => a.cardNumber - b.cardNumber),
    [all, shopping],
  );

  // buildShoppingList already subtracts what's in your bar, so the list is only what you still need.
  const lines = useMemo(() => {
    const selections: ShoppingSelection[] = selected.map((c) => ({ cocktail: c, servings: shopping[c.id] ?? 0 }));
    return buildShoppingList(selections, ownedIngredients);
  }, [selected, shopping, ownedIngredients]);

  const boughtSet = useMemo(() => new Set(bought), [bought]);
  const sortedLines = useMemo(
    () => [...lines].sort((a, b) => (boughtSet.has(a.name) ? 1 : 0) - (boughtSet.has(b.name) ? 1 : 0)),
    [lines, boughtSet],
  );
  const boughtCount = lines.filter((l) => boughtSet.has(l.name)).length;

  if (selected.length === 0) {
    return <div className="px-6 py-16 text-center text-text-dim">{t.shopping.empty}</div>;
  }

  return (
    <div className="px-4 py-4">
      <div className="space-y-2">
        {selected.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <Link to={`/cocktail/${c.id}`} className="min-w-0 flex-1 truncate text-text">
              {c.name}
            </Link>
            <Stepper value={shopping[c.id] ?? 0} onChange={(v) => setShoppingServings(c.id, v)} min={0} max={99} />
          </div>
        ))}
      </div>

      <div className="mt-7 mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-gold">
          {t.shopping.needed} ({lines.length})
        </span>
        {boughtCount > 0 && (
          <button onClick={clearBought} className="text-xs text-text-faint hover:text-gold">
            Скинути куплене ({boughtCount})
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface">
        {sortedLines.length === 0 ? (
          <div className="p-4 text-center text-text-dim">{t.common.none}</div>
        ) : (
          sortedLines.map((line, i) => {
            const isBought = boughtSet.has(line.name);
            return (
              <button
                key={line.name}
                type="button"
                onClick={() => toggleBought(line.name)}
                className={
                  "flex w-full items-center gap-3 px-4 py-3 text-left" + (i > 0 ? " border-t border-border" : "")
                }
              >
                <span
                  className={
                    "grid h-5 w-5 shrink-0 place-items-center rounded border " +
                    (isBought ? "border-gold bg-gold text-bg" : "border-border")
                  }
                >
                  {isBought && <Check size={13} strokeWidth={3} />}
                </span>
                <span className={"min-w-0 flex-1 " + (isBought ? "text-text-faint line-through" : "text-text")}>
                  {line.name}
                </span>
                <span className={"shrink-0 tabular-nums " + (isBought ? "text-text-faint" : "text-text-dim")}>
                  {line.mixedUnits ? "—" : formatQty(line.amount, line.unit, units)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
