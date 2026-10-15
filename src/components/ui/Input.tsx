import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/useTheme";
import { useTranslation } from "@/src/i18n/useTranslation";

interface InputProps extends TextInputProps {
  icon?: any;
  isPassword?: boolean;
}

export function Input({ icon: Icon, isPassword, style, ...props }: InputProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const[showPassword, setShowPassword] = useState(false);

  const focusedColor = theme.accent;
  const unfocusedColor = theme.textMuted;

  return (
    <View
      className="flex-row items-center rounded-full px-5 h-[56px] border mb-4 transition-all"
      style={{ backgroundColor: isFocused ? theme.surface : theme.surfaceTint, borderColor: isFocused ? theme.accent : theme.border }}
    >
      {Icon && (
        <Icon
          color={isFocused ? focusedColor : unfocusedColor}
          size={22}
          strokeWidth={isFocused ? 2 : 1.5}
        />
      )}

      <TextInput
        className="flex-1 text-[16px] h-full font-medium ml-3"
        style={[{ color: theme.textPrimary }, style]}
        placeholderTextColor={unfocusedColor}
        secureTextEntry={isPassword && !showPassword}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      {isPassword && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t(showPassword ? "a11y_hide_password" : "a11y_show_password")}
          onPress={() => {
            Haptics.selectionAsync();
            setShowPassword(!showPassword);
          }}
          className="h-full justify-center pl-2"
        >
          {showPassword ? (
            <EyeOff color={isFocused ? focusedColor : unfocusedColor} size={22} strokeWidth={1.5} />
          ) : (
            <Eye color={isFocused ? focusedColor : unfocusedColor} size={22} strokeWidth={1.5} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
