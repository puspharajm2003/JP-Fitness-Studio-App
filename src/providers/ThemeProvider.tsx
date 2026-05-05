import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { themes, getTheme, ThemeId } from "@/lib/themes";

interface Ctx { themeId: ThemeId; setTheme: (id: ThemeId) => void; }
const ThemeCtx = createContext<Ctx>({ themeId: "sunrise", setTheme: () => {} });

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeId, setThemeId] = useState<ThemeId>(() => (localStorage.getItem("jp-theme") as ThemeId) || "sunrise");

  useEffect(() => {
    const t = getTheme(themeId);
    const root = document.documentElement;
    Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    if (themeId === "midnight") root.classList.add("dark"); else root.classList.remove("dark");
    localStorage.setItem("jp-theme", themeId);
  }, [themeId]);

  return <ThemeCtx.Provider value={{ themeId, setTheme: setThemeId }}>{children}</ThemeCtx.Provider>;
};

export const useTheme = () => useContext(ThemeCtx);
export { themes };
