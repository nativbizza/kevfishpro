# 🎣 Fishing Log

A React + Firebase app to track SA fishing sessions.

## Stack
- **React 18** + **Vite**
- **Firebase Firestore** (database)
- **Tailwind CSS** (styling)
- **React Router v6**
- **SunCalc** (moon phase calculation)

## Setup

### 1. Install dependencies
```bash
cd fishing
npm install
```

### 2. Create a Firebase project
1. Go to https://console.firebase.google.com
2. Create a new project (e.g. `fishing-log`)
3. Add a **Web app**
4. Enable **Firestore Database** (start in test mode for dev)

### 3. Configure environment
```bash
cp .env.example .env
# Fill in your Firebase values from the Firebase Console
```

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy (optional)
```bash
npm run build
# Deploy dist/ to Firebase Hosting or Vercel
```

## Features
- Log fishing sessions: species, qty, bait, tide, moon phase, surf conditions, location, comments
- Moon phase auto-calculated from session date (SunCalc)
- 30+ SA fish species, SA coastal locations pre-loaded
- History view: filter by species or location, expand for full detail
- Edit & delete sessions
- Stats: total sessions, total catches, unique locations

## Tides4Fishing Integration (planned)
The app is structured to later pull tide forecasts from [tides4fishing.com](https://tides4fishing.com)
to suggest best fishing days per species and location.

Firestore collection: `sessions` — see `src/firebase.js` for the data model.
