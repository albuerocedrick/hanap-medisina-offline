import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from "react-native";
import { useTheme } from "@/src/theme/useTheme";
import { cn } from "@/src/lib/utils";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
  variant?: "primary" | "outline";
}

export function Button({ title, isLoading, variant = "primary", className, style, ...props }: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isLoading || props.disabled}
      className={cn("h-[56px] rounded-full items-center justify-center flex-row w-full mb-4", !isPrimary && "border-[1.5px]", className)}
      style={[{ backgroundColor: isPrimary ? theme.accentStrong : "transparent", borderColor: theme.border }, style]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? theme.onImage : theme.accent} />
      ) : (
        <Text className="text-[16px] font-bold tracking-wide" style={{ color: isPrimary ? theme.onImage : theme.textPrimary }}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
