import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAllCocktails } from "@/data/useCocktails";
import { baseSpiritOf } from "@/domain/cocktails";
import { suggestPurchases } from "@/domain/inventory";
import { useUserStore } from "@/store/userStore";

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-center">
      <div className="text-2xl font-bold text-gold tabular-nums">{n}</div>
      <div className="mt-0.5 text-xs text-text-dim">{label}</div>
    </div>
  );
}

export default function Stats() {
  const all = useAllCocktails();
  const history = useUserStore((s) => s.history);
  const owned = useUserStore((s) => s.ownedIngredients);
  const flexible = useUserStore((s) => s.flexibleMatching);

  const byId = useMemo(() => Object.fromEntries(all.map((c) => [c.id, c])), [all]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const madeThisMonth = history.filter((h) => h.at >= monthStart).length;

    const counts = new Map<string, number>();
    for (const h of history) counts.set(h.cocktailId, (counts.get(h.cocktailId) ?? 0) + 1);
    const mostMade = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, n]) => ({ cocktail: byId[id], n }))
      .filter((x) => x.cocktail);

    const baseCounts = new Map<string, number>();
    for (const h of history) {
      const c = byId[h.cocktailId];
      const b = c && baseSpiritOf(c);
      if (b) baseCounts.set(b, (baseCounts.get(b) ?? 0) + 1);
    }
    const topBases = [...baseCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    const best = suggestPurchases(all, owned, flexible)[0];
    return { total: history.length, distinct: counts.size, madeThisMonth, mostMade, topBases, best };
  }, [history, byId, all, owned, flexible]);

  return (
    <div className="px-4 py-4">
      <h1 className="font-display text-2xl text-text">Статистика</h1>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat n={stats.total} label="Зроблено" />
        <Stat n={stats.distinct} label="Різних" />
        <Stat n={stats.madeThisMonth} label="Цей місяць" />
      </div>

      {stats.mostMade.length > 0 && (
        <section className="mt-7">
          <h2 className="font-bold text-gold">Найчастіше готуєш</h2>
          <div className="mt-3 space-y-2">
            {stats.mostMade.map(({ cocktail, n }) => (
              <Link
                key={cocktail.id}
                to={`/cocktail/${cocktail.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
              >
                <span className="text-text">{cocktail.name}</span>
                <span className="rounded-full bg-gold/15 px-2.5 py-1 text-sm font-bold text-gold">{n}×</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {stats.topBases.length > 0 && (
        <section className="mt-7">
          <h2 className="font-bold text-gold">Улюблені основи</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.topBases.map(([base, n]) => (
              <span
                key={base}
                className="rounded-full border border-border bg-surface-alt px-3 py-1.5 text-sm text-text"
              >
                {base} · {n}
              </span>
            ))}
          </div>
        </section>
      )}

      {stats.best && (
        <section className="mt-7">
          <h2 className="font-bold text-gold">Що варто купити</h2>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <span className="text-text">{stats.best.name}</span>
            <span className="rounded-full bg-gold/15 px-2.5 py-1 text-sm font-bold text-gold">
              +{stats.best.cocktails.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-text-faint">Відкриє {stats.best.cocktails.length} нових коктейлів</p>
        </section>
      )}

      {stats.total === 0 && (
        <div className="mt-8 text-center text-text-dim">Почни готувати — і тут зʼявиться статистика 🍸</div>
      )}
    </div>
  );
}
