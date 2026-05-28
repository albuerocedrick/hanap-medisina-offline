import { Image } from 'react-native';
import { MedicinalPlant, ComparisonTraits, ResearchEntry as ResearchItem } from '../types';
import plantsData from '../data/plants.json';

export { MedicinalPlant, ComparisonTraits, ResearchItem };

const imageMap: Record<string, any> = {
  'guava.jpg': require('../../assets/images/plants/guava.jpg'),
  'oregano.jpg': require('../../assets/images/plants/oregano.jpg'),
};

const rawPlants = plantsData as any[];
const plants: MedicinalPlant[] = rawPlants.map(p => {
  let resolvedUrl = '';
  if (p.imageSource && imageMap[p.imageSource]) {
    resolvedUrl = Image.resolveAssetSource(imageMap[p.imageSource]).uri;
  }
  return {
    ...p,
    imageUrl: resolvedUrl
  };
});

export function getAllPlants(): MedicinalPlant[] {
  return plants;
}

export function getAllCategories(): string[] {
  const categories = new Set<string>();
  plants.forEach(plant => {
    plant.categories.forEach(cat => categories.add(cat));
  });
  return Array.from(categories).sort();
}

export function getPlantById(id: string): MedicinalPlant | undefined {
  return plants.find(plant => plant.id === id);
}

export function getPlantsByIds(ids: string[]): MedicinalPlant[] {
  return plants.filter(plant => ids.includes(plant.id));
}

export function getPlantsByCategory(category: string): MedicinalPlant[] {
  return plants.filter(plant => plant.categories.includes(category));
}

export function searchPlantsLocally(list: MedicinalPlant[], query: string): MedicinalPlant[] {
  const lowercaseQuery = query.toLowerCase();
  
  return list.filter(plant => {
    return (
      (plant.name && plant.name.toLowerCase().includes(lowercaseQuery)) ||
      (plant.scientificName && plant.scientificName.toLowerCase().includes(lowercaseQuery)) ||
      (plant.details?.localName && plant.details.localName.toLowerCase().includes(lowercaseQuery))
    );
  });
}

export function searchPlants(query: string): MedicinalPlant[] {
  return searchPlantsLocally(plants, query);
}
