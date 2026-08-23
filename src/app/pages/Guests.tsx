import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Copy, Share2 } from "lucide-react";
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
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shared = params.get("m");
  const list: Cocktail[] = useMemo(() => {
    if (shared) {
      const ids = new Set(shared.split("~").filter(Boolean));
      return all.filter((c) => ids.has(c.id));
    }
    return whatCanIMake(all, owned, flexible).makeable.map((m) => m.cocktail);
  }, [shared, all, owned, flexible]);

  /** The menu link carries the drink ids, so a guest needs no account and no app data. */
  const menuUrl = () =>
    `${window.location.origin}${import.meta.env.BASE_URL}guests?m=${list.map((c) => c.id).join("~")}`;

  const share = () => {
    const url = menuUrl();
    setLink(url);
    setCopied(false);
    void shareLink("Що будемо пити?", url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link ?? menuUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the link is on screen to copy by hand */
    }
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
      </div>

      {!shared && list.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-4">
          <button
            onClick={share}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 font-bold text-bg"
          >
            <Share2 size={18} /> Поділитися меню з гостями
          </button>
          <p className="mt-2 text-xs text-text-faint">
            Гостям не треба ні заходити в акаунт, ні щось встановлювати — меню зашите просто в посилання. Це знімок:
            якщо зміниш бар, надішли нове.
          </p>
          {link && (
            <div className="mt-3 flex gap-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-xl border border-border bg-surface-alt px-3 py-2 text-xs text-text-dim outline-none"
              />
              <button
                onClick={copy}
                aria-label="Скопіювати"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-text-dim hover:text-gold"
              >
                {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              </button>
            </div>
          )}
        </div>
      )}

      {shared && <p className="mt-3 text-xs text-text-faint">Меню від господаря — вибирай, що наливати 🍸</p>}

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
