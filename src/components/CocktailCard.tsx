import { Link } from "react-router-dom";
import { getCardImages } from "@/data/cocktails";
import type { Cocktail } from "@/types/cocktail";

export function CocktailCard({ cocktail }: { cocktail: Cocktail }) {
  const front = getCardImages(cocktail.id)?.front;
  return (
    <Link
      to={`/cocktail/${cocktail.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-surface transition hover:border-gold"
    >
      <div className="aspect-[5/7] w-full overflow-hidden bg-surface-alt">
        {front ? (
          <img
            src={front}
            alt={cocktail.name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-2 text-center">
            <span className="font-display text-sm leading-tight text-gold">{cocktail.name}</span>
          </div>
        )}
      </div>
      <div className="p-2">
        <div className="truncate text-sm font-semibold text-text">{cocktail.name}</div>
        <div className="truncate text-xs text-text-faint">{cocktail.tags.slice(0, 2).join(" · ")}</div>
      </div>
    </Link>
  );
}
