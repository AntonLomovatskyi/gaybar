import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import Bar from "./pages/Bar";
import CocktailDetail from "./pages/CocktailDetail";
import Collection from "./pages/Collection";
import Favourites from "./pages/Favourites";
import Filters from "./pages/Filters";
import History from "./pages/History";
import Make from "./pages/Make";
import RecipeNew from "./pages/RecipeNew";
import SetMake from "./pages/SetMake";
import SetPlan from "./pages/SetPlan";
import Sets from "./pages/Sets";
import Settings from "./pages/Settings";
import Shopping from "./pages/Shopping";
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
        { path: "shopping", element: <Shopping /> },
        { path: "favourites", element: <Favourites /> },
        { path: "tool/:id", element: <ToolDetail /> },
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
