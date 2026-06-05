import { Image } from 'react-native';
import { MedicinalPlant, ComparisonTraits, ResearchEntry as ResearchItem } from '../types';
import { SymptomItem, PreparationGroup } from '../types/homeFeed';
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

const SYMPTOM_ICONS: Record<string, string> = {
  "diarrhea relief": "water-outline",
  "stomach ache": "body-outline",
  "wound healing": "bandage-outline",
  "anti-inflammatory": "medkit-outline",
  "toothache": "medical-outline",
  "gum disease": "fitness-outline",
  "cough relief": "cloud-outline",
  "sore throat": "thermometer-outline",
  "cold & flu": "snow-outline",
  "digestion": "nutrition-outline",
  "antibacterial": "shield-checkmark-outline",
  "skin infections": "color-palette-outline",
};

const METHOD_ICONS: Record<string, string> = {
  "tea / decoction": "cafe-outline",
  "tea": "cafe-outline",
  "poultice": "bandage-outline",
  "mouth rinse": "water-outline",
  "juice extract": "beaker-outline",
  "oil infusion": "flask-outline",
};

export function getAllSymptoms(): SymptomItem[] {
  const symptomCounts: Record<string, number> = {};
  plants.forEach(plant => {
    plant.details?.preparation?.forEach(prep => {
      prep.uses?.forEach(use => {
        const key = use.trim();
        symptomCounts[key] = (symptomCounts[key] || 0) + 1;
      });
    });
  });
  
  return Object.entries(symptomCounts).map(([label, count]) => {
    const lowerLabel = label.toLowerCase();
    const id = lowerLabel.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const icon = SYMPTOM_ICONS[lowerLabel] || "leaf-outline";
    return {
      id,
      label,
      icon,
      plantCount: count
    };
  }).sort((a, b) => b.plantCount - a.plantCount);
}

export function getPlantsBySymptom(symptom: string): MedicinalPlant[] {
  const query = symptom.toLowerCase();
  return plants.filter(plant => 
    plant.details?.preparation?.some(prep => 
      prep.uses?.some(use => use.toLowerCase().includes(query))
    )
  );
}

export function getAllPreparationGroups(): PreparationGroup[] {
  const methodMap: Record<string, { count: number; plantIds: Set<string> }> = {};
  
  plants.forEach(plant => {
    plant.details?.preparation?.forEach(prep => {
      const method = prep.method.trim();
      if (!methodMap[method]) {
        methodMap[method] = { count: 0, plantIds: new Set() };
      }
      methodMap[method].plantIds.add(plant.id);
    });
  });

  return Object.entries(methodMap).map(([method, data]) => {
    const lowerMethod = method.toLowerCase();
    const icon = METHOD_ICONS[lowerMethod] || "leaf-outline";
    return {
      method,
      icon,
      plantCount: data.plantIds.size,
      plantIds: Array.from(data.plantIds)
    };
  }).sort((a, b) => b.plantCount - a.plantCount);
}

export function getPlantsByPreparationMethod(method: string): MedicinalPlant[] {
  const query = method.toLowerCase();
  return plants.filter(plant => 
    plant.details?.preparation?.some(prep => 
      prep.method.toLowerCase().includes(query)
    )
  );
}
