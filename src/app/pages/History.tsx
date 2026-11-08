import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowDownUp, Trash2 } from "lucide-react";
import clsx from "clsx";
import { StarRating } from "@/components/StarRating";
import { getCardImages } from "@/data/cocktails";
import { useAllCocktails } from "@/data/useCocktails";
import { cookedCocktails, filterByRating, sortCooked, type CookedSort, type RatingFilter } from "@/domain/journal";
import { useFilterStore } from "@/store/filterStore";
import { useUserStore } from "@/store/userStore";

function formatWhen(at: number): string {
  const d = new Date(at);
  return `${d.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}, ${d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatDay(at: number): string {
  return new Date(at).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
}

/** 1 раз, 2 рази, 5 разів. */
function times(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} раз`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} рази`;
  return `${n} разів`;
}

const RATING_CHIPS: { key: RatingFilter; label: string }[] = [
  { key: "all", label: "Усі" },
  { key: 5, label: "★★★★★" },
  { key: 4, label: "★★★★" },
  { key: 3, label: "★★★" },
  { key: 2, label: "★★" },
  { key: 1, label: "★" },
  { key: "unrated", label: "Без оцінки" },
];
const SORTS: { key: CookedSort; label: string }[] = [
  { key: "recent", label: "Нещодавні" },
  { key: "rating", label: "За оцінкою" },
  { key: "times", label: "Найчастіше" },
];

export default function History() {
  const all = useAllCocktails();
  const history = useUserStore((s) => s.history);
  const ratings = useUserStore((s) => s.ratings);
  const setRating = useUserStore((s) => s.setRating);
  const clearHistory = useUserStore((s) => s.clearHistory);
  const setPrepNote = useUserStore((s) => s.setPrepNote);
  const view = useFilterStore((s) => s.journalView);
  const setView = useFilterStore((s) => s.setJournalView);
  const rating = useFilterStore((s) => s.journalRating);
  const setRatingFilter = useFilterStore((s) => s.setJournalRating);
  const sort = useFilterStore((s) => s.journalSort);
  const setSort = useFilterStore((s) => s.setJournalSort);

  const nameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of all) map[c.id] = c.name;
    return map;
  }, [all]);

  // Everything you've made, one row per cocktail, with the rating you gave the cocktail.
  const cooked = useMemo(() => cookedCocktails(all, history, ratings), [all, history, ratings]);
  const countFor = (key: RatingFilter) => filterByRating(cooked, key).length;
  const shown = useMemo(() => sortCooked(filterByRating(cooked, rating), sort), [cooked, rating, sort]);

  const onClear = () => {
    if (window.confirm("Очистити журнал?")) clearHistory();
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-text">Журнал дегустацій</h1>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm text-danger"
          >
            <Trash2 size={15} /> Очистити
          </button>
        )}
      </div>
      {history.length > 0 && (
        <p className="mt-1 text-sm text-text-faint">
          {history.length} приготувань · {cooked.length} різних
        </p>
      )}

      {history.length === 0 ? (
        <div className="py-16 text-center text-text-dim">
          Журнал порожній. Натисни «Я зробив» на коктейлі — і запис зʼявиться тут.
        </div>
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            {(
              [
                ["cooked", `Приготовані (${cooked.length})`],
                ["log", `Усі записи (${history.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={clsx(
                  "flex-1 rounded-full border px-3 py-1.5 text-sm transition",
                  view === key
                    ? "border-gold bg-gold/15 text-text"
                    : "border-border text-text-dim hover:border-gold/60",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {view === "cooked" ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {RATING_CHIPS.map(({ key, label }) => {
                  const n = countFor(key);
                  // Hide dead ends, but never the chip that's currently on.
                  if (n === 0 && key !== "all" && key !== rating) return null;
                  return (
                    <button
                      key={String(key)}
                      onClick={() => setRatingFilter(key)}
                      className={clsx(
                        "rounded-full border px-3 py-1.5 text-sm",
                        rating === key ? "border-gold bg-gold/15 text-gold" : "border-border text-text-dim",
                      )}
                    >
                      <span className={typeof key === "number" ? "text-gold" : undefined}>{label}</span>
                      <span className="ml-1 opacity-70">· {n}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => setSort(SORTS[(SORTS.findIndex((s) => s.key === sort) + 1) % SORTS.length].key)}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm text-text-dim"
                >
                  <ArrowDownUp size={15} /> {SORTS.find((s) => s.key === sort)?.label}
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {shown.map(({ cocktail, times: n, lastAt, rating: stars }) => {
                  const img = getCardImages(cocktail.id)?.front;
                  return (
                    <div
                      key={cocktail.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                    >
                      <Link
                        to={`/cocktail/${cocktail.id}`}
                        className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-alt"
                        aria-hidden
                        tabIndex={-1}
                      >
                        {img && <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/cocktail/${cocktail.id}`}
                          className="block truncate font-bold text-text hover:text-gold"
                        >
                          {cocktail.name}
                        </Link>
                        <div className="mt-0.5 text-xs text-text-faint">
                          {times(n)} · востаннє {formatDay(lastAt)}
                        </div>
                        <div className="mt-1.5">
                          <StarRating value={stars} onChange={(s) => setRating(cocktail.id, s)} size={18} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {shown.length === 0 && (
                <div className="py-12 text-center text-text-dim">
                  {rating === "unrated" ? "Усе приготоване вже оцінено 👌" : "З такою оцінкою нічого немає"}
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {history.map((entry, i) => {
                const name = nameById[entry.cocktailId];
                return (
                  <div
                    key={`${entry.cocktailId}-${entry.at}-${i}`}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    {name ? (
                      <Link to={`/cocktail/${entry.cocktailId}`} className="text-base font-bold text-text">
                        {name}
                      </Link>
                    ) : (
                      <span className="text-base font-bold text-text-dim">{entry.cocktailId}</span>
                    )}
                    <div className="mt-1 text-sm text-text-faint">{formatWhen(entry.at)}</div>
                    <textarea
                      defaultValue={entry.note ?? ""}
                      onBlur={(e) => setPrepNote(entry.at, e.target.value)}
                      placeholder="Як вийшло цього разу?"
                      rows={1}
                      className="mt-3 w-full resize-y rounded-xl border border-border bg-surface-alt px-3 py-2 text-sm text-text outline-none placeholder:text-text-faint focus:border-gold"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
