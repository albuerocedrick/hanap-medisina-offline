import React from "react";
import { Text, TextProps } from "react-native";
import { useTheme } from "@/src/theme/useTheme";
import { cn } from "@/src/lib/utils";

interface TypographyProps extends TextProps {
  variant?: "heading" | "subheading" | "body" | "caption" | "label";
  color?: "primary" | "secondary" | "muted";
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  heading:    "text-[32px] font-extrabold tracking-tight",
  subheading: "text-[18px] font-bold",
  body:       "text-[15px] font-medium leading-6",
  caption:    "text-[13px] font-medium leading-5",
  label:      "text-[12px] font-semibold tracking-wide uppercase",
};

/**
 * Contrast ratios are measured against the app backgrounds
 * (#FAFEEF light / #0B120B dark). WCAG AA for normal text is 4.5:1.
 *
 * `muted` intentionally resolves to the same value as `secondary`.
 * It previously used #70A656, which measures 2.81:1 on the cream background and
 * fails AA. #4D8035 is the lightest green in the palette that passes (4.60:1),
 * so there is no room for a third, paler text tier here — express "muted"
 * through size and weight instead of colour.
 *
 * Semantic tokens supply the matching light and dark values for every variant.
 */
export function Typography({
  variant = "body",
  color = "primary",
  children,
  className,
  style,
  ...props
}: TypographyProps) {
  const theme = useTheme();
  const colors = { primary: theme.textPrimary, secondary: theme.textSecondary, muted: theme.textMuted };
  return (
    <Text
      className={cn(variantStyles[variant], className)}
      style={[{ color: colors[color] }, style]}
      {...props}
    >
      {children}
    </Text>
  );
}
