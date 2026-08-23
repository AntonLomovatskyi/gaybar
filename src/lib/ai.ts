/**
 * Ask Claude about a cocktail, with the recipe AND your bar as context.
 *
 * Called straight from the browser with the user's own API key (Settings → localStorage), which
 * is what lets a static GitHub Pages build talk to the API with no backend. The key rides the
 * Firestore sync (same Google account = same key on another device) but is kept out of the
 * downloadable backup file — see getSnapshot vs getCloudSnapshot in data/backup.ts.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { Cocktail } from "@/types/cocktail";
import { estimateStrength, formatIngredient } from "@/domain/cocktails";
import { cocktailCalories, cocktailCost } from "@/domain/economics";
import { classifyIngredient, isEssential, whatCanIMake } from "@/domain/inventory";
import { flavourSwapFor, formatSwap } from "@/domain/substitutes";

export const DEFAULT_MODEL = "claude-opus-5";
export const MODELS = [
  { id: "claude-opus-5", label: "Opus 5 — найрозумніший" },
  { id: "claude-sonnet-5", label: "Sonnet 5 — швидший" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5 — найдешевший" },
] as const;

const SYSTEM = `Ти — досвідчений бармен-консультант в українському застосунку про коктейлі. Відповідаєш ВИКЛЮЧНО українською.

Тобі дають рецепт конкретного коктейлю та список того, що є в барі користувача. Спирайся на них:
- Коли радиш заміну — виходь з того, що в нього реально є, і кажи, як це змінить смак.
- Коли чогось бракує — скажи прямо, чого саме, і чи можна обійтися без цього.
- Пропорції називай у мл, як у рецепті.
- Відповідай коротко і по суті: кілька речень або короткий список. Без вступів на кшталт «Чудове питання».
- Якщо питання не про цей коктейль — усе одно допоможи як бармен.
- Не вигадуй фактів про бренди чи рецептури, яких не знаєш; краще скажи, що не певен.`;

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

/** The recipe + bar snapshot handed to the model as the first user turn. */
export function buildContext(cocktail: Cocktail, owned: string[], flexible: boolean): string {
  const strength = estimateStrength(cocktail);
  const lines: string[] = [
    `КОКТЕЙЛЬ: ${cocktail.name}${cocktail.nameEn ? ` (${cocktail.nameEn})` : ""}`,
    cocktail.tags.length ? `Теги: ${cocktail.tags.join(", ")}` : "",
    cocktail.glass ? `Келих: ${cocktail.glass}` : "",
    strength.abv > 0 ? `Міцність: ≈${strength.abv}% (${strength.tier})` : "",
    `Орієнтовно: ${cocktailCost(cocktail)} ₴, ${cocktailCalories(cocktail)} ккал на порцію`,
    "",
    "ІНГРЕДІЄНТИ:",
    ...cocktail.ingredients.map((i) => `- ${formatIngredient(i)}`),
  ];

  if (cocktail.tools.length) lines.push("", `ІНСТРУМЕНТИ: ${cocktail.tools.join(", ")}`);
  if (cocktail.steps.length) {
    lines.push("", "ПРИГОТУВАННЯ:", ...cocktail.steps.map((s, i) => `${i + 1}. ${s}`));
  }

  // What the bar can and can't cover for THIS drink — the whole point of the feature.
  const essential = cocktail.ingredients.filter(isEssential);
  const missing: string[] = [];
  const subs: string[] = [];
  for (const ing of essential) {
    const m = classifyIngredient(ing, owned, flexible);
    if (m.tier === "missing") missing.push(ing.name);
    else if (m.tier === "substitute" && m.have) subs.push(`${ing.name} → є ${m.have}`);
  }

  lines.push("", `МІЙ БАР (${owned.length}): ${owned.length ? owned.join(", ") : "порожній"}`);
  lines.push(`Гнучкий підбір (заміни схожим): ${flexible ? "увімкнено" : "вимкнено"}`);
  lines.push(missing.length ? `БРАКУЄ ДЛЯ ЦЬОГО КОКТЕЙЛЮ: ${missing.join(", ")}` : "Усе для цього коктейлю є.");
  if (subs.length) lines.push(`МОЖЛИВІ ЗАМІНИ З БАРУ: ${subs.join("; ")}`);

  // Syrup <-> liqueur swaps we can already compute — hand them over rather than making the model guess.
  const swaps = cocktail.ingredients
    .map((i) => flavourSwapFor(i, owned))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => `${s.needName} → ${formatSwap(s)}`);
  if (swaps.length) lines.push(`ЗАМІНИ СИРОПОМ/ЛІКЕРОМ (пропорції вже перераховані): ${swaps.join("; ")}`);

  return lines.filter((l) => l !== "").join("\n");
}

