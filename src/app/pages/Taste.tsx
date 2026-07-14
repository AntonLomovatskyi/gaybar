import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shuffle } from "lucide-react";
import clsx from "clsx";
import { StarRating } from "@/components/StarRating";
import { useAllCocktails } from "@/data/useCocktails";
import { pickSurprise } from "@/domain/cocktails";
import { whatCanIMake } from "@/domain/inventory";
import { useUserStore } from "@/store/userStore";

function SegBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex-1 rounded-full border px-3 py-1.5 text-sm transition",
        active ? "border-gold bg-gold/15 text-text" : "border-border text-text-dim hover:border-gold/60",
      )}
    >
      {label}
    </button>
  );
}

export default function Taste() {
  const all = useAllCocktails();
  const nav = useNavigate();
  const ratings = useUserStore((s) => s.ratings);
  const history = useUserStore((s) => s.history);
  const setRating = useUserStore((s) => s.setRating);
  const owned = useUserStore((s) => s.ownedIngredients);
  const flexible = useUserStore((s) => s.flexibleMatching);
  const [tab, setTab] = useState<"todo" | "done">("todo");

  // "Tried" = you've rated it or logged making it at least once.
  const triedIds = useMemo(() => {
    const s = new Set(history.map((h) => h.cocktailId));
    for (const [id, stars] of Object.entries(ratings)) if (stars > 0) s.add(id);
    return s;
  }, [history, ratings]);

  const done = useMemo(
    () =>
      all
        .filter((c) => triedIds.has(c.id))
        .sort((a, b) => (ratings[b.id] ?? 0) - (ratings[a.id] ?? 0) || a.name.localeCompare(b.name, "uk")),
    [all, triedIds, ratings],
  );
  const todo = useMemo(
    () => all.filter((c) => !triedIds.has(c.id)).sort((a, b) => a.name.localeCompare(b.name, "uk")),
    [all, triedIds],
  );
  const pct = all.length ? Math.round((done.length / all.length) * 100) : 0;

  const makeableIds = useMemo(
    () => new Set(whatCanIMake(all, owned, flexible).makeable.map((m) => m.cocktail.id)),
    [all, owned, flexible],
  );
  const trySomethingNew = () => {
    const fromBar = todo.filter((c) => makeableIds.has(c.id));
    const pick = pickSurprise(fromBar.length ? fromBar : todo, Date.now());
    if (pick) nav(`/cocktail/${pick.id}`);
  };

  const list = tab === "todo" ? todo : done;

  return (
    <div className="px-4 py-4">
      <h1 className="font-display text-2xl text-text">Дегустація</h1>
      <p className="mt-1 text-sm text-text-faint">
        Спробувано {done.length} із {all.length} · {pct}%
      </p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
        <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
      </div>

      {todo.length > 0 && (
        <button
          onClick={trySomethingNew}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 font-bold text-bg"
        >
          <Shuffle size={18} /> Спробувати щось нове
        </button>
      )}

      <div className="mt-4 flex gap-2">
        <SegBtn active={tab === "todo"} onClick={() => setTab("todo")} label={`Не пробував (${todo.length})`} />
        <SegBtn active={tab === "done"} onClick={() => setTab("done")} label={`Спробував (${done.length})`} />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {list.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3"
          >
            <Link to={`/cocktail/${c.id}`} className="min-w-0 flex-1 truncate text-text hover:text-gold">
              {c.name}
            </Link>
            <StarRating value={ratings[c.id] ?? 0} onChange={(n) => setRating(c.id, n)} size={18} />
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <div className="py-16 text-center text-text-dim">
          {tab === "todo" ? "Ти спробував усе! 🎉" : "Ще нічого не оцінено — постав зірки вище"}
        </div>
      )}
    </div>
  );
}
