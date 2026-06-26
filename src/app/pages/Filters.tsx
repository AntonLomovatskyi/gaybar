import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Chip } from "@/components/Chip";
import { ToolIcon } from "@/components/ToolIcon";
import { TAG_GROUPS } from "@/data/catalog/taxonomy";
import { useAllCocktails } from "@/data/useCocktails";
import { glassOf, type SortMode } from "@/domain/cocktails";
import { useT } from "@/i18n";
import { useFilterStore } from "@/store/filterStore";

const SORTS: SortMode[] = ["card", "name", "strength", "ingredients"];

export default function Filters() {
  const t = useT();
  const nav = useNavigate();
  const all = useAllCocktails();
  const { tags, glasses, sort, toggleTag, toggleGlass, clear, setSort } = useFilterStore();

  // distinct glasses actually used in the catalog, by frequency
  const glassOptions = useMemo(() => {
    const counts = new Map<string, { id: string; nameUk: string; n: number }>();
    for (const c of all) {
      const g = glassOf(c);
      if (!g) continue;
      const e = counts.get(g.id) ?? { id: g.id, nameUk: g.nameUk, n: 0 };
      e.n += 1;
      counts.set(g.id, e);
    }
    return [...counts.values()].sort((a, b) => b.n - a.n);
  }, [all]);

  return (
    <div className="px-4 py-4">
      <h1 className="font-display text-2xl text-text">{t.common.filters}</h1>

      <div className="mt-5">
        <div className="text-sm text-text-faint">{t.common.sort}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {SORTS.map((s) => (
            <Chip key={s} label={t.sort[s]} selected={sort === s} onClick={() => setSort(s)} />
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm text-text-faint">{t.recipe.glass}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {glassOptions.map((g) => {
            const on = glasses.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGlass(g.id)}
                className={
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition " +
                  (on ? "border-gold bg-gold/15 text-text" : "border-border bg-surface-alt text-text-dim")
                }
              >
                <ToolIcon id={g.id} size={16} className={on ? "text-gold" : "text-text-faint"} />
                {g.nameUk}
              </button>
            );
          })}
        </div>
      </div>

      {TAG_GROUPS.map((group) => (
        <div key={group.key} className="mt-5">
          <div className="text-sm text-text-faint">{group.labelUk}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {group.tags.map((tag) => (
              <Chip key={tag} label={tag} selected={tags.includes(tag)} onClick={() => toggleTag(tag)} />
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => clear()}
          className="flex-1 rounded-xl border border-border px-4 py-3 text-center font-bold text-text-dim"
        >
          {t.common.clear}
        </button>
        <button onClick={() => nav(-1)} className="flex-1 rounded-xl bg-gold px-4 py-3 text-center font-bold text-bg">
          {t.common.apply}
        </button>
      </div>
    </div>
  );
}
