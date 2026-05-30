import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ProfileState {
  firstName: string;
  lastName: string;
  avatarUri: string | null;
  isFirstLaunch: boolean;

  // Actions
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
  setAvatar: (uri: string) => void;
  removeAvatar: () => void;
  updateProfile: (data: Partial<ProfileState>) => void;
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
      updateProfile: (data) => set((state) => ({ ...state, ...data })),
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
