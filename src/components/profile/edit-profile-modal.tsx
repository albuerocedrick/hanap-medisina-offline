import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AppSheet } from "@/src/components/ui/AppSheet";
import { useTheme } from "@/src/theme/useTheme";
import { useTranslation } from "@/src/i18n/useTranslation";

export function EditProfileModal({ visible, currentFirstName, currentLastName, onSave, onClose }: { visible: boolean; currentFirstName: string; currentLastName: string; onSave: (firstName: string, lastName: string) => void; onClose: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(currentFirstName);
  const [lastName, setLastName] = useState(currentLastName);
  useEffect(() => {
    if (visible) { setFirstName(currentFirstName); setLastName(currentLastName); }
  }, [visible, currentFirstName, currentLastName]);
  const valid = !!firstName.trim();
  const changed = firstName.trim() !== currentFirstName || lastName.trim() !== currentLastName;
  const enabled = valid && changed;
  return <AppSheet visible={visible} title={t("profile_edit")} onClose={onClose}>
    {[
      { label: t("profile_first_name"), value: firstName, change: setFirstName, placeholder: t("profile_your_first_name") },
      { label: `${t("profile_last_name")} ${t("profile_optional")}`, value: lastName, change: setLastName, placeholder: t("profile_your_last_name") },
    ].map((field, index) => <View key={index} style={{ marginBottom: 18 }}>
      <Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.textSecondary, fontSize: 13, marginBottom: 8 }}>{field.label}</Text>
      <TextInput value={field.value} onChangeText={field.change} placeholder={field.placeholder} placeholderTextColor={theme.textMuted} accessibilityLabel={field.label} maxLength={30} autoCorrect={false} autoCapitalize="words" style={{ minHeight: 54, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: index === 0 && !valid ? theme.danger : theme.border, backgroundColor: theme.surfaceTint, fontFamily: "Quicksand_600SemiBold", fontSize: 16, color: theme.textPrimary }} />
      {index === 0 && !valid && <Text style={{ color: theme.danger, fontFamily: "Quicksand_500Medium", fontSize: 12, marginTop: 6 }}>{t("profile_name_required")}</Text>}
    </View>)}
    <Pressable disabled={!enabled} accessibilityRole="button" accessibilityState={{ disabled: !enabled }} onPress={() => { if (!enabled) return; onSave(firstName.trim(), lastName.trim()); onClose(); }} style={{ minHeight: 54, borderRadius: 14, backgroundColor: enabled ? theme.accent : theme.accentSubtle, alignItems: "center", justifyContent: "center", marginTop: 4 }}>
      <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 15, color: enabled ? theme.textOnAccent : theme.textMuted }}>{t("profile_save_changes")}</Text>
    </Pressable>
  </AppSheet>;
}
