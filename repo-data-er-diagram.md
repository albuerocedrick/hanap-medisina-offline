# ERD for hanap-medisina-offline

This ERD reflects the actual app data model from `src/types/index.ts`, `src/store/useHistoryStore.ts`, `src/store/useLibraryStore.ts`, `src/store/useProfileStore.ts`, and `src/services/dataTransfer.ts`.

```mermaid
erDiagram
    MedicinalPlant {
        string id PK
        string name
        string scientificName
        string shortDescription
        string imageSource
        string imageUrl
        string[] categories
        string[] lookAlikeIds
        string localName
        string details_facts
        string[] details_warnings
        string cultivation_climate
        string cultivation_soil
        string cultivation_sunlight
        string cultivation_watering
        string cultivation_propagation
        string cultivation_growthTime
        string[] cultivation_tips
        string research_title
        string research_summary
        string research_reference
        number research_year
        string comparison_leaf
        string comparison_flower
        string comparison_stem
        string comparison_smell
    }

    LocalScanRecord {
        string id PK
        string plantName
        string plantId FK
        number confidence
        string imageUri
        string scannedAt
        boolean isFavorite
        string notes
    }

    Profile {
        string name
        string nickname
        string avatarUri
        boolean isFirstLaunch
    }

    ExportData {
        number version
        string exportedAt
        string profile_name
        string profile_nickname
        string profile_avatarBase64
    }

    MedicinalPlant ||--o{ LocalScanRecord : "identified in"
    MedicinalPlant ||--o{ ExportData : "favorite ids"
    Profile ||--o{ ExportData : "backup contains"
```

## Notes

- `MedicinalPlant` is the canonical offline plant record loaded from `src/data/plants.json`.
- `LocalScanRecord` stores user scan history and references plants by `plantId`.
- `Profile` stores local user preferences and avatar data.
- `ExportData` is a backup payload containing `profile`, `scans`, and `favorites`.
- Favorites are persisted in code as full `MedicinalPlant[]` in `useLibraryStore`, but exported as `string[]` of plant IDs.
