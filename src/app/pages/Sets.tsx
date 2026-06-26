import { Check, Sparkles, Wine } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chip } from "@/components/Chip";
import { Stepper } from "@/components/Stepper";
import { CURATED_SETS } from "@/data/sets";
import { MOODS } from "@/data/catalog/moods";
import { useAllCocktails } from "@/data/useCocktails";
import { composeParty, MIN_PEOPLE, planFromSet } from "@/domain/party";
import { useT } from "@/i18n";
import type { CocktailTag } from "@/types/cocktail";
import { usePartyStore } from "@/store/partyStore";
import { useUserStore } from "@/store/userStore";

export default function Sets() {
  const t = useT();
  const nav = useNavigate();
  const all = useAllCocktails();
  const config = usePartyStore((s) => s.config);
  const setConfig = usePartyStore((s) => s.setConfig);
  const setPlan = usePartyStore((s) => s.setPlan);
  const ownedIngredients = useUserStore((s) => s.ownedIngredients);

  const [moods, setMoods] = useState<string[]>([]);

  const total = config.people * config.drinksPerPerson;

  const toggleMood = (key: string) =>
    setMoods((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const selectedMoods = MOODS.filter((m) => moods.includes(m.key));

  const generate = () => {
    const moodTags: CocktailTag[] = selectedMoods.flatMap((m) => m.tags);
    const items = composeParty(all, config, moodTags, ownedIngredients);
    const title = selectedMoods.length ? selectedMoods.map((m) => m.labelUk).join(", ") : "Згенерований сет";
    setPlan(
      items.map((i) => ({ id: i.cocktail.id, servings: i.servings })),
      title,
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

      <div className="mt-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-text">{t.sets.people}</span>
          <Stepper value={config.people} onChange={(v) => setConfig({ people: v })} min={MIN_PEOPLE} max={50} />
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-text">{t.sets.varieties}</span>
          <Stepper value={config.varieties} onChange={(v) => setConfig({ varieties: v })} min={1} max={12} />
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-text">{t.sets.drinksPerPerson}</span>
          <Stepper
            value={config.drinksPerPerson}
            onChange={(v) => setConfig({ drinksPerPerson: v })}
            min={1}
            max={10}
          />
        </div>

        <button
          type="button"
          onClick={() => setConfig({ localOnly: !config.localOnly })}
          className="mt-1 flex w-full items-center justify-between py-1.5 text-left"
        >
          <span className="text-text">{t.sets.localOnly}</span>
          <span
            className={
              "relative h-6 w-11 shrink-0 rounded-full border transition " +
              (config.localOnly ? "border-gold bg-gold/30" : "border-border bg-surface-alt")
            }
          >
            <span
              className={
                "absolute top-0.5 grid h-4 w-4 place-items-center rounded-full transition-all " +
                (config.localOnly ? "left-[22px] bg-gold text-bg" : "left-0.5 bg-text-faint")
              }
            >
              {config.localOnly && <Check size={11} strokeWidth={3} />}
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

      <button
        type="button"
        onClick={generate}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-center font-bold text-bg"
      >
        <Sparkles size={18} /> {t.sets.generate}
      </button>

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
