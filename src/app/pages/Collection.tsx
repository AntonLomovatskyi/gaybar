import { ArrowDownUp, ChevronLeft, ChevronRight, GlassWater, Shuffle, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Chip } from "@/components/Chip";
import { CocktailCard } from "@/components/CocktailCard";
import { MOODS, type Mood } from "@/data/catalog/moods";
import { useFilteredCocktails } from "@/data/useFilteredCocktails";
import { useRandomWalk } from "@/data/useRandomWalk";
import { type SortMode } from "@/domain/cocktails";
import { recommendForYou } from "@/domain/recommend";
import { useT } from "@/i18n";
import { useFilterStore, type DrinkKindFilter, type StrengthFilter, type TastedFilter } from "@/store/filterStore";
import { useUserStore } from "@/store/userStore";

const SORTS: SortMode[] = ["card", "name", "strength", "ingredients", "rating"];
const STRENGTH_CHIPS: { key: Exclude<StrengthFilter, "all" | "medium">; label: string }[] = [
  { key: "light", label: "🪶 Легкі" },
  { key: "strong", label: "🔥 Міцні" },
  { key: "zero", label: "0%" },
];
const KIND_NEXT: Record<DrinkKindFilter, DrinkKindFilter> = { all: "cocktails", cocktails: "shots", shots: "all" };
const KIND_LABEL: Record<DrinkKindFilter, string> = {
  all: "🍸 Коктейлі й шоти",
  cocktails: "🍸 Без шотів",
  shots: "🥃 Лише шоти",
};
const TASTED_NEXT: Record<TastedFilter, TastedFilter> = { all: "untried", untried: "tried", tried: "all" };
const TASTED_LABEL: Record<TastedFilter, string> = {
  all: "🥂 Дегустація",
  untried: "🆕 Не куштував",
  tried: "★ Куштував",
};

export default function Collection() {
  const t = useT();
  const nav = useNavigate();
  const filtered = useFilteredCocktails();
  const { all, list, isHome, filterCount } = filtered;
  const walk = useRandomWalk(filtered);
  const {
    tags,
    sort,
    query,
    onlyMakeable,
    onlyEasy,
    strength,
    tasted,
    kind,
    setTags,
    setSort,
    setQuery,
    setOnlyMakeable,
    setOnlyEasy,
    setStrength,
    setTasted,
    setKind,
  } = useFilterStore();
  const favourites = useUserStore((s) => s.favourites);
  const ratings = useUserStore((s) => s.ratings);
  const prefs = useUserStore((s) => s.prefs);
  const recentlyViewed = useUserStore((s) => s.recentlyViewed);

  const recent = useMemo(
    () => recentlyViewed.map((id) => all.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c),
    [recentlyViewed, all],
  );
  const recs = useMemo(
    () => recommendForYou(all, { favourites, ratings, likedTags: prefs.likedTags, dislikedTags: prefs.dislikedTags }),
    [all, favourites, ratings, prefs],
  );

  const cycleSort = () => setSort(SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length]);
  /** Open a pick and stay in the walk — the recipe page carries its own ‹ › from here. */
  const openWalk = (step: number) => {
    const c = walk.at(step);
    if (!c) return;
    walk.setStep(step);
    nav(`/cocktail/${c.id}?rnd=${step}`);
  };
  // "Здивуй мене" jumps somewhere unrelated in the same filtered walk.
  const surprise = () => openWalk(walk.step + 1 + Math.floor(Math.random() * Math.max(1, walk.poolSize - 1)));
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
          onClick={() => setOnlyMakeable(!onlyMakeable)}
          className={clsx(
            "flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm",
            onlyMakeable ? "border-gold bg-gold/15 text-gold" : "border-border text-text-dim",
          )}
        >
          <GlassWater size={15} /> Можу зараз
        </button>
        <button
          onClick={() => setOnlyEasy(!onlyEasy)}
          className={clsx(
            "flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm",
            onlyEasy ? "border-gold bg-gold/15 text-gold" : "border-border text-text-dim",
          )}
        >
          ⚡ Прості
        </button>
        <button
          onClick={() => setKind(KIND_NEXT[kind])}
          className={clsx(
            "rounded-full border px-3 py-1.5 text-sm",
            kind !== "all" ? "border-gold bg-gold/15 text-gold" : "border-border text-text-dim",
          )}
        >
          {KIND_LABEL[kind]}
        </button>
        {STRENGTH_CHIPS.map((sc) => (
          <button
            key={sc.key}
            onClick={() => setStrength(strength === sc.key ? "all" : sc.key)}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-sm",
              strength === sc.key ? "border-gold bg-gold/15 text-gold" : "border-border text-text-dim",
            )}
          >
            {sc.label}
          </button>
        ))}
        <button
          onClick={() => setTasted(TASTED_NEXT[tasted])}
          className={clsx(
            "rounded-full border px-3 py-1.5 text-sm",
            tasted !== "all" ? "border-gold bg-gold/15 text-gold" : "border-border text-text-dim",
          )}
        >
          {TASTED_LABEL[tasted]}
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

      {walk.pick && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-gold bg-surface p-3">
          <button
            onClick={() => walk.setStep(walk.step - 1)}
            aria-label="Попередній"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-text-dim hover:border-gold/60 hover:text-gold"
          >
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => openWalk(walk.step)} className="min-w-0 flex-1 text-left">
            <div className="text-[13px] font-bold text-gold">
              🍸 {isHome ? t.home.cocktailOfDay : "Випадковий з відфільтрованих"}
              <span className="ml-1 font-normal text-text-faint">
                {!isHome && `· з ${list.length}`}
                {walk.step !== 0 && " · ще варіант"}
              </span>
            </div>
            <div className="mt-0.5 truncate text-base text-text">{walk.pick.name}</div>
          </button>
          <button
            onClick={() => walk.setStep(walk.step + 1)}
            aria-label="Наступний"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-text-dim hover:border-gold/60 hover:text-gold"
          >
            <ChevronRight size={18} />
          </button>
        </div>
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

      {isHome && recent.length > 0 && (
        <div className="mt-4">
          <div className="px-4 text-sm font-bold text-gold">🕘 Нещодавно переглянуті</div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-4">
            {recent.map((r) => (
              <div key={r.id} className="w-28 shrink-0">
                <CocktailCard cocktail={r} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3 text-xs text-text-faint">
        {list.length} {kind === "shots" ? "шотів" : "коктейлів"}
      </div>
      <div className="grid gap-2 px-4 [grid-template-columns:repeat(auto-fill,minmax(108px,1fr))]">
        {list.map((c) => (
          <CocktailCard key={c.id} cocktail={c} />
        ))}
      </div>
      {list.length === 0 && <div className="py-16 text-center text-text-dim">{t.common.none}</div>}
    </div>
  );
}
