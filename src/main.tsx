import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { initSync } from "@/lib/sync";
import { useUserStore } from "@/store/userStore";
import "./index.css";

initSync();

function Root() {
  const theme = useUserStore((s) => s.theme);
  const language = useUserStore((s) => s.language);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return <RouterProvider router={router} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
