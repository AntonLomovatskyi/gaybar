import { Users } from "lucide-react";
import { useMemo, useState } from "react";
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
  const units = useUserStore((s) => s.units);
  const [people, setPeople] = useState(1);

  const selected = useMemo(
    () => all.filter((c) => (shopping[c.id] ?? 0) > 0).sort((a, b) => a.cardNumber - b.cardNumber),
    [all, shopping],
  );

  const lines = useMemo(() => {
    const selections: ShoppingSelection[] = selected.map((c) => ({
      cocktail: c,
      servings: (shopping[c.id] ?? 0) * people,
    }));
    return buildShoppingList(selections, ownedIngredients);
  }, [selected, shopping, people, ownedIngredients]);

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 text-text">
          <Users size={18} className="text-gold" />
          <span className="font-bold">{t.shopping.people}</span>
        </div>
        <Stepper value={people} onChange={setPeople} min={1} max={50} />
      </div>

      {selected.length === 0 ? (
        <div className="px-6 py-16 text-center text-text-dim">{t.shopping.empty}</div>
      ) : (
        <>
          <div className="mt-5 space-y-2">
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

          <div className="mt-7 mb-2 text-sm font-bold text-gold">{t.shopping.needed}</div>
          <div className="rounded-xl border border-border bg-surface">
            {lines.length === 0 ? (
              <div className="p-4 text-center text-text-dim">{t.common.none}</div>
            ) : (
              lines.map((line, i) => (
                <div
                  key={line.name}
                  className={
                    "flex items-baseline justify-between gap-3 px-4 py-3" + (i > 0 ? " border-t border-border" : "")
                  }
                >
                  <span className="min-w-0 flex-1 text-text">{line.name}</span>
                  <span className="shrink-0 text-text-dim tabular-nums">
                    {line.mixedUnits ? "—" : formatQty(line.amount, line.unit, units)}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
