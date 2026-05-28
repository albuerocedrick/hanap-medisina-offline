# 🌿 Hanap Medisina — Offline

A fully offline React Native mobile app for identifying and learning about Philippine medicinal plants. Point your camera at a plant, and the on-device TFLite model identifies it instantly — no internet required.

## Overview

Hanap Medisina Offline is a self-contained plant identification and reference app designed for use in areas with limited or no internet connectivity. Every feature works entirely on-device:

- **Camera-based plant scanning** — powered by a bundled TensorFlow Lite model
- **Detailed plant profiles** — preparation methods, identification facts, research summaries, and safety warnings
- **Personal library** — browse, search, filter, and favorite medicinal plants
- **Scan history** — review past identifications with confidence scores
- **Daily content** — plant of the day, featured plants, and rotating trivia (all computed locally)
- **Data export/import** — backup and restore scan history as JSON files

## Architecture

```
┌──────────────────────────────────────────────┐
│                  App Layer                    │
│   Expo Router (file-based routing)           │
│   NativeWind (Tailwind CSS for RN)           │
├──────────────────────────────────────────────┤
│               State Layer                    │
│   Zustand stores + AsyncStorage persist      │
│   useLibraryStore · useFeedStore             │
│   useHistoryStore · useProfileStore          │
│   useCameraStore                             │
├──────────────────────────────────────────────┤
│              Service Layer                   │
│   localLibrary.ts → plants.json              │
│   localFeed.ts    → homeFeed.json            │
│   dataTransfer.ts → export/import            │
├──────────────────────────────────────────────┤
│              Data Layer                      │
│   src/data/plants.json (plant database)      │
│   src/data/homeFeed.json (feed config)       │
│   assets/model/medicinal_model.tflite        │
│   assets/images/plants/ (plant photos)       │
└──────────────────────────────────────────────┘
```

**Key principles:**
- **Zero network dependencies** — no Firebase, no REST APIs, no cloud services
- **No user accounts** — profile data stored locally via AsyncStorage
- **All data embedded** — plant database and feed config ship as JSON files inside the app bundle
- **On-device ML** — TFLite model runs inference locally via `react-native-fast-tflite`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.76 + Expo SDK 52 |
| Routing | Expo Router (file-based) |
| Styling | NativeWind 4 (Tailwind CSS) |
| State | Zustand 5 + AsyncStorage persistence |
| ML Inference | react-native-fast-tflite |
| Camera | react-native-vision-camera |
| Animations | react-native-reanimated |
| Lists | @shopify/flash-list |
| UI | @expo/vector-icons, expo-blur, expo-linear-gradient |
| File I/O | expo-file-system, expo-document-picker, expo-sharing |

## Getting Started

### Prerequisites

- Node.js 18+
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd hanap-medisina-offline

# Install dependencies
npm install

# Generate native projects
npx expo prebuild

# Run on Android
npx expo run:android

# Run on iOS (macOS only)
npx expo run:ios
```

> **Note:** This app requires native modules (TFLite, Vision Camera) and cannot run in Expo Go. Use a development build.

## Project Structure

```
hanap-medisina-offline/
├── app/                        # Expo Router screens
│   ├── (tabs)/                 # Tab-based navigation
│   │   ├── _layout.tsx         # Custom tab bar
│   │   ├── index.tsx           # Home tab
│   │   ├── scan.tsx            # Camera scanner
│   │   ├── profile.tsx         # User profile
│   │   ├── history/            # Scan history
│   │   └── library/            # Plant library + detail views
│   ├── _layout.tsx             # Root layout (fonts, splash)
│   └── +not-found.tsx          # 404 fallback
├── src/
│   ├── components/             # UI components by feature
│   │   ├── Herbi.tsx           # Mascot component
│   │   ├── home/               # Home tab sections
│   │   ├── library/            # Plant cards, filters
│   │   ├── plant-details/      # Detail tabs (details, compare, research)
│   │   ├── history/            # Scan history cards
│   │   ├── profile/            # Profile UI components
│   │   ├── comparison/         # Side-by-side plant comparison
│   │   └── ui/                 # Shared UI primitives
│   ├── data/                   # Embedded JSON databases
│   │   ├── plants.json         # Full plant database
│   │   └── homeFeed.json       # Feed configuration
│   ├── hooks/
│   │   └── useTFLite.ts        # TFLite model loader
│   ├── services/
│   │   ├── localLibrary.ts     # Plant data access layer
│   │   ├── localFeed.ts        # Home feed computation
│   │   └── dataTransfer.ts     # Export/import logic
│   ├── store/                  # Zustand state stores
│   │   ├── useCameraStore.ts   # Camera/scan state
│   │   ├── useFeedStore.ts     # Home feed state
│   │   ├── useHistoryStore.ts  # Scan history state
│   │   ├── useLibraryStore.ts  # Plant library + favorites
│   │   └── useProfileStore.ts  # User profile state
│   └── types/                  # TypeScript type definitions
│       ├── index.ts            # Core types (MedicinalPlant, etc.)
│       └── homeFeed.ts         # Home feed types
└── assets/
    ├── fonts/                  # Custom fonts
    ├── images/                 # App icons, plant photos, placeholders
    │   └── plants/             # Plant-specific images
    └── model/
        ├── medicinal_model.tflite  # TFLite classification model
        └── labels.txt              # Model output labels
```

## How to Add New Plants

1. **Add plant data** — Add a new entry to `src/data/plants.json` with all required fields (id, name, scientificName, categories, details, research, etc.)

2. **Add a plant image** — Place the image in `assets/images/plants/` (e.g., `newplant.jpg`)

3. **Register the image** — Update the `imageMap` in `src/services/localLibrary.ts`:
   ```typescript
   const imageMap: Record<string, any> = {
     'guava.jpg': require('../../assets/images/plants/guava.jpg'),
     'oregano.jpg': require('../../assets/images/plants/oregano.jpg'),
     'newplant.jpg': require('../../assets/images/plants/newplant.jpg'), // ← add this
   };
   ```

4. **Retrain the model** — If you want the camera to identify the new plant, retrain the TFLite model with images of the new species and replace `assets/model/medicinal_model.tflite`. Update `assets/model/labels.txt` with the new label.

## How to Update the TFLite Model

1. Train your updated model and export it as a `.tflite` file
2. Replace `assets/model/medicinal_model.tflite` with the new model file
3. Update `assets/model/labels.txt` with the correct output labels (one per line)
4. The model is loaded at runtime by `src/hooks/useTFLite.ts` — no code changes needed if the input/output shapes remain the same

## Export & Import

Users can backup and restore their scan history from the Profile tab:

- **Export** — Serializes scan history to a JSON file and opens the system share sheet via `expo-sharing`
- **Import** — Opens a file picker via `expo-document-picker`, validates the JSON structure, and merges it into the existing history store

## Building for Distribution

```bash
# Install EAS CLI (if not already installed)
npm install -g eas-cli

# Build Android APK (preview profile)
eas build --platform android --profile preview

# Build Android AAB (production)
eas build --platform android --profile production

# Build iOS (production)
eas build --platform ios --profile production
```

## License

This project is private and proprietary.
