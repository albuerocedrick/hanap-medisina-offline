import React from "react";
import { Text, TextProps } from "react-native";

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
 * Each variant also carries a `dark:` value. Without them this component
 * rendered dark-green text on the near-black dark background.
 */
const colorStyles: Record<string, string> = {
  primary:   "text-[#22451C] dark:text-[#F8FAFC]", // 12.4:1 / 15.8:1
  secondary: "text-[#4D8035] dark:text-[#A2CFA3]", //  4.6:1 /  9.7:1
  muted:     "text-[#4D8035] dark:text-[#A2CFA3]", //  4.6:1 /  9.7:1
};

export function Typography({
  variant = "body",
  color = "primary",
  children,
  ...props
}: TypographyProps) {
  return (
    <Text
      className={`${variantStyles[variant]} ${colorStyles[color]}`}
      {...props}
    >
      {children}
    </Text>
  );
}
