import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useOnboardingStore = create<{
  completed: boolean;
  cameraGuideSeen: boolean;
  complete: () => void;
  replay: () => void;
  markCameraGuideSeen: () => void;
}>()(persist(set => ({
  completed: false,
  cameraGuideSeen: false,
  complete: () => set({ completed: true }),
  replay: () => set({ completed: false }),
  markCameraGuideSeen: () => set({ cameraGuideSeen: true }),
}), { name: "hanap-medisina-onboarding-v1", storage: createJSONStorage(() => AsyncStorage) }));