export class MissingKeyError extends Error {}

/**
 * Streams an answer, calling `onDelta` with each chunk of text. Returns the full answer.
 * `history` is the prior conversation for this cocktail (context is prepended to the first turn).
 */
export async function askAboutCocktail(opts: {
  cocktail: Cocktail;
  owned: string[];
  flexible: boolean;
  question: string;
  history: ChatTurn[];
  apiKey: string;
  model?: string;
  onDelta?: (text: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { cocktail, owned, flexible, question, history, apiKey, model = DEFAULT_MODEL, onDelta, signal } = opts;
  if (!apiKey) throw new MissingKeyError("Додай свій Anthropic API-ключ у налаштуваннях.");

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  // The recipe + bar snapshot rides on the first user turn so later turns stay cheap.
  const messages = [
    ...(history.length
      ? history.map((t) => ({ role: t.role, content: t.text }))
      : [{ role: "user" as const, content: `${buildContext(cocktail, owned, flexible)}\n\n---\n` }]),
    { role: "user" as const, content: question },
  ];
  if (history.length === 0) {
    // Fold the context into the first question rather than sending a dangling context turn.
    messages.splice(0, 2, {
      role: "user" as const,
      content: `${buildContext(cocktail, owned, flexible)}\n\n---\nПитання: ${question}`,
    });
  }

  const body = {
    model,
    max_tokens: 8000,
    system: SYSTEM,
    messages,
    // Server-side fallback: if safety classifiers decline, the API retries on another model
    // rather than handing back an empty refusal.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  };

  const run = async (payload: Record<string, unknown>) => {
    const stream = client.beta.messages.stream(payload as never, { signal });
    let full = "";
    stream.on("text", (delta: string) => {
      full += delta;
      onDelta?.(delta);
    });
    const final = (await stream.finalMessage()) as unknown as { stop_reason?: string };
    if (final.stop_reason === "refusal" && !full) {
      throw new Error("Модель відхилила це питання. Спробуй переформулювати.");
    }
    return full;
  };

  try {
    return await run(body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/401|invalid x-api-key|authentication/i.test(msg)) {
      throw new MissingKeyError("Anthropic відхилив цей ключ. Перевір його в налаштуваннях.");
    }
    // Older accounts may not have the fallback beta — retry once without it before giving up.
    if (/fallback|beta|unsupported/i.test(msg)) {
      const { betas: _b, fallbacks: _f, ...plain } = body;
      try {
        return await run(plain);
      } catch (e2) {
        throw new Error(e2 instanceof Error ? e2.message : String(e2));
      }
    }
    throw new Error(msg);
  }
}

/* ------------------------------------------------------------------ *
 * Global bartender chat: your whole bar as context + web search.
 * ------------------------------------------------------------------ */

const BAR_SYSTEM = `Ти — досвідчений бармен-консультант в українському застосунку про коктейлі. Відповідаєш ВИКЛЮЧНО українською.

Тобі дають повний список того, що є в барі користувача, і список коктейлів, які з цього вже виходять.
- Коли питають «що можна зробити» — спирайся на список наявних коктейлів із контексту, називай конкретні назви.
- Коли користувач додає інгредієнт, якого ще немає в барі («а якщо купити вишневий сік?») — поміркуй, що це відкриє, і за потреби пошукай рецепти в інтернеті через web_search.
- Шукай в інтернеті, коли рецепта немає в контексті або потрібні свіжі/зовнішні дані. Коротко зазнач джерело.
- Пропорції завжди в мл.
- Відповідай стисло: кілька речень або короткий список. Без вступів на кшталт «Чудове питання».
- Не вигадуй рецептур; якщо не певен — скажи це або пошукай.`;

/** Bar snapshot for the global chat: what you own + what it already makes. */
export function buildBarContext(all: Cocktail[], owned: string[], flexible: boolean): string {
  const { makeable, almost } = whatCanIMake(all, owned, flexible);
  const lines = [
    `МІЙ БАР (${owned.length}): ${owned.length ? owned.join(", ") : "порожній"}`,
    `Гнучкий підбір (заміни схожим): ${flexible ? "увімкнено" : "вимкнено"}`,
    "",
    `З ЦЬОГО ВЖЕ ВИХОДИТЬ (${makeable.length}): ${
      makeable
        .slice(0, 60)
        .map((m) => m.cocktail.name)
        .join(", ") || "нічого"
    }${makeable.length > 60 ? ` … і ще ${makeable.length - 60}` : ""}`,
  ];
  if (almost.length) {
    lines.push(
      "",
      `МАЙЖE ВИХОДИТЬ (бракує 1–2): ${almost
        .slice(0, 20)
        .map((m) => `${m.cocktail.name} (бракує: ${m.missing.map((i) => i.name).join(", ")})`)
        .join("; ")}`,
    );
  }
  lines.push("", `Всього рецептів у застосунку: ${all.length}.`);
  return lines.join("\n");
}

/** Global chat: whole-bar context, web search enabled. Streams like askAboutCocktail. */
export async function askBartender(opts: {
  all: Cocktail[];
  owned: string[];
  flexible: boolean;
  question: string;
  history: ChatTurn[];
  apiKey: string;
  model?: string;
  onDelta?: (text: string) => void;
  onSearching?: () => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { all, owned, flexible, question, history, apiKey, model = DEFAULT_MODEL, onDelta, onSearching, signal } = opts;
  if (!apiKey) throw new MissingKeyError("Додай свій Anthropic API-ключ у налаштуваннях.");

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const messages: { role: "user" | "assistant"; content: unknown }[] = history.length
    ? [...history.map((t) => ({ role: t.role, content: t.text as unknown })), { role: "user", content: question }]
    : [{ role: "user", content: `${buildBarContext(all, owned, flexible)}\n\n---\nПитання: ${question}` }];

  const base = {
    model,
    max_tokens: 8000,
    system: BAR_SYSTEM,
    // Server-side web search: runs on Anthropic's infrastructure, so no CORS from the browser.
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  };

  const runOnce = async (payload: Record<string, unknown>) => {
    const stream = client.beta.messages.stream(payload as never, { signal });
    let text = "";
    stream.on("text", (d: string) => {
      text += d;
      onDelta?.(d);
    });
    stream.on("streamEvent", (ev: { type?: string; content_block?: { type?: string } }) => {
      if (ev?.type === "content_block_start" && ev.content_block?.type === "server_tool_use") onSearching?.();
    });
    const final = (await stream.finalMessage()) as unknown as { stop_reason?: string; content?: unknown[] };
    return { text, final };
  };

  const drive = async (payload: Record<string, unknown>) => {
    let full = "";
    const msgs = [...messages];
    // A web-search turn can stop with `pause_turn`; re-send to let the server resume.
    for (let i = 0; i < 4; i++) {
      const { text, final } = await runOnce({ ...payload, messages: msgs });
      full += text;
      if (final.stop_reason === "pause_turn" && final.content) {
        msgs.push({ role: "assistant", content: final.content });
        continue;
      }
      if (final.stop_reason === "refusal" && !full) {
        throw new Error("Модель відхилила це питання. Спробуй переформулювати.");
      }
      break;
    }
    return full;
  };

  try {
    return await drive(base);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/401|invalid x-api-key|authentication/i.test(msg)) {
      throw new MissingKeyError("Anthropic відхилив цей ключ. Перевір його в налаштуваннях.");
    }
    if (/fallback|beta|unsupported|web_search/i.test(msg)) {
      // Account without the fallback beta or the newer search tool — retry plainly.
      const { betas: _b, fallbacks: _f, tools: _t, ...plain } = base;
      return await drive(plain);
    }
    throw new Error(msg);
  }
}
