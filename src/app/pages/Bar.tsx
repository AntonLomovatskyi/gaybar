import { Plus, Wrench, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Chip } from "@/components/Chip";
import { availabilityOf, type Availability } from "@/data/catalog/availability";
import { TOOL_BY_ID } from "@/data/catalog/tools";
import { useAllCocktails } from "@/data/useCocktails";
import { hasAllTools, suggestPurchases, whatCanIMake } from "@/domain/inventory";
import { normalize } from "@/domain/text";
import { useT } from "@/i18n";
import { useUserStore } from "@/store/userStore";

const TIER_COLOR: Record<Availability, string> = {
  common: "#5C8A5A",
  specialty: "#D9B25A",
  rare: "#C8553D",
};

const TOOLS = Object.values(TOOL_BY_ID).filter((tl) => tl.kind === "tool");

export default function Bar() {
  const t = useT();
  const all = useAllCocktails();
  const ownedIngredients = useUserStore((s) => s.ownedIngredients);
  const ownedTools = useUserStore((s) => s.ownedTools);
  const flexibleMatching = useUserStore((s) => s.flexibleMatching);
  const addOwnedIngredient = useUserStore((s) => s.addOwnedIngredient);
  const removeOwnedIngredient = useUserStore((s) => s.removeOwnedIngredient);
  const toggleOwnedTool = useUserStore((s) => s.toggleOwnedTool);
  const setFlexibleMatching = useUserStore((s) => s.setFlexibleMatching);

  const [draft, setDraft] = useState("");
  const [onlyMyTools, setOnlyMyTools] = useState(false);

  // All distinct ingredient names across the catalog, for autocomplete.
  const allIngredientNames = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const c of all) {
      for (const ing of c.ingredients) {
        const key = normalize(ing.name);
        if (!seen.has(key)) {
          seen.add(key);
          names.push(ing.name);
        }
      }
    }
    return names;
  }, [all]);

  const suggestions = useMemo(() => {
    const q = normalize(draft);
    if (q.length < 2) return [];
    const ownedSet = new Set(ownedIngredients.map(normalize));
    return allIngredientNames
      .filter((name) => normalize(name).includes(q) && !ownedSet.has(normalize(name)))
      .slice(0, 8);
  }, [draft, allIngredientNames, ownedIngredients]);

  const { makeable, almost } = useMemo(
    () => whatCanIMake(all, ownedIngredients, flexibleMatching),
    [all, ownedIngredients, flexibleMatching],
  );

  const makeableList = useMemo(
    () => (onlyMyTools ? makeable.filter((m) => hasAllTools(m.cocktail, ownedTools)) : makeable),
    [makeable, onlyMyTools, ownedTools],
  );
  const almostList = useMemo(
    () => (onlyMyTools ? almost.filter((m) => hasAllTools(m.cocktail, ownedTools)) : almost),
    [almost, onlyMyTools, ownedTools],
  );

  const purchases = useMemo(
    () => suggestPurchases(all, ownedIngredients, flexibleMatching).slice(0, 8),
    [all, ownedIngredients, flexibleMatching],
  );

  const pickSuggestion = (name: string) => {
    addOwnedIngredient(name);
    setDraft("");
  };

  return (
    <div className="px-4 py-4">
      {/* Ingredients */}
      <section>
        <h2 className="text-gold font-bold">{t.bar.ingredients}</h2>

        {ownedIngredients.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {ownedIngredients.map((name) => (
              <Chip key={name} label={`${name}  ✕`} selected onClick={() => removeOwnedIngredient(name)} />
            ))}
          </div>
        )}

        <div className="relative mt-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.bar.addIngredient}
            className="w-full rounded-xl border border-border bg-surface-alt px-4 py-2.5 text-text outline-none placeholder:text-text-faint focus:border-gold"
          />
          {draft && (
            <button
              type="button"
              onClick={() => setDraft("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint"
              aria-label="Очистити"
            >
              <X size={18} />
            </button>
          )}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
              {suggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => pickSuggestion(name)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text hover:bg-surface-alt"
                >
                  <Plus size={15} className="text-gold" />
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tools */}
      <section className="mt-6">
        <h2 className="text-gold font-bold">{t.bar.tools}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {TOOLS.map((tl) => (
            <Chip
              key={tl.id}
              label={tl.nameUk}
              selected={ownedTools.includes(tl.nameUk)}
              onClick={() => toggleOwnedTool(tl.nameUk)}
            />
          ))}
        </div>
      </section>

      {/* Toggles */}
      <section className="mt-6 space-y-2">
        <button
          type="button"
          onClick={() => setFlexibleMatching(!flexibleMatching)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-surface p-4 text-left"
        >
          <span className="text-text">Гнучкий підбір (заміни схожим)</span>
          <span
            className={clsx(
              "relative h-6 w-11 shrink-0 rounded-full transition",
              flexibleMatching ? "bg-gold" : "bg-surface-alt",
            )}
          >
            <span
              className={clsx(
                "absolute top-0.5 h-5 w-5 rounded-full bg-bg transition",
                flexibleMatching ? "left-[22px]" : "left-0.5",
              )}
            />
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOnlyMyTools(!onlyMyTools)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-surface p-4 text-left"
        >
          <span className="flex items-center gap-2 text-text">
            <Wrench size={16} className="text-text-dim" />
            Лише з моїми інструментами
          </span>
          <span
            className={clsx(
              "relative h-6 w-11 shrink-0 rounded-full transition",
              onlyMyTools ? "bg-gold" : "bg-surface-alt",
            )}
          >
            <span
              className={clsx(
                "absolute top-0.5 h-5 w-5 rounded-full bg-bg transition",
                onlyMyTools ? "left-[22px]" : "left-0.5",
              )}
            />
          </span>
        </button>
      </section>

      {ownedIngredients.length === 0 ? (
        <div className="mt-8 text-center text-text-dim">{t.bar.empty}</div>
      ) : (
        <>
          {/* Makeable */}
          <section className="mt-6">
            <h2 className="text-gold font-bold">
              {t.bar.makeable} ({makeableList.length})
            </h2>
            <div className="mt-3 space-y-2">
              {makeableList.map((m) => (
                <Link
                  key={m.cocktail.id}
                  to={`/cocktail/${m.cocktail.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
                >
                  <span className="text-text">{m.cocktail.name}</span>
                  {m.substitutions.length > 0 && (
                    <span className="text-xs text-text-faint">заміни: {m.substitutions.length}</span>
                  )}
                </Link>
              ))}
              {makeableList.length === 0 && <div className="text-sm text-text-faint">{t.common.none}</div>}
            </div>
          </section>

          {/* Almost */}
          <section className="mt-6">
            <h2 className="text-gold font-bold">
              {t.bar.almost} ({almostList.length})
            </h2>
            <div className="mt-3 space-y-2">
              {almostList.map((m) => (
                <Link
                  key={m.cocktail.id}
                  to={`/cocktail/${m.cocktail.id}`}
                  className="block rounded-xl border border-border bg-surface p-4"
                >
                  <div className="text-text">{m.cocktail.name}</div>
                  <div className="mt-1 text-xs text-text-dim">
                    {t.bar.missing}: {m.missing.map((i) => i.name).join(", ")}
                  </div>
                </Link>
              ))}
              {almostList.length === 0 && <div className="text-sm text-text-faint">{t.common.none}</div>}
            </div>
          </section>
        </>
      )}

      {/* Buy-to-unlock */}
      {purchases.length > 0 && (
        <section className="mt-6">
          <h2 className="text-gold font-bold">Що купити, щоб відкрити більше</h2>
          <div className="mt-3 space-y-2">
            {purchases.map((p) => (
              <div
                key={p.canonicalId}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
              >
                <span className="flex items-center gap-2 text-text">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: TIER_COLOR[availabilityOf(p.name)] }}
                  />
                  {p.name}
                </span>
                <span className="shrink-0 rounded-full bg-gold/15 px-2.5 py-1 text-sm font-bold text-gold">
                  +{p.cocktails.length}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
