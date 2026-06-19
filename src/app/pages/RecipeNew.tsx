import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Chip } from "@/components/Chip";
import { useCocktailById } from "@/data/useCocktails";
import { useT } from "@/i18n";
import { useUserStore } from "@/store/userStore";
import { COCKTAIL_TAGS, UNITS, type Cocktail, type CocktailTag, type Ingredient, type Unit } from "@/types/cocktail";

interface IngredientRow {
  name: string;
  amount: string;
  unit: Unit | "";
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `my-${Date.now()}`;
}

export default function RecipeNew() {
  const t = useT();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit") ?? undefined;
  const existing = useCocktailById(editId);
  const addUserRecipe = useUserStore((s) => s.addUserRecipe);
  const removeUserRecipe = useUserStore((s) => s.removeUserRecipe);

  const initial = useMemo(() => existing, [editId]);

  const [name, setName] = useState(initial?.name ?? "");
  const [tags, setTags] = useState<CocktailTag[]>(initial?.tags ?? []);
  const [glass, setGlass] = useState(initial?.glass ?? "");
  const [tools, setTools] = useState((initial?.tools ?? []).join("\n"));
  const [steps, setSteps] = useState((initial?.steps ?? []).join("\n"));
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    initial && initial.ingredients.length
      ? initial.ingredients.map((i) => ({
          name: i.name,
          amount: i.amount != null ? String(i.amount) : "",
          unit: i.unit ?? "",
        }))
      : [{ name: "", amount: "", unit: "" }],
  );
  const [error, setError] = useState(false);

  const toggleTag = (tag: CocktailTag) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));

  const updateIngredient = (idx: number, patch: Partial<IngredientRow>) =>
    setIngredients((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const removeIngredient = (idx: number) =>
    setIngredients((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const addIngredient = () => setIngredients((prev) => [...prev, { name: "", amount: "", unit: "" }]);

  const splitLines = (raw: string): string[] =>
    raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const save = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(true);
      return;
    }

    const builtIngredients: Ingredient[] = ingredients
      .filter((row) => row.name.trim())
      .map((row) => {
        const amountNum = row.amount.trim() ? Number(row.amount) : undefined;
        const out: Ingredient = { name: row.name.trim() };
        if (amountNum != null && !Number.isNaN(amountNum)) out.amount = amountNum;
        if (row.unit) out.unit = row.unit;
        return out;
      });

    const id = editId ?? slugify(trimmedName);

    const cocktail: Cocktail = {
      id,
      cardNumber: 0,
      name: trimmedName,
      tags,
      ingredients: builtIngredients,
      tools: splitLines(tools),
      steps: splitLines(steps),
      glass: glass.trim() || undefined,
      images: {},
      source: {},
    };

    if (editId && editId !== id) removeUserRecipe(editId);
    addUserRecipe(cocktail);
    nav(`/cocktail/${cocktail.id}`);
  };

  const labelCls = "text-sm font-bold text-gold";
  const inputCls =
    "w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-text outline-none placeholder:text-text-faint focus:border-gold";

  return (
    <div className="px-4 py-4">
      <h1 className="font-display text-2xl text-text">{editId ? "Редагувати рецепт" : "Новий рецепт"}</h1>

      <div className="mt-5 space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <div className={labelCls}>Назва</div>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(false);
            }}
            placeholder="Напр. Маргарита"
            className={inputCls}
          />
          {error && <div className="text-sm text-danger">Введіть назву</div>}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <div className={labelCls}>Теги</div>
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-xl border border-border bg-surface p-3">
            {COCKTAIL_TAGS.map((tag) => (
              <Chip key={tag} label={tag} selected={tags.includes(tag)} onClick={() => toggleTag(tag)} />
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <div className={labelCls}>{t.recipe.ingredients}</div>
          <div className="space-y-2">
            {ingredients.map((row, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={row.name}
                  onChange={(e) => updateIngredient(idx, { name: e.target.value })}
                  placeholder="Інгредієнт"
                  className="min-w-0 flex-1 rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-text outline-none placeholder:text-text-faint focus:border-gold"
                />
                <input
                  value={row.amount}
                  onChange={(e) => updateIngredient(idx, { amount: e.target.value })}
                  inputMode="decimal"
                  placeholder="К-сть"
                  className="w-20 rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-text outline-none placeholder:text-text-faint focus:border-gold"
                />
                <select
                  value={row.unit}
                  onChange={(e) => updateIngredient(idx, { unit: e.target.value as Unit | "" })}
                  className="w-24 rounded-xl border border-border bg-surface-alt px-2 py-2.5 text-text outline-none focus:border-gold"
                >
                  <option value="">—</option>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="flex w-10 shrink-0 items-center justify-center rounded-xl border border-border text-text-dim hover:border-danger hover:text-danger"
                  aria-label={t.common.remove}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredient}
            className="flex items-center gap-1 rounded-full border border-gold px-3 py-1.5 text-sm text-gold"
          >
            <Plus size={15} /> {t.common.add}
          </button>
        </div>

        {/* Tools */}
        <div className="space-y-2">
          <div className={labelCls}>{t.recipe.tools}</div>
          <textarea
            value={tools}
            onChange={(e) => setTools(e.target.value)}
            placeholder="Кожен інструмент з нового рядка"
            rows={3}
            className={inputCls}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          <div className={labelCls}>{t.recipe.steps}</div>
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="Кожен крок з нового рядка"
            rows={5}
            className={inputCls}
          />
        </div>

        {/* Glass */}
        <div className="space-y-2">
          <div className={labelCls}>{t.recipe.glass}</div>
          <input
            value={glass}
            onChange={(e) => setGlass(e.target.value)}
            placeholder="Напр. Coupe"
            className={inputCls}
          />
        </div>

        <button
          type="button"
          onClick={save}
          className="w-full rounded-xl bg-gold px-4 py-3 text-center font-bold text-bg"
        >
          {t.common.save}
        </button>
      </div>
    </div>
  );
}
