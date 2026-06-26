import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { alcoholicCanonicals, freshCanonicals, type CanonicalIngredient } from "@/data/catalog/ingredients";
import { useUserStore } from "@/store/userStore";

export type SetupKind = "alcohol" | "fresh";

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

const FRESH_GROUPS: { cats: string[]; label: string }[] = [
  { cats: ["fruit"], label: "Фрукти та ягоди" },
  { cats: ["herb"], label: "Трави" },
  { cats: ["spice"], label: "Спеції" },
  { cats: ["dairy", "egg"], label: "Молочне та яйця" },
  { cats: ["juice"], label: "Соки" },
  { cats: ["syrup"], label: "Сиропи" },
  { cats: ["garnish"], label: "Прикраси" },
  { cats: ["mixer"], label: "Напої" },
  { cats: ["other", "pantry"], label: "Інше" },
];

function alcoholGroups(): Group[] {
  const all = alcoholicCanonicals();
  const groups: Group[] = [];
  const used = new Set(SPIRIT_FAMILIES.map((s) => s.family));
  for (const { family, label } of SPIRIT_FAMILIES) {
    const items = all.filter((c) => c.category === "spirit" && c.family === family);
    if (items.length) groups.push({ key: family, label, items });
  }
  const other = all.filter((c) => c.category === "spirit" && (!c.family || !used.has(c.family)));
  if (other.length) groups.push({ key: "other-spirit", label: "Інші міцні", items: other });
  for (const [cat, label] of [
    ["liqueur", "Лікери"],
    ["wine", "Вермут та вино"],
    ["beer", "Пиво"],
    ["bitters", "Бітери"],
  ] as const) {
    const items = all.filter((c) => c.category === cat);
    if (items.length) groups.push({ key: cat, label, items });
  }
  return groups;
}

function freshGroups(): Group[] {
  const all = freshCanonicals();
  const groups: Group[] = [];
  for (const g of FRESH_GROUPS) {
    const items = all.filter((c) => g.cats.includes(c.category));
    if (items.length) groups.push({ key: g.label, label: g.label, items });
  }
  return groups;
}

export function EssentialsSetup({ kind, onClose }: { kind: SetupKind; onClose: () => void }) {
  const owned = useUserStore((s) => s.ownedIngredients);
  const add = useUserStore((s) => s.addOwnedIngredient);
  const remove = useUserStore((s) => s.removeOwnedIngredient);
  const groups = useMemo(() => (kind === "alcohol" ? alcoholGroups() : freshGroups()), [kind]);
  const [step, setStep] = useState(0);

  const title = kind === "alcohol" ? "🍸 Алкоголь" : "🍓 Свіже та інше";
  const group = groups[step];
  const isLast = step === groups.length - 1;
  const ownedSet = new Set(owned);

  if (!group) return <div className="px-6 py-16 text-center text-text-dim">Нема що додати</div>;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-text">{title}</h1>
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
