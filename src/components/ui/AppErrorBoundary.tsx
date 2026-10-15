import React, { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";

export function AppErrorFallback({ retry }: { retry: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  useEffect(() => {
    // Startup can fail before the normal font/hydration effect hides the splash.
    void SplashScreen.hideAsync().catch(error => {
      if (__DEV__) console.warn("[AppErrorBoundary] Could not hide splash screen:", error);
    });
  }, []);
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>
        {t("app_error_title")}
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{t("app_error_body")}</Text>
      <Pressable accessibilityRole="button" onPress={retry} style={[styles.button, { backgroundColor: theme.accent }]}>
        <Text style={{ color: theme.textOnAccent }}>{t("app_error_retry")}</Text>
      </Pressable>
    </View>
  );
}

/** Keeps a failed screen recoverable without exposing internal error details. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.error("[AppErrorBoundary]", error, info.componentStack);
  }

  render() {
    return this.state.failed
      ? <AppErrorFallback retry={() => this.setState({ failed: false })} />
      : this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 32, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "600", textAlign: "center", marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 24, textAlign: "center", marginBottom: 24 },
  button: { minHeight: 48, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
});
