import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION = 'sessions'

export function useSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Real-time listener — resolves from local cache immediately, no hanging
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('date', 'desc'))
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          date: d.data().date?.toDate?.() ?? new Date(d.data().date),
        }))
        setSessions(data)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const addSession = async (sessionData) => {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...sessionData,
      date: Timestamp.fromDate(new Date(sessionData.date)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
    // No manual refetch needed — onSnapshot updates automatically
  }

  const updateSession = async (id, sessionData) => {
    await updateDoc(doc(db, COLLECTION, id), {
      ...sessionData,
      date: Timestamp.fromDate(new Date(sessionData.date)),
      updatedAt: serverTimestamp(),
    })
  }

  const deleteSession = async (id) => {
    await deleteDoc(doc(db, COLLECTION, id))
  }

  return { sessions, loading, error, addSession, updateSession, deleteSession }
}
