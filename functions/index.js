const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret }       = require('firebase-functions/params')
const { initializeApp }      = require('firebase-admin/app')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')

initializeApp()

// Stormglass key stored in Google Cloud Secret Manager.
// Set it once via:  firebase functions:secrets:set STORMGLASS_KEY
const stormglassKey = defineSecret('STORMGLASS_KEY')

const DAILY_CATCH_LIMIT = 10

// ── Helper: verify the caller is a registered app user ────────────────────────
async function assertAppUser(uid) {
  const snap = await getFirestore().doc(`users/${uid}`).get()
  if (!snap.exists) {
    throw new HttpsError('permission-denied', 'not-app-user')
  }
}

// ── getTides ──────────────────────────────────────────────────────────────────
// Proxies Stormglass tide/extremes/point. The API key never leaves the server.
// Called from useConditionsCache.js instead of hitting Stormglass directly.

exports.getTides = onCall({ secrets: [stormglassKey] }, async (request) => {
  // Auth check
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in')
  await assertAppUser(request.auth.uid)

  const { lat, lng } = request.data
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new HttpsError('invalid-argument', 'lat and lng must be numbers')
  }

  const now   = new Date()
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const end   = new Date(now); end.setHours(23, 59, 59, 999)

  const res = await fetch(
    `https://api.stormglass.io/v2/tide/extremes/point` +
    `?lat=${lat}&lng=${lng}&start=${start.toISOString()}&end=${end.toISOString()}`,
    { headers: { Authorization: process.env.STORMGLASS_KEY } }
  )

  if (res.status === 402) throw new HttpsError('resource-exhausted', 'limit')
  if (!res.ok)            throw new HttpsError('internal', `stormglass-${res.status}`)

  const json = await res.json()
  return json.data ?? []
})

// ── createSession ─────────────────────────────────────────────────────────────
// Creates a fishing session after enforcing the daily catch limit server-side.
// Firestore rules block direct creates so this is the only path.

exports.createSession = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in')
  await assertAppUser(request.auth.uid)

  const { session } = request.data
  const uid = request.auth.uid
  const db  = getFirestore()

  // Count catches already logged today (server-side — cannot be spoofed)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const existing = await db.collection('sessions')
    .where('userId', '==', uid)
    .where('createdAt', '>=', Timestamp.fromDate(today))
    .get()

  const todayTotal = existing.docs.reduce((sum, d) => {
    return sum + (d.data().catches ?? []).reduce((n, c) => n + (parseInt(c.qty) || 0), 0)
  }, 0)

  const newCount = (session.catches ?? []).reduce((n, c) => n + (parseInt(c.qty) || 0), 0)

  if (todayTotal + newCount > DAILY_CATCH_LIMIT) {
    const remaining = Math.max(0, DAILY_CATCH_LIMIT - todayTotal)
    throw new HttpsError(
      'resource-exhausted',
      `Daily limit reached — ${remaining} more catches allowed today`
    )
  }

  // Write the session (admin SDK bypasses Firestore rules)
  const docRef = await db.collection('sessions').add({
    ...session,
    userId:    uid,
    date:      Timestamp.fromDate(new Date(session.date)),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })

  return { id: docRef.id }
})
