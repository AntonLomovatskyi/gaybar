import { ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { CocktailCard } from "@/components/CocktailCard";
import { abvOf, canonicalById, canonicalIdOf, categoryGroupOf, familyMembers } from "@/data/catalog/ingredients";
import { useAllCocktails } from "@/data/useCocktails";
import { useUserStore } from "@/store/userStore";

export default function IngredientDetail() {
  const { id } = useParams();
  const all = useAllCocktails();
  const owned = useUserStore((s) => s.ownedIngredients);
  const ing = id ? canonicalById(id) : undefined;

  const cocktails = useMemo(
    () => (id ? all.filter((c) => c.ingredients.some((i) => canonicalIdOf(i.name) === id)) : []),
    [all, id],
  );

  if (!ing) return <div className="px-6 py-16 text-center text-text-dim">Інгредієнт не знайдено</div>;

  const abv = abvOf(ing.nameUk);
  const isOwned = owned.some((o) => canonicalIdOf(o) === ing.id);
  const subs = familyMembers(ing.family, ing.id);
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(`${ing.nameUk} коктейль`)}`;

  return (
    <div className="px-4 py-4">
      <h1 className="font-display text-3xl text-text">{ing.nameUk}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-dim">
        <span className="font-bold text-gold">{categoryGroupOf(ing.nameUk)}</span>
        {abv > 0 && <span>≈ {abv}%</span>}
        {isOwned && <span className="text-success">✓ у барі</span>}
      </div>

      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-text-dim hover:text-gold"
      >
        <ExternalLink size={14} /> Шукати в Google
      </a>

      {subs.length > 0 && (
        <section className="mt-6">
          <h2 className="text-gold font-bold">Можна замінити на</h2>
          <p className="mt-1 text-xs text-text-faint">Той самий тип — за гнучкого підбору взаємозамінні</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {subs.map((s) => (
              <Link
                key={s.id}
                to={`/ingredient/${s.id}`}
                className="rounded-full border border-border bg-surface-alt px-3 py-1.5 text-sm text-text-dim hover:border-gold/60 hover:text-text"
              >
                {s.nameUk}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-gold font-bold">Коктейлі з цим ({cocktails.length})</h2>
        {cocktails.length === 0 ? (
          <div className="py-8 text-center text-text-dim">Немає</div>
        ) : (
          <div className="mt-3 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(108px,1fr))]">
            {cocktails.map((c) => (
              <CocktailCard key={c.id} cocktail={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
