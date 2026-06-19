import { CocktailCard } from "@/components/CocktailCard";
import { useAllCocktails } from "@/data/useCocktails";
import { useT } from "@/i18n";
import { useUserStore } from "@/store/userStore";

export default function Favourites() {
  const t = useT();
  const all = useAllCocktails();
  const favourites = useUserStore((s) => s.favourites);
  const list = all.filter((c) => favourites.includes(c.id));

  if (list.length === 0) {
    return <div className="px-6 py-16 text-center text-text-dim">{t.favourites.empty}</div>;
  }
  return (
    <div className="grid gap-2 px-4 pt-4 [grid-template-columns:repeat(auto-fill,minmax(108px,1fr))]">
      {list.map((c) => (
        <CocktailCard key={c.id} cocktail={c} />
      ))}
    </div>
  );
}
