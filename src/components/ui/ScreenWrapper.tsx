import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  ViewProps,
} from "react-native";
import { useTheme } from "@/src/theme/useTheme";
import { cn } from "@/src/lib/utils";

interface ScreenWrapperProps extends ViewProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  avoidKeyboard?: boolean;
}

export function ScreenWrapper({
  children,
  scroll = false,
  padded = true,
  avoidKeyboard = false,
  style,
  className,
  ...props
}: ScreenWrapperProps) {
  const theme = useTheme();
  const content = (
    <View
      className={cn("flex-1", padded && "px-6 pt-6 pb-8", className)}
      style={[{ backgroundColor: theme.bg }, style]}
      {...props}
    >
      {children}
    </View>
  );

  const scrollable = scroll ? (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  ) : content;

  if (avoidKeyboard) {
    return (
      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor: theme.bg }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {scrollable}
      </KeyboardAvoidingView>
    );
  }

  return scrollable;
}
