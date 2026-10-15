import { useTheme } from "@/src/theme/useTheme";
/**
 * components/library/SearchBar.tsx
 *
 * Debounced search input wired to useLibraryStore.
 * Maintains a local value for instant visual feedback while the store
 * update (and any downstream filtering) is debounced to avoid thrashing.
 */

import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";

import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { searchPlantNames } from "@/src/services/plantSearch";
import {
  selectSearchQuery,
  useLibraryStore,
} from "@/src/store/useLibraryStore";
import { useTranslation } from "@/src/i18n/useTranslation";


const DEBOUNCE_MS = 320;

interface SearchBarProps {
  placeholder?: string;
  debounceMs?: number;
  onSearch?: (query: string) => void;
  onFocusChange?: (focused: boolean) => void;
  showSuggestions?: boolean;
}

export function SearchBar({
  placeholder,
  debounceMs = DEBOUNCE_MS,
  onSearch,
  onFocusChange,
  showSuggestions = true,
}: SearchBarProps) {
  const theme = useTheme();

  const isDark = theme.isDark;
  const { t } = useTranslation();

  const committedQuery = useLibraryStore(selectSearchQuery);
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery);

  const [localValue, setLocalValue] = useState<string>(committedQuery);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const router = useRouter();

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const plants = useLibraryStore((s) => s.plants);

  const sourceList = plants;

  const suggestions = React.useMemo(() => {
    if (!localValue || localValue.trim().length === 0) return [];
    try {
      return searchPlantNames(sourceList, localValue).slice(0, 6);
    } catch (e) {
      return [];
    }
  }, [localValue, sourceList]);

  useEffect(() => {
    if (committedQuery === "" && localValue !== "") {
      setLocalValue("");
    }
  }, [committedQuery]);

  const commitQuery = useCallback(
    (text: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      setIsBusy(true);

      debounceTimer.current = setTimeout(() => {
        try {
          setSearchQuery(text);
          onSearch?.(text);
        } catch (err) {
          if (__DEV__) console.error("[SearchBar] Failed to commit search query:", err);
        } finally {
          setIsBusy(false);
        }
      }, debounceMs);
    },
    [setSearchQuery, onSearch, debounceMs],
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleChangeText = (text: string) => {
    setLocalValue(text);
    commitQuery(text);
  };

  const handleSubmit = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSearchQuery(localValue);
    onSearch?.(localValue);
    setIsBusy(false);
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  const handleClear = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setLocalValue("");
    setIsBusy(false);
    try {
      setSearchQuery("");
      onSearch?.("");
    } catch (err) {
      if (__DEV__) console.error("[SearchBar] Failed to clear search query:", err);
    }
    inputRef.current?.focus();
  };

  const hasValue = localValue.length > 0;

  /** Exits focus mode: clears the field, drops the keyboard, restores chrome. */
  const handleCancel = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setLocalValue("");
    setIsBusy(false);
    try {
      setSearchQuery("");
      onSearch?.("");
    } catch (err) {
      if (__DEV__) console.error("[SearchBar] Failed to cancel search:", err);
    }
    inputRef.current?.blur();
  };

  return (
    // The row wrapper lets Cancel sit beside the field. Previously the field
    // filled the width and the only way out of search was the Android back
    // button or tapping the list — neither is discoverable.
    <View className="mx-6 my-2 z-50" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          flex: 1,
          flexDirection: "row", alignItems: "center",
          // Was transparent, so the input read as a floating outline with no
          // sense of being a field. A tinted fill makes it feel tappable.
          backgroundColor: isFocused || hasValue
            ? (theme.surface)
            : (theme.surfaceHighlight),
          borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: hasValue || isFocused
            ? (theme.accentSoftBorder)
            : (theme.border)
        }}
      >

        <Ionicons
          name="search-outline"
          size={18}
          color={hasValue ? (theme.accent) : (theme.textSecondary)}
          style={{ marginRight: 8 }}
        />

        <TextInput
          ref={inputRef}
          style={{
            flex: 1, fontFamily: "Quicksand_600SemiBold", fontSize: 14,
            color: theme.textPrimary
          }}
          value={localValue}
          onChangeText={handleChangeText}
          onFocus={() => { setIsFocused(true); onFocusChange?.(true); }}
          onBlur={() => { setIsFocused(false); onFocusChange?.(false); }}
          placeholder={placeholder ?? t('library_search')}
          placeholderTextColor={theme.textSecondary}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
          accessibilityLabel={placeholder ?? t('library_search')}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
        />

        {isBusy && hasValue ? (
          <ActivityIndicator
            size="small"
            color={theme.accent}
            style={{ marginLeft: 8 }}
          />
        ) : hasValue ? (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <View
              style={{
                backgroundColor: theme.surfaceTint,
                width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center"
              }}
            >
              <Ionicons name="close" size={12} color={theme.textPrimary} />
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Cancel — only while the search is active, so it costs no width at rest. */}
      {(isFocused || hasValue) && (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
          <TouchableOpacity
            onPress={handleCancel}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t("lib_cancel")}
          >
            <Text
              style={{
                fontFamily: "Quicksand_700Bold",
                fontSize: 15,
                color: theme.accent,
              }}
            >
              {t("lib_cancel")}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Suggestions dropdown */}

      {showSuggestions && isFocused && hasValue && suggestions.length > 0 && (
        <Animated.View
          entering={FadeInDown.duration(280).springify().damping(24)}
          exiting={FadeOut.duration(160)}
          style={{
            position: "absolute", top: 56, left: 0, right: 0,
            backgroundColor: theme.surface,
            borderRadius: 18, overflow: "hidden",
            borderWidth: 1, borderColor: theme.border,
            shadowColor: theme.shadow, shadowOpacity: isDark ? 0.35 : 0.1, shadowRadius: 28, shadowOffset: { width: 0, height: 16 },
            elevation: 12, zIndex: 100
          }}
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.borderSubtle }}>
            <Text style={{ fontSize: 10, fontFamily: "Quicksand_700Bold", letterSpacing: 1.4, textTransform: "uppercase", color: theme.textSecondary }}>
              {t('lib_suggestions')}
            </Text>
          </View>
          {suggestions.map((s: any, index: number) => (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.65}
              // Prevent keyboard dismissal from blocking the tap
              onPressIn={() => {
                setLocalValue(s.name);
                if (debounceTimer.current) clearTimeout(debounceTimer.current);
                setIsBusy(true);
                try {
                  setSearchQuery(s.name);
                  onSearch?.(s.name);
                } finally {
                  setIsBusy(false);
                }
                inputRef.current?.blur();
                router.push(`/(tabs)/library/${s.id}`);
              }}
              style={{
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 12,
                borderBottomWidth: index === suggestions.length - 1 ? 0 : 1,
                borderBottomColor: theme.borderSubtle
              }}
            >
              {/* Icon */}
              <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: theme.surfaceTint, marginRight: 12 }}>
                <Feather name="book-open" size={15} color={theme.textSecondary} />
              </View>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.textPrimary, fontSize: 14, marginBottom: 1 }}>{s.name}</Text>
                {s.scientificName ? (
                  <Text style={{ fontFamily: "Quicksand_500Medium", fontStyle: "italic", color: theme.textSecondary, fontSize: 11 }} numberOfLines={1}>
                    {s.scientificName}
                  </Text>
                ) : null}
              </View>

              <Feather name="chevron-right" size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

