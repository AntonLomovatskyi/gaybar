import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Sparkles, Square } from "lucide-react";
import clsx from "clsx";
import type { Cocktail } from "@/types/cocktail";
import { askAboutCocktail, MissingKeyError, type ChatTurn } from "@/lib/ai";
import { useUserStore } from "@/store/userStore";

/** Starter questions — the point is that answers are grounded in the recipe AND your bar. */
const SUGGESTIONS = [
  "Чим замінити те, чого бракує?",
  "Як зробити його менш міцним?",
  "Що подати до нього?",
  "Як не зіпсувати цей коктейль?",
];

export function AskClaude({ cocktail }: { cocktail: Cocktail }) {
  const apiKey = useUserStore((s) => s.anthropicApiKey);
  const model = useUserStore((s) => s.aiModel);
  const owned = useUserStore((s) => s.ownedIngredients);
  const flexible = useUserStore((s) => s.flexibleMatching);

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setError(null);
    setDraft("");
    setBusy(true);
    setStreaming("");
    const history = turns;
    setTurns([...history, { role: "user", text: q }]);
    abort.current = new AbortController();
    try {
      const answer = await askAboutCocktail({
        cocktail,
        owned,
        flexible,
        question: q,
        history,
        apiKey,
        model,
        onDelta: (d) => setStreaming((s) => s + d),
        signal: abort.current.signal,
      });
      setTurns((t) => [...t, { role: "assistant", text: answer }]);
    } catch (e) {
      if (e instanceof MissingKeyError) setError(e.message);
      else if ((e as Error)?.name === "AbortError") setError(null);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStreaming("");
      setBusy(false);
      abort.current = null;
    }
  };

  if (!apiKey) {
    return (
      <section className="mt-6">
        <h2 className="flex items-center gap-1.5 font-bold text-gold">
          <Sparkles size={16} /> Запитати про коктейль
        </h2>
        <p className="mt-2 rounded-xl border border-border bg-surface p-4 text-sm text-text-dim">
          Додай свій Anthropic API-ключ у{" "}
          <Link to="/settings" className="text-gold underline">
            налаштуваннях
          </Link>
          , щоб питати про цей коктейль — з урахуванням рецепта і твого бару.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <h2 className="flex items-center gap-1.5 font-bold text-gold">
        <Sparkles size={16} /> Запитати про коктейль
      </h2>

      {turns.length === 0 && !busy && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-text-dim hover:border-gold/60 hover:text-gold"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {(turns.length > 0 || streaming) && (
        <div className="mt-3 space-y-2">
          {turns.map((t, i) => (
            <div
              key={i}
              className={clsx(
                "rounded-xl border p-3 text-sm whitespace-pre-wrap",
                t.role === "user" ? "border-gold/40 bg-gold/10 text-text" : "border-border bg-surface text-text",
              )}
            >
              {t.text}
            </div>
          ))}
          {streaming && (
            <div className="rounded-xl border border-border bg-surface p-3 text-sm whitespace-pre-wrap text-text">
              {streaming}
            </div>
          )}
          {busy && !streaming && <div className="px-1 text-sm text-text-faint">Думає…</div>}
        </div>
      )}

      {error && (
        <div className="mt-2 rounded-xl border border-danger/50 bg-danger/10 p-3 text-sm text-danger">{error}</div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(draft);
            }
          }}
          placeholder="Запитай про заміни, пропорції, подачу…"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface-alt px-4 py-2.5 text-text outline-none placeholder:text-text-faint focus:border-gold"
        />
        {busy ? (
          <button
            onClick={() => abort.current?.abort()}
            aria-label="Зупинити"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-text-dim hover:text-danger"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            onClick={() => ask(draft)}
            disabled={!draft.trim()}
            aria-label="Запитати"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold text-bg disabled:opacity-40"
          >
            <Send size={17} />
          </button>
        )}
      </div>
    </section>
  );
}
