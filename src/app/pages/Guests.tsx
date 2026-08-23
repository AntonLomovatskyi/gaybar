import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Share2 } from "lucide-react";
import { getCardImages } from "@/data/cocktails";
import { useAllCocktails } from "@/data/useCocktails";
import { estimateStrength, formatIngredient } from "@/domain/cocktails";
import { whatCanIMake } from "@/domain/inventory";
import { shareLink } from "@/lib/share";
import { useUserStore } from "@/store/userStore";
import type { Cocktail } from "@/types/cocktail";

/**
 * A menu for guests: only what the bar can actually pour right now, no editing anywhere.
 * Hand over the phone, or hit share — the link carries the drink ids so guests can browse
 * the same menu on their own device.
 */
export default function Guests() {
  const all = useAllCocktails();
  const owned = useUserStore((s) => s.ownedIngredients);
  const flexible = useUserStore((s) => s.flexibleMatching);
  const [params] = useSearchParams();
  const [open, setOpen] = useState<string | null>(null);

  const shared = params.get("m");
  const list: Cocktail[] = useMemo(() => {
    if (shared) {
      const ids = new Set(shared.split("~").filter(Boolean));
      return all.filter((c) => ids.has(c.id));
    }
    return whatCanIMake(all, owned, flexible).makeable.map((m) => m.cocktail);
  }, [shared, all, owned, flexible]);

  const share = () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}guests?m=${list.map((c) => c.id).join("~")}`;
    shareLink("Що будемо пити?", url);
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-text">Що будемо пити?</h1>
          <p className="mt-1 text-sm text-text-faint">
            {list.length
              ? `${list.length} коктейлів, які можна зробити просто зараз`
              : "Зараз нічого не виходить — додай інгредієнти в «Мій бар»"}
          </p>
        </div>
        {!shared && list.length > 0 && (
          <button
            onClick={share}
            aria-label="Поділитися меню"
            className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-text-dim hover:text-gold"
          >
            <Share2 size={17} />
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
        {list.map((c) => {
          const img = getCardImages(c.id)?.front;
          const abv = estimateStrength(c).abv;
          const isOpen = open === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setOpen(isOpen ? null : c.id)}
              className="overflow-hidden rounded-xl border border-border bg-surface text-left transition hover:border-gold"
            >
              <div className="aspect-[4/5] w-full overflow-hidden bg-surface-alt">
                {img ? (
                  <img src={img} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-3 text-center">
                    <span className="font-display text-base leading-tight text-gold">{c.name}</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="font-bold text-text">{c.name}</div>
                <div className="mt-0.5 text-xs text-text-faint">
                  {abv > 0 ? `≈ ${abv}%` : "без алкоголю"}
                  {c.glass ? ` · ${c.glass}` : ""}
                </div>
                {isOpen && (
                  <ul className="mt-2 space-y-0.5 border-t border-border pt-2 text-xs text-text-dim">
                    {c.ingredients.map((i, n) => (
                      <li key={n}>• {formatIngredient(i)}</li>
                    ))}
                  </ul>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
