import { Check, Plus, Sparkles, Wine, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Chip } from "@/components/Chip";
import { Stepper } from "@/components/Stepper";
import { CURATED_SETS } from "@/data/sets";
import { canonicalIdOf, isAlcoholic, isAssumedAvailable } from "@/data/catalog/ingredients";
import { MOODS } from "@/data/catalog/moods";
import { useAllCocktails } from "@/data/useCocktails";
import { useTriedIds } from "@/data/useFilteredCocktails";
import { ingredientUsage, type TastedFilter } from "@/domain/cocktails";
import { composePartyPlan, MIN_PEOPLE, planFromSet, type PartyKind } from "@/domain/party";
import { normalize } from "@/domain/text";
import { useT } from "@/i18n";
import type { CocktailTag } from "@/types/cocktail";
import { usePartyStore } from "@/store/partyStore";
import { useUserStore } from "@/store/userStore";

const KINDS: { key: PartyKind; label: string }[] = [
  { key: "any", label: "Усе" },
  { key: "shots", label: "🥃 Лише шоти" },
  { key: "cocktails", label: "🍸 Лише коктейлі" },
  { key: "venue", label: "Шоти Там" },
];
const TASTED: { key: TastedFilter; label: string }[] = [
  { key: "all", label: "Усі" },
  { key: "untried", label: "🆕 Ще не куштував" },
  { key: "tried", label: "★ Вже куштував" },
];
const chipClass = (on: boolean) =>
  clsx(
    "rounded-full border px-3 py-1.5 text-sm transition",
    on ? "border-gold bg-gold/15 text-gold" : "border-border text-text-dim hover:border-gold/60",
  );
