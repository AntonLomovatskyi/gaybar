import { Heart, Pencil, Play, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { Chip } from "@/components/Chip";
import { StarRating } from "@/components/StarRating";
import { Stepper } from "@/components/Stepper";
import { ToolIcon } from "@/components/ToolIcon";
import { toolInfo } from "@/data/catalog/tools";
import { getCardImages } from "@/data/cocktails";
import { useCocktailById } from "@/data/useCocktails";
import { formatIngredient } from "@/domain/cocktails";
import { useT } from "@/i18n";
import { useUserStore } from "@/store/userStore";

export default function CocktailDetail() {
  const t = useT();
  const nav = useNavigate();
  const { id } = useParams();
  const cocktail = useCocktailById(id);

  const [servings, setServings] = useState(1);
  const [showCard, setShowCard] = useState(false);

  const units = useUserStore((s) => s.units);
  const favourites = useUserStore((s) => s.favourites);
  const ratings = useUserStore((s) => s.ratings);
  const shopping = useUserStore((s) => s.shopping);
  const userRecipes = useUserStore((s) => s.userRecipes);
  const toggleFavourite = useUserStore((s) => s.toggleFavourite);
  const setRating = useUserStore((s) => s.setRating);
  const setShoppingServings = useUserStore((s) => s.setShoppingServings);
  const removeUserRecipe = useUserStore((s) => s.removeUserRecipe);

  if (!id || !cocktail) {
    return <div className="px-6 py-16 text-center text-text-dim">Коктейль не знайдено</div>;
  }

  const images = getCardImages(id);
  const isFav = favourites.includes(id);
  const isUserRecipe = userRecipes.some((r) => r.id === id);

  return (
    <div className="px-4 py-4">
      {images?.front && (
        <img
          src={images.front}
          alt={cocktail.name}
          className="mx-auto max-h-[360px] w-full rounded-xl border border-border bg-surface object-contain"
        />
      )}

      <h1 className="mt-4 font-display text-3xl text-text">{cocktail.name}</h1>
      {cocktail.nameEn && <div className="mt-0.5 text-base text-text-dim">{cocktail.nameEn}</div>}

      {cocktail.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {cocktail.tags.map((tag) => (
            <Chip key={tag} label={tag} />
          ))}
        </div>
      )}

      {cocktail.glass && (
        <div className="mt-3 text-sm text-text-dim">
          <span className="text-gold font-bold">{t.recipe.glass}:</span> {cocktail.glass}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => toggleFavourite(id)}
          aria-label={t.tabs.favourites}
          className={clsx(
            "grid h-11 w-11 place-items-center rounded-full border",
            isFav ? "border-gold text-gold" : "border-border text-text-dim",
          )}
        >
          <Heart size={20} fill={isFav ? "currentColor" : "none"} />
        </button>
        <div>
          <div className="text-xs text-text-faint">{t.recipe.rate}</div>
          <StarRating value={ratings[id] ?? 0} onChange={(n) => setRating(id, n)} />
        </div>
      </div>

      <button
        onClick={() => nav(`/cocktail/${id}/make`)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-center font-bold text-bg"
      >
        <Play size={18} /> {t.recipe.start}
      </button>

      <button
        onClick={() => setShoppingServings(id, (shopping[id] ?? 0) + 1)}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-center font-bold text-text"
      >
        <ShoppingCart size={18} /> {t.recipe.addToShopping}
        {shopping[id] ? ` (${shopping[id]})` : ""}
      </button>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-gold font-bold">{t.recipe.ingredients}</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-faint">{t.shopping.servings}</span>
            <Stepper value={servings} onChange={setServings} min={1} max={12} />
          </div>
        </div>
        <ul className="mt-3 space-y-2">
          {cocktail.ingredients.map((ing, idx) => (
            <li key={`${ing.name}-${idx}`} className="rounded-xl border border-border bg-surface p-3 text-sm text-text">
              {formatIngredient(ing, servings, units)}
            </li>
          ))}
        </ul>
      </section>

      {cocktail.tools.length > 0 && (
        <section className="mt-6">
          <h2 className="text-gold font-bold">{t.recipe.tools}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {cocktail.tools.map((tool, idx) => {
              const info = toolInfo(tool);
              return (
                <Link
                  key={`${tool}-${idx}`}
                  to={`/tool/${info.id}`}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface-alt px-3 py-1.5 text-sm text-text-dim transition hover:border-gold/60 hover:text-text"
                >
                  <ToolIcon id={info.id} size={18} className="text-gold" />
                  {tool}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {cocktail.steps.length > 0 && (
        <section className="mt-6">
          <h2 className="text-gold font-bold">{t.recipe.steps}</h2>
          <ol className="mt-3 space-y-2">
            {cocktail.steps.map((step, idx) => (
              <li key={idx} className="flex gap-3 rounded-xl border border-border bg-surface p-3 text-sm text-text">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {(images?.front || images?.back) && (
        <section className="mt-6">
          <button
            onClick={() => setShowCard((v) => !v)}
            className="rounded-full border border-border px-3 py-1.5 text-sm text-text-dim"
          >
            {t.recipe.viewCard}
          </button>
          {showCard && (
            <div className="mt-3 space-y-3">
              {images?.front && (
                <img
                  src={images.front}
                  alt={`${cocktail.name} — front`}
                  className="w-full rounded-xl border border-border object-contain"
                />
              )}
              {images?.back && (
                <img
                  src={images.back}
                  alt={`${cocktail.name} — back`}
                  className="w-full rounded-xl border border-border object-contain"
                />
              )}
            </div>
          )}
        </section>
      )}

      {isUserRecipe && (
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => nav(`/recipe/new?edit=${id}`)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 font-bold text-text"
          >
            <Pencil size={16} /> Редагувати
          </button>
          <button
            onClick={() => {
              removeUserRecipe(id);
              nav("/");
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-danger px-4 py-3 font-bold text-danger"
          >
            <Trash2 size={16} /> {t.common.remove}
          </button>
        </div>
      )}
    </div>
  );
}
