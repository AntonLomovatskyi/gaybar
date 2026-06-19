import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
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

  const nameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of all) map[c.id] = c.name;
    return map;
  }, [all]);

  const onClear = () => {
    if (window.confirm("Очистити історію?")) clearHistory();
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-text">Історія приготувань</h1>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm text-danger"
          >
            <Trash2 size={15} /> Очистити історію
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-16 text-center text-text-dim">Історія порожня</div>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
