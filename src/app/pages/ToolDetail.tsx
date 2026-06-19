import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { CocktailCard } from "@/components/CocktailCard";
import { ToolIcon } from "@/components/ToolIcon";
import { TOOL_BY_ID, toolInfo } from "@/data/catalog/tools";
import { useAllCocktails } from "@/data/useCocktails";
import { useT } from "@/i18n";

export default function ToolDetail() {
  const t = useT();
  const { id } = useParams();
  const all = useAllCocktails();
  const tool = id ? TOOL_BY_ID[id] : undefined;

  const matches = useMemo(() => {
    if (!tool) return [];
    return all.filter((c) => c.tools.some((raw) => toolInfo(raw).id === tool.id));
  }, [all, tool]);

  if (!tool) {
    return <div className="px-6 py-16 text-center text-text-dim">не знайдено</div>;
  }

  const kindLabel = tool.kind === "glass" ? t.recipe.glass : t.recipe.tools;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border border-border bg-surface-alt text-gold">
          <ToolIcon id={tool.id} size={44} />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-text">{tool.nameUk}</h1>
          <div className="mt-0.5 text-sm text-gold">{kindLabel}</div>
        </div>
      </div>

      <p className="mt-3 text-sm text-text-dim">{tool.desc}</p>

      <div className="mt-6 mb-2 font-bold text-gold">Коктейлі з цим</div>
      {matches.length === 0 ? (
        <div className="py-12 text-center text-text-dim">{t.common.none}</div>
      ) : (
        <>
          <div className="mb-2 text-xs text-text-faint">{matches.length} коктейлів</div>
          <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(108px,1fr))]">
            {matches.map((c) => (
              <CocktailCard key={c.id} cocktail={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
