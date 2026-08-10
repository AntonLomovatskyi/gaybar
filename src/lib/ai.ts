/**
 * Ask Claude about a cocktail, with the recipe AND your bar as context.
 *
 * Called straight from the browser with the user's own API key (Settings → localStorage). The key
 * is deliberately NOT part of `PersistedData`, so it is never exported in a backup or synced to
 * Firestore — it stays on the device that typed it. This mirrors the cookingmonsta setup and is
 * what lets a static GitHub Pages build talk to the API with no backend.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { Cocktail } from "@/types/cocktail";
import { estimateStrength, formatIngredient } from "@/domain/cocktails";
import { cocktailCalories, cocktailCost } from "@/domain/economics";
import { classifyIngredient, isEssential } from "@/domain/inventory";

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
