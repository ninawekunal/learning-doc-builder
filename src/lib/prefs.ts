import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private windows and blocked site data both throw. Reading stays usable.
  }
};

export const useTheme = (): { theme: Theme; toggleTheme: () => void } => {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current = document.documentElement.dataset.theme;

    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";

      document.documentElement.dataset.theme = next;
      write("ldb-theme", next);

      return next;
    });
  }, []);

  return { theme, toggleTheme };
};

export const useBionic = (): { bionic: boolean; toggleBionic: () => void } => {
  const [bionic, setBionic] = useState(false);

  useEffect(() => {
    setBionic(read("ldb-bionic") === "on");
  }, []);

  const toggleBionic = useCallback(() => {
    setBionic((prev) => {
      write("ldb-bionic", prev ? "off" : "on");

      return !prev;
    });
  }, []);

  return { bionic, toggleBionic };
};

// The last step is unconstrained: the article stretches to fill the whole content
// column instead of stopping at a fixed character count. It is also the default,
// so a doc reads full-width until someone asks for a narrower column.
const WIDTHS = ["64ch", "72ch", "84ch", "100%"] as const;

export type WidthStep = 0 | 1 | 2 | 3;

const isWidthStep = (value: number): value is WidthStep =>
  value === 0 || value === 1 || value === 2 || value === 3;

export const useReadingWidth = (): {
  width: WidthStep;
  cycleWidth: () => void;
} => {
  const [width, setWidth] = useState<WidthStep>(3);

  useEffect(() => {
    const raw = read("ldb-width");
    const stored = raw === null ? NaN : Number(raw);
    const next = isWidthStep(stored) ? stored : 3;

    setWidth(next);
    document.documentElement.style.setProperty("--reading-width", WIDTHS[next]);
  }, []);

  const cycleWidth = useCallback(() => {
    setWidth((prev) => {
      const next = ((prev + 1) % 4) as WidthStep;

      document.documentElement.style.setProperty(
        "--reading-width",
        WIDTHS[next],
      );
      write("ldb-width", String(next));

      return next;
    });
  }, []);

  return { width, cycleWidth };
};
