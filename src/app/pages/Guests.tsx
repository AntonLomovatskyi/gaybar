import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Copy, Share2 } from "lucide-react";
import { getCardImages } from "@/data/cocktails";
import { useAllCocktails } from "@/data/useCocktails";
import { estimateStrength, formatIngredient } from "@/domain/cocktails";
import { whatCanIMake } from "@/domain/inventory";
import { firebaseEnabled } from "@/lib/firebase";
import { fetchMenu, MenuError, newMenuId, publishMenu } from "@/lib/menu";
import { shareLink } from "@/lib/share";
import { useAuthStore } from "@/lib/sync";
import { useUserStore } from "@/store/userStore";
import type { Cocktail } from "@/types/cocktail";

/**
 * A menu for guests: only what the bar can actually pour right now, no editing anywhere.
 * Hand over the phone, or hit share.
 *
 * Two link shapes:
 * - `?id=xxxx` — short and live. The drink ids live in a public `menus/{id}` Firestore doc;
 *   re-sharing overwrites it, so a link you already sent shows the current bar. Preferred.
 * - `?m=id~id~…` — the whole menu baked into the URL. No account, no network, but it grows
 *   past 2 KB on a full bar. Kept as the fallback when the cloud isn't available.
 */
export default function Guests() {
  const all = useAllCocktails();
  const owned = useUserStore((s) => s.ownedIngredients);
  const flexible = useUserStore((s) => s.flexibleMatching);
  const guestMenuId = useUserStore((s) => s.guestMenuId);
  const setGuestMenuId = useUserStore((s) => s.setGuestMenuId);
  const signedIn = Boolean(useAuthStore((s) => s.user));
  const [params] = useSearchParams();
  const [open, setOpen] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sharedIds = params.get("m");
  const sharedMenu = params.get("id");
  const isGuest = Boolean(sharedIds || sharedMenu);

  // A `?id=` link resolves through Firestore; until it lands we know nothing about the menu.
  const [remote, setRemote] = useState<{ ids: string[]; state: "loading" | "ok" | "missing" }>({
    ids: [],
    state: sharedMenu ? "loading" : "ok",
  });

  useEffect(() => {
    if (!sharedMenu) return;
    let alive = true;
    setRemote({ ids: [], state: "loading" });
    fetchMenu(sharedMenu)
      .then((m) => alive && setRemote(m ? { ids: m.ids, state: "ok" } : { ids: [], state: "missing" }))
      .catch(() => alive && setRemote({ ids: [], state: "missing" }));
    return () => {
      alive = false;
    };
  }, [sharedMenu]);

  const list: Cocktail[] = useMemo(() => {
    if (sharedMenu) {
      const ids = new Set(remote.ids);
      return all.filter((c) => ids.has(c.id));
    }
    if (sharedIds) {
      const ids = new Set(sharedIds.split("~").filter(Boolean));
      return all.filter((c) => ids.has(c.id));
    }
    return whatCanIMake(all, owned, flexible).makeable.map((m) => m.cocktail);
  }, [sharedMenu, remote.ids, sharedIds, all, owned, flexible]);

  const baseUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}guests`;
  const longUrl = () => `${baseUrl()}?m=${list.map((c) => c.id).join("~")}`;

  /**
   * Publish to the cloud for a short link; fall back to the self-contained long one if the
   * cloud isn't set up, we're signed out, or the write is refused.
   */
  const share = async () => {
    setBusy(true);
    setCopied(false);
    setError(null);
    let url = longUrl();
    if (firebaseEnabled && signedIn) {
      const id = guestMenuId || newMenuId();
      try {
        await publishMenu(
          id,
          list.map((c) => c.id),
          "Що будемо пити?",
        );
        setGuestMenuId(id);
        url = `${baseUrl()}?id=${id}`;
      } catch (e) {
        setError(e instanceof MenuError ? e.message : "Не вдалося опублікувати — надсилаю довге посилання.");
      }
    } else if (firebaseEnabled) {
      setError("Увійди через Google у Налаштуваннях, щоб отримати коротке посилання.");
    }
    setBusy(false);
    setLink(url);
    void shareLink("Що будемо пити?", url);
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the link is on screen to copy by hand */
    }
  };

  const isShort = Boolean(link && link.includes("?id="));

  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-text">Що будемо пити?</h1>
          <p className="mt-1 text-sm text-text-faint">
            {remote.state === "loading"
              ? "Завантажую меню…"
              : remote.state === "missing"
                ? "Меню не знайдено — попроси господаря надіслати посилання ще раз"
                : list.length
                  ? `${list.length} коктейлів, які можна зробити просто зараз`
                  : isGuest
                    ? "У цьому меню поки порожньо"
                    : "Зараз нічого не виходить — додай інгредієнти в «Мій бар»"}
          </p>
        </div>
      </div>

      {!isGuest && list.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-4">
          <button
            onClick={share}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 font-bold text-bg disabled:opacity-60"
          >
            <Share2 size={18} /> {busy ? "Публікую…" : "Поділитися меню з гостями"}
          </button>
          <p className="mt-2 text-xs text-text-faint">
            {firebaseEnabled && signedIn
              ? "Гостям не треба ні акаунта, ні застосунку. Посилання коротке й завжди те саме — зміниш бар, натисни ще раз, і в гостей оновиться."
              : "Гостям не треба ні акаунта, ні застосунку — меню зашите просто в посилання (тому воно довге)."}
          </p>
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          {link && (
            <>
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
              {!isShort && <p className="mt-1 text-xs text-text-faint">{link.length} символів</p>}
            </>
          )}
        </div>
      )}

      {isGuest && remote.state === "ok" && list.length > 0 && (
        <p className="mt-3 text-xs text-text-faint">Меню від господаря — вибирай, що наливати 🍸</p>
      )}

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
