---
type: "query"
date: "2026-10-14T12:17:51.959470+00:00"
question: "Check trained TFLite labels against the Library and fix symptom search"
contributor: "graphify"
outcome: "useful"
source_nodes: ["useTFLite()", "searchPlantRecords()", "LibraryFeed()"]
---

# Q: Check trained TFLite labels against the Library and fix symptom search

## Answer

Expanded graph vocabulary: plant library search symptoms labels tflite model. The active medicinal_model_oct_9.tflite has output shape [1,15], matching 14 named plants and Unknown. Added the missing Litlit entry in both catalogs and mapped Tubang Bakod to tuba-tuba. Removed the Library focus overlay, show full search results, and clear hidden browse filters on a new query. All 15 catalog/search tests and TypeScript checks passed; rebuilt and installed in LDPlayer, verified Litlit details open while searching and ubo returns 9 matches.

## Outcome

- Signal: useful

## Source Nodes

- useTFLite()
- searchPlantRecords()
- LibraryFeed()