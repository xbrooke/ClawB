import { useState, useEffect } from "react";

export type ThemeId = "github-dark" | "frost";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>(() => {
    const saved = localStorage.getItem("clawb-theme") as ThemeId | null;
    return saved || "github-dark";
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute("data-ui-theme") as ThemeId | null;
      if (current) {
        setTheme(current);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-ui-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}