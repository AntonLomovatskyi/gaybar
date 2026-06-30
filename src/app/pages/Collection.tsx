import { ArrowDownUp, GlassWater, Shuffle, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Chip } from "@/components/Chip";
import { CocktailCard } from "@/components/CocktailCard";
import { MOODS, type Mood } from "@/data/catalog/moods";
import { useAllCocktails } from "@/data/useCocktails";
import { applyFilters, pickSurprise, sortBy, type SortMode } from "@/domain/cocktails";
import { whatCanIMake } from "@/domain/inventory";
import { recommendForYou } from "@/domain/recommend";
import { useT } from "@/i18n";
import { useFilterStore } from "@/store/filterStore";
import { useUserStore } from "@/store/userStore";

const SORTS: SortMode[] = ["card", "name", "strength", "ingredients", "rating"];
const easyCount = (c: { ingredients: { name: string }[] }) =>
  c.ingredients.filter((i) => !i.name.toLowerCase().includes("лід")).length;

export default function Collection() {
  const t = useT();
  const nav = useNavigate();
  const all = useAllCocktails();
  const [query, setQuery] = useState("");
  const { tags, glasses, sort, setTags, setSort } = useFilterStore();
  const favourites = useUserStore((s) => s.favourites);
  const ratings = useUserStore((s) => s.ratings);
  const prefs = useUserStore((s) => s.prefs);
  const ownedIngredients = useUserStore((s) => s.ownedIngredients);
  const flexibleMatching = useUserStore((s) => s.flexibleMatching);
  const [onlyMakeable, setOnlyMakeable] = useState(false);
  const [onlyEasy, setOnlyEasy] = useState(false);

  const makeableIds = useMemo(
    () => new Set(whatCanIMake(all, ownedIngredients, flexibleMatching).makeable.map((m) => m.cocktail.id)),
    [all, ownedIngredients, flexibleMatching],
  );
  const list = useMemo(() => {
    let base = applyFilters(all, { tags, glasses, query });
    if (onlyMakeable) base = base.filter((c) => makeableIds.has(c.id));
    if (onlyEasy) base = base.filter((c) => easyCount(c) <= 3);
    return sortBy(base, sort, ratings);
  }, [all, tags, glasses, query, sort, onlyMakeable, onlyEasy, makeableIds, ratings]);
  const filterCount = tags.length + glasses.length;
  const isHome = !query.trim() && filterCount === 0 && !onlyMakeable && !onlyEasy;
  // Cocktail of the day prefers ones you can make now (falls back to the whole catalog).
  const cotd = useMemo(() => {
    const makeablePool = all.filter((c) => makeableIds.has(c.id));
    const pool = makeablePool.length >= 5 ? makeablePool : all;
    return pickSurprise(pool, Math.floor(Date.now() / 86400000));
  }, [all, makeableIds]);
  const recs = useMemo(
    () => recommendForYou(all, { favourites, ratings, likedTags: prefs.likedTags, dislikedTags: prefs.dislikedTags }),
    [all, favourites, ratings, prefs],
  );

  const cycleSort = () => setSort(SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length]);
  const surprise = () => {
    const fromBar = ownedIngredients.length ? all.filter((c) => makeableIds.has(c.id)) : [];
    const pool = fromBar.length ? fromBar : list.length ? list : all;
    const p = pickSurprise(pool, Date.now());
    if (p) nav(`/cocktail/${p.id}`);
  };
  const toggleMood = (m: Mood) => {
    const active = m.tags.every((x) => tags.includes(x));
    setTags(active ? tags.filter((x) => !m.tags.includes(x)) : [...new Set([...tags, ...m.tags])]);
  };

  return (
    <div>
      <div className="px-4 pt-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.common.searchPlaceholder}
          className="w-full rounded-xl border border-border bg-surface-alt px-4 py-2.5 text-text outline-none placeholder:text-text-faint focus:border-gold"
        />
      </div>

      <div className="flex flex-wrap gap-2 px-4 pt-3">
        <button
          onClick={() => setOnlyMakeable((v) => !v)}
          className={clsx(
            "flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm",
            onlyMakeable ? "border-gold bg-gold/15 text-gold" : "border-border text-text-dim",
          )}
        >
          <GlassWater size={15} /> Можу зараз
        </button>
        <button
          onClick={() => setOnlyEasy((v) => !v)}
          className={clsx(
            "flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm",
            onlyEasy ? "border-gold bg-gold/15 text-gold" : "border-border text-text-dim",
          )}
        >
          ⚡ Прості
        </button>
        <button
          onClick={() => nav("/filters")}
          className={clsx(
            "flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm",
            filterCount ? "border-gold text-gold" : "border-border text-text-dim",
          )}
        >
          <SlidersHorizontal size={15} /> {t.common.filters}
          {filterCount ? ` (${filterCount})` : ""}
        </button>
        <button
          onClick={cycleSort}
          className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm text-text-dim"
        >
          <ArrowDownUp size={15} /> {t.sort[sort]}
        </button>
        <button
          onClick={surprise}
          className="flex items-center gap-1 rounded-full border border-gold px-3 py-1.5 text-sm text-gold"
        >
          <Shuffle size={15} /> {t.common.surprise}
        </button>
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
        {MOODS.map((m) => {
          const active = m.tags.every((x) => tags.includes(x));
          return <Chip key={m.key} label={`${m.emoji} ${m.labelUk}`} selected={active} onClick={() => toggleMood(m)} />;
        })}
      </div>

      {isHome && cotd && (
        <button
          onClick={() => nav(`/cocktail/${cotd.id}`)}
          className="mx-4 mt-4 block w-[calc(100%-2rem)] rounded-xl border border-gold bg-surface p-3 text-left"
        >
          <div className="text-[13px] font-bold text-gold">🍸 {t.home.cocktailOfDay}</div>
          <div className="mt-0.5 text-base text-text">{cotd.name}</div>
        </button>
      )}

      {isHome && recs.length > 0 && (
        <div className="mt-4">
          <div className="px-4 text-sm font-bold text-gold">✨ {t.home.forYou}</div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-4">
            {recs.slice(0, 12).map((r) => (
              <div key={r.id} className="w-28 shrink-0">
                <CocktailCard cocktail={r} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3 text-xs text-text-faint">{list.length} коктейлів</div>
      <div className="grid gap-2 px-4 [grid-template-columns:repeat(auto-fill,minmax(108px,1fr))]">
        {list.map((c) => (
          <CocktailCard key={c.id} cocktail={c} />
        ))}
      </div>
      {list.length === 0 && <div className="py-16 text-center text-text-dim">{t.common.none}</div>}
    </div>
  );
}
