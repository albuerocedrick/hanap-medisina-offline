import homeFeedData from '../data/homeFeed.json';
import { getAllSymptoms, getAllPreparationGroups } from './localLibrary';
import { HomeFeedData, TriviaItem } from '../types/homeFeed';

// Simple seeded random number generator for deterministic daily shuffling
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export function getHomeFeed(): HomeFeedData {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // 1. Shuffle Trivia using date as seed (stays consistent all day, changes next day)
  const random = mulberry32(dayOfYear);
  const shuffledTrivia = [...homeFeedData.triviaPool].sort(() => random() - 0.5);
  
  const weeklyTrivia: TriviaItem[] = shuffledTrivia.slice(0, 7).map((text, i) => ({
    id: `t${dayOfYear}-${i}`,
    text
  }));

  // Ensure we always return exactly 7 items as expected by the UI
  while (weeklyTrivia.length < 7) {
    weeklyTrivia.push({
      id: `fallback-${weeklyTrivia.length}`,
      text: homeFeedData.triviaPool[0] || "Did you know? Hanap Medisina helps you identify medicinal plants."
    });
  }

  // 5. Symptoms and Preparations
  const symptoms = getAllSymptoms();
  const preparationGroups = getAllPreparationGroups();

  return {
    weeklyTrivia,
    symptoms,
    preparationGroups
  };
}
