import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Replace with your Firebase project config
// Get this from: Firebase Console > Project Settings > Your apps > Web app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

/**
 * Firestore data model — collection: "sessions"
 *
 * session {
 *   id: string (auto)
 *   date: Timestamp
 *   location: string
 *   locationCoords: { lat: number, lng: number } | null
 *   species: [{ name: string, qty: number, bait: string }]
 *   tideHeight: number (metres)
 *   tideType: 'incoming' | 'outgoing' | 'high' | 'low'
 *   surfConditions: string  e.g. "1-2m, onshore wind"
 *   moonPhase: string       computed from date
 *   moonIllumination: number (0–1)
 *   comments: string
 *   createdAt: Timestamp
 *   updatedAt: Timestamp
 * }
 */
