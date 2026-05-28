import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ProfileState {
  name: string;
  nickname: string;
  avatarUri: string | null;
  isFirstLaunch: boolean;

  // Actions
  setName: (name: string) => void;
  setNickname: (nickname: string) => void;
  setAvatar: (uri: string) => void;
  removeAvatar: () => void;
  updateProfile: (data: Partial<ProfileState>) => void;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: "Plant Explorer",
      nickname: "",
      avatarUri: null,
      isFirstLaunch: true,

      setName: (name) => set({ name }),
      setNickname: (nickname) => set({ nickname }),
      setAvatar: (uri) => set({ avatarUri: uri }),
      removeAvatar: () => set({ avatarUri: null }),
      updateProfile: (data) => set((state) => ({ ...state, ...data })),
      resetProfile: () => set({
        name: "Plant Explorer",
        nickname: "",
        avatarUri: null,
      }),
    }),
    {
      name: 'hanapmedisina-offline-profile',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