/** "A, B і C" for the plan notice. */
const joinUk = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} і ${names[names.length - 1]}`;

export default function Sets() {
  const t = useT();
  const nav = useNavigate();
  const all = useAllCocktails();
  const config = usePartyStore((s) => s.config);
  const setConfig = usePartyStore((s) => s.setConfig);
  const setPlan = usePartyStore((s) => s.setPlan);
  const ownedIngredients = useUserStore((s) => s.ownedIngredients);
  const flexibleMatching = useUserStore((s) => s.flexibleMatching);
  const triedIds = useTriedIds();

  const [moods, setMoods] = useState<string[]>([]);
  const [shortSet, setShortSet] = useState<number | null>(null);
  const [productQuery, setProductQuery] = useState("");

  const tasted = config.tasted ?? "all";
  const mustUse = useMemo(() => config.mustUse ?? [], [config.mustUse]);

  // Every ingredient some recipe uses, most-used first — the "must use" picker's vocabulary.
  const usage = useMemo(() => ingredientUsage(all), [all]);
  const usageById = useMemo(() => new Map(usage.map((u) => [u.id, u])), [usage]);
  const productName = (id: string) => usageById.get(id)?.name ?? id;
  const productHits = useMemo(() => {
    const q = normalize(productQuery);
    if (!q) return [];
    const starts = (name: string) => (normalize(name).startsWith(q) ? 1 : 0);
    return usage
      .filter((u) => !mustUse.includes(u.id) && normalize(u.name).includes(q))
      .sort((a, b) => starts(b.name) - starts(a.name) || b.count - a.count)
      .slice(0, 8);
  }, [productQuery, usage, mustUse]);
  // One tap for the fresh things already open in your bar (juice, cream, fruit) — the usual
  // reason to want a drink that uses something up.
  const barPicks = useMemo(() => {
    const ids = new Set<string>();
    for (const name of ownedIngredients) {
      if (isAlcoholic(name) || isAssumedAvailable(name)) continue;
      const id = canonicalIdOf(name);
      if (usageById.has(id) && !mustUse.includes(id)) ids.add(id);
    }
    return [...ids].slice(0, 10).map((id) => usageById.get(id)!);
  }, [ownedIngredients, usageById, mustUse]);
  const addProduct = (id: string) => {
    setConfig({ mustUse: [...mustUse, id] });
    setProductQuery("");
  };
  const removeProduct = (id: string) => setConfig({ mustUse: mustUse.filter((x) => x !== id) });

  const total = config.everyoneTries
    ? config.varieties * Math.max(config.people, MIN_PEOPLE)
    : config.people * config.drinksPerPerson;

  const toggleMood = (key: string) =>
    setMoods((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const selectedMoods = MOODS.filter((m) => moods.includes(m.key));

  const generate = () => {
    const moodTags: CocktailTag[] = selectedMoods.flatMap((m) => m.tags);
    const { items, unavailable, didNotFit } = composePartyPlan(all, config, {
      moodTags,
      owned: ownedIngredients,
      flexible: flexibleMatching,
      triedIds,
    });
    // Strict filters ("З мого бару", tasting) never pad the set with drinks that don't qualify —
    // say so instead.
    if (items.length === 0) {
      setShortSet(0);
      return;
    }
    setShortSet(items.length < config.varieties ? items.length : null);
    const title = selectedMoods.length ? selectedMoods.map((m) => m.labelUk).join(", ") : "Згенерований сет";
    const notes: string[] = [];
    if (unavailable.length)
      notes.push(
        `Немає коктейлів з: ${joinUk(unavailable.map(productName))} — під вибрані фільтри нічого не підійшло.`,
      );
    if (didNotFit.length)
      notes.push(`Не вмістилося: ${joinUk(didNotFit.map(productName))} — збільш кількість різних коктейлів.`);
    if (items.length < config.varieties)
      notes.push(`Вийшло ${items.length} з ${config.varieties} — більше під ці фільтри не знайшлося.`);
    setPlan(
      items.map((i) => ({ id: i.cocktail.id, servings: i.servings })),
      title,
      notes.join(" ") || null,
    );
    nav("/set/plan");
  };

  const buildCurated = (setId: string, title: string, ids: string[]) => {
    const cocktails = ids.map((id) => all.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c);
    if (cocktails.length === 0) return;
    const items = planFromSet(cocktails, config);
    setPlan(
      items.map((i) => ({ id: i.cocktail.id, servings: i.servings })),
      title,
    );
    nav("/set/plan");
  };

  return (
    <div className="px-4 py-4">
      {/* Builder config */}
      <h2 className="font-display text-lg font-bold text-text">{t.sets.builder}</h2>

      {/* What kind of drinks the set is built from */}
      <div className="mt-3 flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => setConfig({ kind: k.key })}
            className={chipClass(config.kind === k.key)}
          >
            {k.label}
          </button>
        ))}
      </div>

      {/* Tasting: build the set from drinks you haven't tried yet, or only from ones you know */}
      <div className="mt-3">
        <div className="text-xs text-text-faint">Дегустація</div>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {TASTED.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setConfig({ tasted: o.key })}
              className={chipClass(tasted === o.key)}
            >
              {o.label}
              {o.key === "tried" && <span className="ml-1 opacity-70">· {triedIds.size}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-text">{t.sets.people}</span>
          <Stepper value={config.people} onChange={(v) => setConfig({ people: v })} min={MIN_PEOPLE} max={50} />
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-text">{t.sets.varieties}</span>
          <Stepper value={config.varieties} onChange={(v) => setConfig({ varieties: v })} min={1} max={12} />
        </div>
        {!config.everyoneTries && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-text">{t.sets.drinksPerPerson}</span>
            <Stepper
              value={config.drinksPerPerson}
              onChange={(v) => setConfig({ drinksPerPerson: v })}
              min={1}
              max={10}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setConfig({ everyoneTries: !config.everyoneTries })}
          className="mt-1 flex w-full items-start justify-between gap-3 py-1.5 text-left"
        >
          <span className="min-w-0">
            <span className="block text-text">Кожен куштує кожен</span>
            <span className="block text-xs text-text-faint">
              По {Math.max(config.people, MIN_PEOPLE)} порції кожного
            </span>
          </span>
          <span
            className={
              "mt-0.5 relative h-6 w-11 shrink-0 rounded-full border transition " +
              (config.everyoneTries ? "border-gold bg-gold/30" : "border-border bg-surface-alt")
            }
          >
            <span
              className={
                "absolute top-0.5 grid h-4 w-4 place-items-center rounded-full transition-all " +
                (config.everyoneTries ? "left-[22px] bg-gold text-bg" : "left-0.5 bg-text-faint")
              }
            >
              {config.everyoneTries && <Check size={11} strokeWidth={3} />}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setConfig({ byStrength: !config.byStrength })}
          className="flex w-full items-start justify-between gap-3 py-1.5 text-left"
        >
          <span className="min-w-0">
            <span className="block text-text">За градусом</span>
            <span className="block text-xs text-text-faint">Від найлегшого до найміцнішого</span>
          </span>
          <span
            className={
              "mt-0.5 relative h-6 w-11 shrink-0 rounded-full border transition " +
              (config.byStrength ? "border-gold bg-gold/30" : "border-border bg-surface-alt")
            }
          >
            <span
              className={
                "absolute top-0.5 grid h-4 w-4 place-items-center rounded-full transition-all " +
                (config.byStrength ? "left-[22px] bg-gold text-bg" : "left-0.5 bg-text-faint")
              }
            >
              {config.byStrength && <Check size={11} strokeWidth={3} />}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setConfig({ useMyBar: !config.useMyBar })}
          className="flex w-full items-center justify-between py-1.5 text-left"
        >
          <span className="text-text">З мого бару</span>
          <span
            className={
              "relative h-6 w-11 shrink-0 rounded-full border transition " +
              (config.useMyBar ? "border-gold bg-gold/30" : "border-border bg-surface-alt")
            }
          >
            <span
              className={
                "absolute top-0.5 grid h-4 w-4 place-items-center rounded-full transition-all " +
                (config.useMyBar ? "left-[22px] bg-gold text-bg" : "left-0.5 bg-text-faint")
              }
            >
              {config.useMyBar && <Check size={11} strokeWidth={3} />}
            </span>
          </span>
        </button>

        <div className="mt-2 border-t border-border pt-3 text-sm text-text-dim">
          {t.sets.total}: <span className="font-bold text-gold tabular-nums">{total}</span>
        </div>
      </div>

      {/* Mood multi-select */}
      <div className="mt-4 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <Chip
            key={m.key}
            label={`${m.emoji} ${m.labelUk}`}
            selected={moods.includes(m.key)}
            onClick={() => toggleMood(m.key)}
          />
        ))}
      </div>

      {/* Must-use products: each one lands in at least one drink of the set */}
      <div className="mt-4 rounded-xl border border-border bg-surface p-4">
        <div className="text-text">Обов'язково використати</div>
        <div className="text-xs text-text-faint">Кожен продукт буде хоча б в одному коктейлі сету.</div>

        {mustUse.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {mustUse.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => removeProduct(id)}
                aria-label={`Прибрати ${productName(id)}`}
                className="flex items-center gap-1 rounded-full border border-gold bg-gold/15 px-3 py-1.5 text-sm text-gold"
              >
                {productName(id)} <X size={14} />
              </button>
            ))}
          </div>
        )}

        <div className="relative mt-3">
          <input
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            placeholder="Апельсиновий сік, збиті вершки…"
            className="w-full rounded-xl border border-border bg-surface-alt px-4 py-2.5 text-text outline-none placeholder:text-text-faint focus:border-gold"
          />
          {productQuery && (
            <button
              type="button"
              onClick={() => setProductQuery("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-text-faint"
              aria-label="Очистити"
            >
              <X size={18} />
            </button>
          )}
          {productHits.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
              {productHits.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => addProduct(u.id)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text hover:bg-surface-alt"
                >
                  <Plus size={15} className="text-gold" />
                  {u.name}
                  <span className="ml-auto text-xs text-text-faint tabular-nums">{u.count} рец.</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {barPicks.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-text-faint">Свіже з твого бару</div>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {barPicks.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => addProduct(u.id)}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm text-text-dim hover:border-gold/60"
                >
                  <Plus size={13} /> {u.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={generate}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-center font-bold text-bg"
      >
        <Sparkles size={18} /> {t.sets.generate}
      </button>

      {shortSet === 0 && (
        <p className="mt-2 rounded-xl border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
          {config.useMyBar && tasted === "all" ? (
            <>
              З твого бару зараз нічого не виходить{config.kind !== "any" ? " для цього типу напоїв" : ""}. Додай
              інгредієнти в «Мій бар» або вимкни «З мого бару».
            </>
          ) : (
            <>
              Під ці фільтри нічого не знайшлося.
              {tasted === "tried" && " «Вже куштував» — це коктейлі з оцінкою або позначкою «Я приготував(-ла)»."}
              {config.useMyBar && " Спробуй вимкнути «З мого бару»."}
            </>
          )}
        </p>
      )}

      {/* Curated sets */}
      <h2 className="mt-8 font-display text-lg font-bold text-text">{t.sets.curated}</h2>
      <div className="mt-3 grid gap-2">
        {CURATED_SETS.map((set) => (
          <button
            key={set.id}
            type="button"
            onClick={() => buildCurated(set.id, set.title, set.cocktailIds)}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left hover:border-gold/60"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
              <Wine size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold text-text">{set.title}</span>
              <span className="block truncate text-sm text-text-dim">{set.subtitle}</span>
            </span>
            <span className="shrink-0 text-xs text-text-faint tabular-nums">
              {set.cocktailIds.length} {t.sets.cocktails.toLowerCase()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
