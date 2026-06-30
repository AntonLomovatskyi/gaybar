import { Plus, Wrench, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { CocktailCard } from "@/components/CocktailCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EssentialsSetup, type SetupKind } from "@/components/EssentialsSetup";
import { ToolIcon } from "@/components/ToolIcon";
import { canonicalIdOf, categoryGroupOf, trackableCanonicals } from "@/data/catalog/ingredients";
import { TOOL_BY_ID } from "@/data/catalog/tools";
import { useAllCocktails } from "@/data/useCocktails";
import { hasAllTools, smartShoppingPlan, whatCanIMake, type MakeResult } from "@/domain/inventory";
import { normalize } from "@/domain/text";
import { useT } from "@/i18n";
import { useUserStore } from "@/store/userStore";

const TOOLS = Object.values(TOOL_BY_ID).filter((tl) => tl.kind === "tool");
const TRACKABLE = trackableCanonicals();
const GROUP_ORDER = [
  "Алкоголь",
  "Лікери",
  "Вино та вермут",
  "Бітери",
  "Пиво",
  "Фрукти та ягоди",
  "Трави",
  "Спеції",
  "Молочне та яйця",
  "Соки",
  "Сиропи",
  "Прикраси",
  "Напої",
  "Інше",
];

function MakeCard({ r, showMissing }: { r: MakeResult; showMissing?: boolean }) {
  const t = useT();
  return (
    <div>
      <CocktailCard cocktail={r.cocktail} />
      {showMissing && r.missing.length > 0 && (
        <div className="mt-1 px-0.5 text-[11px] leading-tight text-danger">
          {t.bar.missing}: {r.missing.map((m) => m.name).join(", ")}
        </div>
      )}
      {!showMissing && r.substitutions.length > 0 && (
        <div className="mt-1 px-0.5 text-[11px] leading-tight text-text-faint">
          заміна: {r.substitutions.map((s) => `${s.required.name} → ${s.have}`).join(", ")}
        </div>
      )}
    </div>
  );
}

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
  const [showTools, setShowTools] = useState(false);
  const [setup, setSetup] = useState<SetupKind | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const q = normalize(draft);
    if (q.length < 1) return [];
    const ownedSet = new Set(ownedIngredients.map(normalize));
    return TRACKABLE.filter((c) => normalize(c.nameUk).includes(q) && !ownedSet.has(normalize(c.nameUk))).slice(0, 8);
  }, [draft, ownedIngredients]);

  const ownedGroups = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const name of ownedIngredients) {
      const g = categoryGroupOf(name);
      (m.get(g) ?? m.set(g, []).get(g)!).push(name);
    }
    return [...m.entries()].sort((a, b) => GROUP_ORDER.indexOf(a[0]) - GROUP_ORDER.indexOf(b[0]));
  }, [ownedIngredients]);

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
  const plan = useMemo(
    () => smartShoppingPlan(all, ownedIngredients, flexibleMatching, 5),
    [all, ownedIngredients, flexibleMatching],
  );
  const planTotal = plan.reduce((n, p) => n + p.cocktails.length, 0);

  if (setup) return <EssentialsSetup kind={setup} onClose={() => setSetup(null)} />;

  return (
    <div className="px-4 py-4">
      <h2 className="font-bold text-gold">Мій бар</h2>
      <p className="mt-1 text-xs text-text-faint">
        Познач алкоголь і свіже (фрукти, трави, соки). Базове — лід, цукор, вода, сіль — вважаємо за наявне.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setSetup("alcohol")}
          className="flex-1 rounded-xl border border-gold px-3 py-2.5 text-sm font-bold text-gold"
        >
          🍸 Алкоголь
        </button>
        <button
          onClick={() => setSetup("fresh")}
          className="flex-1 rounded-xl border border-gold px-3 py-2.5 text-sm font-bold text-gold"
        >
          🍓 Свіже
        </button>
      </div>

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
            className="absolute top-1/2 right-3 -translate-y-1/2 text-text-faint"
            aria-label="Очистити"
          >
            <X size={18} />
          </button>
        )}
        {suggestions.length > 0 && (
          <div className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            {suggestions.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  addOwnedIngredient(c.nameUk);
                  setDraft("");
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text hover:bg-surface-alt"
              >
                <Plus size={15} className="text-gold" />
                {c.nameUk}
                <span className="ml-auto text-xs text-text-faint">{categoryGroupOf(c.nameUk)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Owned, grouped (no chips) */}
      {ownedIngredients.length > 0 && (
        <div className="mt-4 space-y-3">
          {ownedGroups.map(([g, items]) => (
            <div key={g}>
              <div className="mb-1 text-xs font-bold text-text-faint">{g}</div>
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                {items.map((name, i) => (
                  <div
                    key={name}
                    className={"flex items-center justify-between px-3 py-2" + (i > 0 ? " border-t border-border" : "")}
                  >
                    <Link to={`/ingredient/${canonicalIdOf(name)}`} className="text-sm text-text hover:text-gold">
                      {name}
                    </Link>
                    <button
                      onClick={() => setConfirmRemove(name)}
                      className="text-text-faint hover:text-danger"
                      aria-label="Прибрати"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tools (collapsible) */}
      <button
        onClick={() => setShowTools((v) => !v)}
        className="mt-6 flex w-full items-center justify-between text-left font-bold text-gold"
      >
        <span>{t.bar.tools}</span>
        <span className="text-xs text-text-faint">
          {ownedTools.length ? `${ownedTools.length} ·` : ""} {showTools ? "сховати" : "показати"}
        </span>
      </button>
      {showTools && (
        <div className="mt-3 flex flex-wrap gap-2">
          {TOOLS.map((tl) => {
            const owned = ownedTools.includes(tl.nameUk);
            return (
              <button
                key={tl.id}
                type="button"
                onClick={() => toggleOwnedTool(tl.nameUk)}
                className={clsx(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                  owned ? "border-gold bg-gold/15 text-text" : "border-border bg-surface-alt text-text-dim",
                )}
              >
                <ToolIcon id={tl.id} size={18} className={owned ? "text-gold" : "text-text-faint"} />
                {tl.nameUk}
              </button>
            );
          })}
        </div>
      )}

      {/* Toggles */}
      <div className="mt-5 space-y-2">
        <Toggle
          label="Гнучкий підбір (заміни схожим)"
          on={flexibleMatching}
          onClick={() => setFlexibleMatching(!flexibleMatching)}
        />
        <Toggle
          label="Лише з моїми інструментами"
          icon={<Wrench size={15} className="text-text-dim" />}
          on={onlyMyTools}
          onClick={() => setOnlyMyTools(!onlyMyTools)}
        />
      </div>

      {ownedIngredients.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-6 text-center text-text-dim">
          {t.bar.empty}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setSetup("alcohol")}
              className="flex-1 rounded-xl bg-gold px-4 py-3 font-bold text-bg"
            >
              🍸 Алкоголь
            </button>
            <button
              onClick={() => setSetup("fresh")}
              className="flex-1 rounded-xl border border-gold px-4 py-3 font-bold text-gold"
            >
              🍓 Свіже
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="mt-7 font-bold text-gold">
            {t.bar.makeable} ({makeableList.length})
          </h2>
          {makeableList.length === 0 ? (
            <div className="mt-2 text-sm text-text-faint">{t.common.none}</div>
          ) : (
            <div className="mt-3 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(108px,1fr))]">
              {makeableList.map((m) => (
                <MakeCard key={m.cocktail.id} r={m} />
              ))}
            </div>
          )}

          <h2 className="mt-7 font-bold text-gold">
            {t.bar.almost} ({almostList.length})
          </h2>
          {almostList.length === 0 ? (
            <div className="mt-2 text-sm text-text-faint">{t.common.none}</div>
          ) : (
            <div className="mt-3 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(108px,1fr))]">
              {almostList.map((m) => (
                <MakeCard key={m.cocktail.id} r={m} showMissing />
              ))}
            </div>
          )}
        </>
      )}

      {plan.length > 0 && (
        <section className="mt-7">
          <h2 className="font-bold text-gold">Розумний план покупок</h2>
          <p className="mt-1 text-xs text-text-faint">
            Купуй у такому порядку — кожен крок відкриває найбільше нового.
          </p>
          <div className="mt-3 space-y-2">
            {plan.map((p, i) => (
              <div
                key={p.canonicalId}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/15 text-sm font-bold text-gold">
                  {i + 1}
                </span>
                <Link to={`/ingredient/${p.canonicalId}`} className="flex-1 text-text hover:text-gold">
                  {p.name}
                </Link>
                <span className="shrink-0 rounded-full bg-gold/15 px-2.5 py-1 text-sm font-bold text-gold">
                  +{p.cocktails.length}
                </span>
              </div>
            ))}
          </div>
          {plan.length > 1 && (
            <p className="mt-2 text-xs text-text-faint">
              Разом ці {plan.length} відкриють {planTotal} нових коктейлів.
            </p>
          )}
        </section>
      )}

      <ConfirmDialog
        open={confirmRemove !== null}
        title={`Прибрати «${confirmRemove}» з бару?`}
        onConfirm={() => {
          if (confirmRemove) removeOwnedIngredient(confirmRemove);
          setConfirmRemove(null);
        }}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}

function Toggle({ label, on, onClick, icon }: { label: string; on: boolean; onClick: () => void; icon?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-surface p-3.5 text-left"
    >
      <span className="flex items-center gap-2 text-sm text-text">
        {icon}
        {label}
      </span>
      <span className={clsx("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-gold" : "bg-surface-alt")}>
        <span
          className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-bg transition", on ? "left-[22px]" : "left-0.5")}
        />
      </span>
    </button>
  );
}
