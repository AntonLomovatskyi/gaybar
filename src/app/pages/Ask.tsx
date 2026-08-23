import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Send, Sparkles, Square } from "lucide-react";
import clsx from "clsx";
import { useAllCocktails } from "@/data/useCocktails";
import { askBartender, MissingKeyError, type ChatTurn } from "@/lib/ai";
import { useUserStore } from "@/store/userStore";

const SUGGESTIONS = [
  "Що я можу зробити прямо зараз?",
  "А що вийде, якщо куплю вишневий сік?",
  "Порадь щось освіжаюче з мого бару",
  "Чого мені найбільше бракує?",
];

export default function Ask() {
  const all = useAllCocktails();
  const apiKey = useUserStore((s) => s.anthropicApiKey);
  const model = useUserStore((s) => s.aiModel);
  const owned = useUserStore((s) => s.ownedIngredients);
  const flexible = useUserStore((s) => s.flexibleMatching);

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState("");
  const [searching, setSearching] = useState(false);
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
    setSearching(false);
    const history = turns;
    setTurns([...history, { role: "user", text: q }]);
    abort.current = new AbortController();
    try {
      const answer = await askBartender({
        all,
        owned,
        flexible,
        question: q,
        history,
        apiKey,
        model,
        onDelta: (d) => {
          setSearching(false);
          setStreaming((s) => s + d);
        },
        onSearching: () => setSearching(true),
        signal: abort.current.signal,
      });
      setTurns((t) => [...t, { role: "assistant", text: answer }]);
    } catch (e) {
      if (e instanceof MissingKeyError) setError(e.message);
      else if ((e as Error)?.name !== "AbortError") setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStreaming("");
      setSearching(false);
      setBusy(false);
      abort.current = null;
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col px-4 py-4">
      <h1 className="flex items-center gap-2 font-display text-2xl text-text">
        <Sparkles size={20} className="text-gold" /> Спитати бармена
      </h1>
      <p className="mt-1 text-sm text-text-faint">
        Знає весь твій бар ({owned.length} позицій) і може пошукати рецепти в інтернеті.
      </p>

      {!apiKey ? (
        <p className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-text-dim">
          Додай свій Anthropic API-ключ у{" "}
          <Link to="/settings" className="text-gold underline">
            налаштуваннях
          </Link>
          , щоб користуватися цим чатом.
        </p>
      ) : (
        <>
          {turns.length === 0 && !busy && (
            <div className="mt-4 flex flex-wrap gap-2">
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

          <div className="mt-4 flex-1 space-y-2">
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
            {busy && !streaming && (
              <div className="flex items-center gap-1.5 px-1 text-sm text-text-faint">
                {searching ? (
                  <>
                    <Globe size={14} /> Шукає в інтернеті…
                  </>
                ) : (
                  "Думає…"
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-2 rounded-xl border border-danger/50 bg-danger/10 p-3 text-sm text-danger">{error}</div>
          )}

          <div className="sticky bottom-2 mt-3 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(draft);
                }
              }}
              placeholder="Що зробити з того, що є?"
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
        </>
      )}
    </div>
  );
}
