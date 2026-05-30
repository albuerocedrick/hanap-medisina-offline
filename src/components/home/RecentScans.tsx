import { Feather } from "@expo/vector-icons";
import { router } from "expo-router"; 
import { useColorScheme } from "nativewind"; 
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useHistoryStore } from "../../store/useHistoryStore";
import { LocalScanRecord } from "../../types";

export interface RecentScansHandle { refresh: () => Promise<void>; }

interface RecentScansProps {
  onScanPress?: (scan: LocalScanRecord) => void;
}

export const RecentScans = forwardRef<RecentScansHandle, RecentScansProps>(function RecentScans({ onScanPress }, ref) {
  const { colorScheme } = useColorScheme(); 
  const isDark = colorScheme === "dark";

  const allScans = useHistoryStore((s) => s.scans);
  


  // Get up to 3 most recent scans, sorted by date
  const recentScans = [...allScans]
    .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())
    .slice(0, 3);

  useImperativeHandle(ref, () => ({ 
    refresh: async () => {
      // Zustand store is reactive, so we don't strictly need to fetch data here,
      // but we resolve a promise to let the RefreshControl finish spinning.
      return new Promise(resolve => setTimeout(resolve, 500));
    } 
  }));

  const handleScanPress = (scan: LocalScanRecord) => {
    if (onScanPress) {
      onScanPress(scan);
    }
  };

  return (
    <View className="px-6 mb-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text
          className="text-[#22451C] dark:text-[#EAF3D5]"
          style={{ fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }}
        >
          Recent Scans
        </Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/history")} activeOpacity={0.7}>
          <Text
            className="text-[#4D8035] dark:text-[#A2CFA3]"
            style={{ fontSize: 15, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.2 }}
          >
            See All
          </Text>
        </TouchableOpacity>
      </View>

      {recentScans.length === 0 ? (
        <View className="bg-[#FAFEEF] dark:bg-white/5 rounded-[24px] px-5 py-8 items-center border border-[#A2CFA3]/30 dark:border-white/10">
          <View className="w-12 h-12 rounded-full bg-[#EAF3D5] dark:bg-white/10 items-center justify-center mb-3">
            <Feather name="camera" size={18} color={isDark ? "rgba(248,250,252,0.75)" : "#4D8035"} />
          </View>
          <Text className="text-[#22451C] dark:text-[#EAF3D5] text-[14px] font-medium">
            No scans yet
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          {recentScans.map((scan) => (
            <TouchableOpacity
              key={scan.id}
              className="bg-[#FAFEEF] dark:bg-[#162916] rounded-[24px] p-4 flex-row gap-4 items-center border border-[#A2CFA3]/30 dark:border-white/10"
              style={{ 
                shadowColor: isDark ? "#000" : "#22451C", 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: isDark ? 0.22 : 0.04, 
                shadowRadius: 6, 
                elevation: 1 
              }}
              onPress={() => handleScanPress(scan)}
              activeOpacity={0.8}
            >
              <Image
                source={scan.imageUri ? { uri: scan.imageUri } : require("../../../assets/images/plant-placeholder.jpg")}
                className="w-[64px] h-[64px] rounded-[20px] bg-[#EAF3D5] dark:bg-[#1a3315]"
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text className="text-[#22451C] dark:text-[#EAF3D5] font-semibold text-[15px] mb-1">{scan.plantName}</Text>
                <Text className="text-[#70A656] dark:text-white/55 text-[12px] font-medium">
                  {new Date(scan.scannedAt).toLocaleDateString()} · {(scan.confidence * 100).toFixed(0)}% match
                </Text>
              </View>
              <View className="w-10 h-10 rounded-full bg-[#EAF3D5] dark:bg-[#1a3315] items-center justify-center ml-1 border border-transparent dark:border-white/5">
                <Feather name="chevron-right" size={18} color={isDark ? "rgba(226,232,240,0.75)" : "#4D8035"} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

    </View>
  );
});