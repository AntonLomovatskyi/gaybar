import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import Ask from "./pages/Ask";
import Bar from "./pages/Bar";
import CocktailDetail from "./pages/CocktailDetail";
import Collection from "./pages/Collection";
import Favourites from "./pages/Favourites";
import Filters from "./pages/Filters";
import Guests from "./pages/Guests";
import History from "./pages/History";
import IngredientDetail from "./pages/IngredientDetail";
import Make from "./pages/Make";
import RecipeNew from "./pages/RecipeNew";
import SetMake from "./pages/SetMake";
import SetPlan from "./pages/SetPlan";
import Sets from "./pages/Sets";
import Quiz from "./pages/Quiz";
import Settings from "./pages/Settings";
import Stats from "./pages/Stats";
import Taste from "./pages/Taste";
import ToolDetail from "./pages/ToolDetail";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

export const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { index: true, element: <Collection /> },
        { path: "cocktail/:id", element: <CocktailDetail /> },
        { path: "cocktail/:id/make", element: <Make /> },
        { path: "sets", element: <Sets /> },
        { path: "set/plan", element: <SetPlan /> },
        { path: "set/make", element: <SetMake /> },
        { path: "bar", element: <Bar /> },
        { path: "favourites", element: <Favourites /> },
        { path: "tool/:id", element: <ToolDetail /> },
        { path: "ingredient/:id", element: <IngredientDetail /> },
        { path: "ask", element: <Ask /> },
        { path: "guests", element: <Guests /> },
        { path: "stats", element: <Stats /> },
        { path: "taste", element: <Taste /> },
        { path: "quiz", element: <Quiz /> },
        { path: "history", element: <History /> },
        { path: "settings", element: <Settings /> },
        { path: "recipe/new", element: <RecipeNew /> },
        { path: "filters", element: <Filters /> },
        { path: "*", element: <Collection /> },
      ],
    },
  ],
  { basename },
);
