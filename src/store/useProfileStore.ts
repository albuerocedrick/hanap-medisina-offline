import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ProfileData {
  firstName: string;
  lastName: string;
  avatarUri: string | null;
  isFirstLaunch: boolean;
}

interface ProfileState extends ProfileData {
  // Actions
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
  setAvatar: (uri: string) => void;
  removeAvatar: () => void;
  updateProfile: (data: Partial<ProfileData>) => void;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      firstName: "Plant",
      lastName: "Explorer",
      avatarUri: null,
      isFirstLaunch: true,

      setFirstName: (firstName) => set({ firstName }),
      setLastName: (lastName) => set({ lastName }),
      setAvatar: (uri) => set({ avatarUri: uri }),
      removeAvatar: () => set({ avatarUri: null }),
      updateProfile: (data) => set({
        ...(typeof data.firstName === "string" ? { firstName: data.firstName } : {}),
        ...(typeof data.lastName === "string" ? { lastName: data.lastName } : {}),
        ...(typeof data.avatarUri === "string" || data.avatarUri === null ? { avatarUri: data.avatarUri } : {}),
        ...(typeof data.isFirstLaunch === "boolean" ? { isFirstLaunch: data.isFirstLaunch } : {}),
      }),
      resetProfile: () => set({
        firstName: "Plant",
        lastName: "Explorer",
        avatarUri: null,
      }),
    }),
    {
      name: 'hanapmedisina-offline-profile',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
