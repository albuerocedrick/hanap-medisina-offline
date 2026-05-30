/**
 * src/components/profile/edit-profile-modal.tsx
 * Bottom-sheet style modal for editing the user's local profile (first name + last name).
 */
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  currentFirstName: string;
  currentLastName: string;
  onSave: (firstName: string, lastName: string) => void;
  onClose: () => void;
}

export function EditProfileModal({
  visible,
  currentFirstName,
  currentLastName,
  onSave,
  onClose,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState(currentFirstName);
  const [lastName, setLastName] = useState(currentLastName);

  // Sync fields when modal opens
  useEffect(() => {
    if (visible) {
      setFirstName(currentFirstName);
      setLastName(currentLastName);
    }
  }, [visible]);

  if (!visible) return null;

  const handleSave = () => {
    const trimmedFirst = firstName.trim();
    if (!trimmedFirst) {
      Alert.alert("First Name Required", "Please enter your first name before saving.");
      return;
    }
    onSave(trimmedFirst, lastName.trim());
    onClose();
  };

  const hasChanges =
    firstName.trim() !== currentFirstName || lastName.trim() !== currentLastName;

  // ── Color tokens ────────────────────────────────────────────────────────────
  const sheetBg = isDark ? "#0F1A0F" : "#FAFEEF";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(162,207,163,0.8)";
  const inputBorderActive = isDark ? "rgba(162,207,163,0.6)" : "#4D8035";
  const labelColor = isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)";
  const textColor = isDark ? "#F8FAFC" : "#22451C";
  const placeholderColor = isDark ? "rgba(248,250,252,0.25)" : "rgba(34,69,28,0.3)";
  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(162,207,163,0.35)";

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999, elevation: 10, justifyContent: "flex-end" }]}>
      {/* Dim backdrop */}
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(11, 18, 11, 0.6)" }]}
        onPress={onClose}
      />

      {/* Bottom sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ width: "100%" }}
      >
        <View
          style={{
            backgroundColor: sheetBg,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.5)",
            paddingBottom: Math.max(insets.bottom, 24) + 88,
            overflow: "hidden",
          }}
        >
          {/* Drag handle */}
          <View
            style={{
              width: 48,
              height: 5,
              borderRadius: 3,
              backgroundColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(34,69,28,0.2)",
              alignSelf: "center",
              marginTop: 14,
              marginBottom: 4,
            }}
          />

          {/* Header row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                color: labelColor,
                fontFamily: "Quicksand_700Bold",
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              Edit Profile
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(162,207,163,0.25)",
              }}
              activeOpacity={0.7}
            >
              <Feather name="x" size={16} color={isDark ? "rgba(248,250,252,0.85)" : "#22451C"} />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: dividerColor, marginHorizontal: 24 }} />

          {/* Form */}
          <View style={{ paddingHorizontal: 24, paddingTop: 20, gap: 16 }}>

            {/* First Name field */}
            <View>
              <Text
                style={{
                  color: labelColor,
                  fontFamily: "Quicksand_600SemiBold",
                  fontSize: 11,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  marginBottom: 8,
                  marginLeft: 2,
                }}
              >
                First Name
              </Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Your first name"
                placeholderTextColor={placeholderColor}
                maxLength={30}
                autoCorrect={false}
                style={{
                  backgroundColor: inputBg,
                  borderWidth: 1,
                  borderColor: firstName.length > 0 ? inputBorderActive : inputBorder,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: textColor,
                  fontFamily: "Quicksand_600SemiBold",
                  fontSize: 15,
                }}
              />
            </View>

            {/* Last Name field */}
            <View>
              <Text
                style={{
                  color: labelColor,
                  fontFamily: "Quicksand_600SemiBold",
                  fontSize: 11,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  marginBottom: 8,
                  marginLeft: 2,
                }}
              >
                Last Name{" "}
                <Text style={{ fontFamily: "Quicksand_500Medium", fontSize: 10, textTransform: "none" }}>
                  (optional)
                </Text>
              </Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Your last name"
                placeholderTextColor={placeholderColor}
                maxLength={30}
                autoCorrect={false}
                style={{
                  backgroundColor: inputBg,
                  borderWidth: 1,
                  borderColor: lastName.length > 0 ? inputBorderActive : inputBorder,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: textColor,
                  fontFamily: "Quicksand_600SemiBold",
                  fontSize: 15,
                }}
              />
            </View>

            {/* Save button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!hasChanges}
              activeOpacity={0.8}
              style={{
                backgroundColor: hasChanges
                  ? "#4D8035"
                  : isDark ? "rgba(255,255,255,0.07)" : "rgba(162,207,163,0.3)",
                borderRadius: 18,
                paddingVertical: 15,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 4,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Quicksand_700Bold",
                  fontSize: 15,
                  letterSpacing: 0.3,
                  color: hasChanges
                    ? "#fff"
                    : isDark ? "rgba(248,250,252,0.3)" : "rgba(34,69,28,0.35)",
                }}
              >
                Save Changes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
