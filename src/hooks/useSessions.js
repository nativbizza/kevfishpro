import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
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

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const q = query(collection(db, COLLECTION), orderBy('date', 'desc'))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        date: d.data().date?.toDate?.() ?? new Date(d.data().date),
      }))
      setSessions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const addSession = async (sessionData) => {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...sessionData,
      date: Timestamp.fromDate(new Date(sessionData.date)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await fetchSessions()
    return docRef.id
  }

  const updateSession = async (id, sessionData) => {
    const ref = doc(db, COLLECTION, id)
    await updateDoc(ref, {
      ...sessionData,
      date: Timestamp.fromDate(new Date(sessionData.date)),
      updatedAt: serverTimestamp(),
    })
    await fetchSessions()
  }

  const deleteSession = async (id) => {
    await deleteDoc(doc(db, COLLECTION, id))
    await fetchSessions()
  }

  return { sessions, loading, error, addSession, updateSession, deleteSession, refetch: fetchSessions }
}
