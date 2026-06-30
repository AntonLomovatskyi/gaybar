import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { useAllCocktails } from "@/data/useCocktails";
import { useUserStore } from "@/store/userStore";

function formatWhen(at: number): string {
  const d = new Date(at);
  return `${d.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}, ${d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function History() {
  const all = useAllCocktails();
  const history = useUserStore((s) => s.history);
  const clearHistory = useUserStore((s) => s.clearHistory);
  const setPrepNote = useUserStore((s) => s.setPrepNote);
  const setPrepRating = useUserStore((s) => s.setPrepRating);

  const nameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of all) map[c.id] = c.name;
    return map;
  }, [all]);

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

      {history.length === 0 ? (
        <div className="py-16 text-center text-text-dim">
          Журнал порожній. Натисни «Я зробив» на коктейлі — і запис зʼявиться тут.
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {history.map((entry, i) => {
            const name = nameById[entry.cocktailId];
            return (
              <div
                key={`${entry.cocktailId}-${entry.at}-${i}`}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  {name ? (
                    <Link to={`/cocktail/${entry.cocktailId}`} className="text-base font-bold text-text">
                      {name}
                    </Link>
                  ) : (
                    <span className="text-base font-bold text-text-dim">{entry.cocktailId}</span>
                  )}
                  <StarRating value={entry.rating ?? 0} onChange={(n) => setPrepRating(entry.at, n)} size={18} />
                </div>
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
    </div>
  );
}
