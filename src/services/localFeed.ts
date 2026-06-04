import homeFeedData from '../data/homeFeed.json';
import { getPlantById, getAllSymptoms, getAllPreparationGroups } from './localLibrary';
import { HomeFeedData, TriviaItem, FeedCategory, FeaturedPlant } from '../types/homeFeed';

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
  // 1. Compute Plant of the Day
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const potdIndex = dayOfYear % homeFeedData.plantOfTheDayPool.length;
  const potdId = homeFeedData.plantOfTheDayPool[potdIndex];
  const potdPlant = getPlantById(potdId);

  const plantOfTheDay = potdPlant ? {
    id: potdPlant.id,
    name: potdPlant.name,
    scientificName: potdPlant.scientificName,
    subtitle: potdPlant.shortDescription,
    heroImageUrl: potdPlant.imageUrl || '',
  } : {
    id: 'unknown',
    name: 'Unknown Plant',
    scientificName: '',
    subtitle: '',
    heroImageUrl: '',
  };

  // 2. Map categories
  const categories: FeedCategory[] = homeFeedData.categories.map(c => ({
    id: c.id,
    name: c.label,
    icon: c.icon
  }));

  // 3. Resolve featured plants
  const featuredPlants: FeaturedPlant[] = homeFeedData.featuredPlants
    .map(id => {
      const p = getPlantById(id);
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        scientificName: p.scientificName,
        thumbnailUrl: p.imageUrl || ''
      };
    })
    .filter((p): p is FeaturedPlant => p !== null);

  // 4. Shuffle Trivia using date as seed (stays consistent all day, changes next day)
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
    plantOfTheDay,
    categories,
    featuredPlants,
    weeklyTrivia,
    symptoms,
    preparationGroups
  };
}
