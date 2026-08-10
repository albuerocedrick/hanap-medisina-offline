/**
 * src/theme/useTheme.ts
 *
 * Replaces the pattern currently repeated in nearly every component:
 *
 *   const { colorScheme } = useColorScheme();
 *   const isDark = colorScheme === "dark";
 *   ...
 *   color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)"
 *
 * with:
 *
 *   const t = useTheme();
 *   ...
 *   color: t.textSecondary
 *
 * Wraps nativewind's useColorScheme, so it stays in sync with the existing
 * `toggleColorScheme` in HomeHeader and with Tailwind's `dark:` variants.
 */

import { useColorScheme } from "nativewind";
import { useMemo } from "react";
import { darkTheme, lightTheme, type ThemeTokens } from "./tokens";

export function useTheme(): ThemeTokens & { isDark: boolean } {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return useMemo(
    () => ({ ...(isDark ? darkTheme : lightTheme), isDark }),
    [isDark]
  );
}

export { darkTheme, lightTheme } from "./tokens";
export {
  elevation,
  MIN_TOUCH_TARGET,
  palette,
  radius,
  spacing,
  type ThemeTokens,
} from "./tokens";
