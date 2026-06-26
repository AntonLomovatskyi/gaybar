import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { alcoholicCanonicals, type CanonicalIngredient } from "@/data/catalog/ingredients";
import { useUserStore } from "@/store/userStore";

interface Group {
  key: string;
  label: string;
  items: CanonicalIngredient[];
}

const SPIRIT_FAMILIES: { family: string; label: string }[] = [
  { family: "vodka", label: "Горілка" },
  { family: "gin", label: "Джин" },
  { family: "rum", label: "Ром" },
  { family: "tequila", label: "Текіла" },
  { family: "whisky", label: "Віскі" },
  { family: "brandy", label: "Бренді та коньяк" },
];

function buildGroups(): Group[] {
  const all = alcoholicCanonicals();
  const groups: Group[] = [];
  const usedFamilies = new Set(SPIRIT_FAMILIES.map((s) => s.family));

  for (const { family, label } of SPIRIT_FAMILIES) {
    const items = all.filter((c) => c.category === "spirit" && c.family === family);
    if (items.length) groups.push({ key: family, label, items });
  }
  const otherSpirits = all.filter((c) => c.category === "spirit" && (!c.family || !usedFamilies.has(c.family)));
  if (otherSpirits.length) groups.push({ key: "other-spirit", label: "Інші міцні", items: otherSpirits });

  const liqueurs = all.filter((c) => c.category === "liqueur");
  if (liqueurs.length) groups.push({ key: "liqueur", label: "Лікери", items: liqueurs });
  const wines = all.filter((c) => c.category === "wine");
  if (wines.length) groups.push({ key: "wine", label: "Вермут та вино", items: wines });
  const bitters = all.filter((c) => c.category === "bitters");
  if (bitters.length) groups.push({ key: "bitters", label: "Бітери", items: bitters });
  return groups;
}

export function EssentialsSetup({ onClose }: { onClose: () => void }) {
  const owned = useUserStore((s) => s.ownedIngredients);
  const add = useUserStore((s) => s.addOwnedIngredient);
  const remove = useUserStore((s) => s.removeOwnedIngredient);
  const groups = useMemo(buildGroups, []);
  const [step, setStep] = useState(0);

  const group = groups[step];
  const isLast = step === groups.length - 1;
  const ownedSet = new Set(owned);

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-text">Налаштувати бар</h1>
        <button onClick={onClose} className="text-sm text-text-dim hover:text-gold">
          Закрити
        </button>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
        <div className="h-full rounded-full bg-gold" style={{ width: `${((step + 1) / groups.length) * 100}%` }} />
      </div>
      <div className="mt-2 text-xs text-text-faint">
        {step + 1} / {groups.length}
      </div>

      <h2 className="mt-4 font-display text-2xl text-gold">{group.label}</h2>
      <p className="mt-1 text-sm text-text-dim">Що з цього у тебе є?</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {group.items.map((it) => {
          const on = ownedSet.has(it.nameUk);
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => (on ? remove(it.nameUk) : add(it.nameUk))}
              className={
                "flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition " +
                (on ? "border-gold bg-gold/15 text-text" : "border-border bg-surface-alt text-text-dim")
              }
            >
              {on && <Check size={14} className="text-gold" />}
              {it.nameUk}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
          className="flex-1 rounded-xl border border-border px-4 py-3 text-center font-bold text-text-dim"
        >
          {step === 0 ? "Скасувати" : "Назад"}
        </button>
        <button
          onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
          className="flex-1 rounded-xl bg-gold px-4 py-3 text-center font-bold text-bg"
        >
          {isLast ? "Готово" : "Далі"}
        </button>
      </div>
    </div>
  );
}
