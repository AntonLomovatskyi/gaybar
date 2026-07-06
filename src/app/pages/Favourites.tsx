import { useState } from "react";
import clsx from "clsx";
import { CocktailCard } from "@/components/CocktailCard";
import { useAllCocktails } from "@/data/useCocktails";
import { useUserStore } from "@/store/userStore";

function SegBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex-1 rounded-full border px-3 py-1.5 text-sm transition",
        active ? "border-gold bg-gold/15 text-text" : "border-border text-text-dim hover:border-gold/60",
      )}
    >
      {label}
    </button>
  );
}

export default function Favourites() {
  const all = useAllCocktails();
  const favourites = useUserStore((s) => s.favourites);
  const wishlist = useUserStore((s) => s.wishlist);
  const [tab, setTab] = useState<"fav" | "wish">("fav");

  const ids = tab === "fav" ? favourites : wishlist;
  const list = all.filter((c) => ids.includes(c.id));

  return (
    <div className="px-4 pt-4">
      <div className="flex gap-2">
        <SegBtn active={tab === "fav"} onClick={() => setTab("fav")} label={`❤️ Обране (${favourites.length})`} />
        <SegBtn
          active={tab === "wish"}
          onClick={() => setTab("wish")}
          label={`🔖 Хочу спробувати (${wishlist.length})`}
        />
      </div>

      {list.length === 0 ? (
        <div className="py-16 text-center text-text-dim">
          {tab === "fav" ? "Ще нема обраного" : "Постав 🔖 на коктейлі, які хочеш спробувати"}
        </div>
      ) : (
        <div className="mt-4 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(108px,1fr))]">
          {list.map((c) => (
            <CocktailCard key={c.id} cocktail={c} />
          ))}
        </div>
      )}
    </div>
  );
}
