import { useSettingsStore } from '../store/useSettingsStore';
import en from './en';
import tl from './tl';

const dictionaries = { en, tl };

export type TranslationKey = keyof typeof en;

export const useTranslation = () => {
  const language = useSettingsStore((state) => state.language);
  
  const t = (key: TranslationKey): string => {
    // Fallback to English if Tagalog translation is missing
    const dict = dictionaries[language] || dictionaries.en;
    return dict[key] || dictionaries.en[key] || key;
  };
  
  return { t, language };
};

export const getTranslation = (key: TranslationKey, language: 'en' | 'tl'): string => {
  const dict = dictionaries[language] || dictionaries.en;
  return dict[key] || dictionaries.en[key] || key;
};
