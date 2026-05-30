export interface PreparationMethod {
  method: string;
  description: string;
  uses: string[];
}

export interface CultivationGuide {
  climate: string;
  soil: string;
  sunlight: string;
  watering: string;
  propagation: string;
  growthTime: string;
  tips: string[];
}

export interface ResearchEntry {
  title: string;
  summary: string;
  reference: string;
  year: number;
}

export interface ComparisonTraits {
  leaf: string;
  flower: string;
  stem: string;
  smell: string;
}

export interface PlantDetails {
  localName: string;
  preparation: PreparationMethod[];
  facts: Record<string, string>;
  warnings: string[];
}

export interface MedicinalPlant {
  id: string;
  name: string;
  scientificName: string;
  shortDescription: string;
  imageSource?: string;
  imageUrl?: string;
  categories: string[];
  lookAlikeIds: string[];
  details: PlantDetails;
  cultivationGuide: CultivationGuide;
  research: ResearchEntry[];
  comparisonTraits: ComparisonTraits;
}
export interface LocalScanRecord {
  id: string;              // UUID generated locally
  plantName: string;       // Title-cased (e.g., "Oregano")
  plantId: string;         // links to plant in library
  confidence: number;      // Decimal 0.0–1.0
  imageUri: string;        // local file URI
  scannedAt: string;       // ISO timestamp
  isFavorite: boolean;     // favorite flag
  notes?: string;          // optional user notes
}

export interface ExportedScan extends Omit<LocalScanRecord, 'imageUri'> {
  imageBase64?: string;  // scan image encoded as base64 (self-contained backup)
}

export interface ExportData {
  version: 1;                          // schema version for forward compatibility
  exportedAt: string;                  // ISO timestamp of export
  profile: {
    firstName: string;
    lastName: string;
    avatarBase64?: string;             // profile avatar as base64 (optional)
  };
  scans: ExportedScan[];               // scan history with embedded images
  favorites: string[];                 // library plant IDs (from useLibraryStore)
}
