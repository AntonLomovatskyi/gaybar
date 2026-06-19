import { useNavigate } from "react-router-dom";
import { Chip } from "@/components/Chip";
import { TAG_GROUPS } from "@/data/catalog/taxonomy";
import type { SortMode } from "@/domain/cocktails";
import { useT } from "@/i18n";
import { useFilterStore } from "@/store/filterStore";

const SORTS: SortMode[] = ["card", "name", "strength", "ingredients"];

export default function Filters() {
  const t = useT();
  const nav = useNavigate();
  const { tags, sort, toggleTag, clear, setSort } = useFilterStore();

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
