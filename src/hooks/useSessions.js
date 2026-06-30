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
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const COLLECTION = 'sessions'
const DAILY_CATCH_LIMIT = 10

export function useSessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!user) { setSessions([]); setLoading(false); return }

    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    )
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setSessions(snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          date: d.data().date?.toDate?.() ?? new Date(d.data().date),
        })))
        setLoading(false)
      },
      (err) => { setError(err.message); setLoading(false) }
    )
    return () => unsub()
  }, [user])

  // Count total catches logged today
  const todayCatchCount = () => {
    const today = new Date().toISOString().slice(0, 10)
    return sessions
      .filter((s) => {
        const d = s.date instanceof Date ? s.date : new Date(s.date)
        return d.toISOString().slice(0, 10) === today
      })
      .reduce((sum, s) => sum + (s.catches?.reduce((n, c) => n + (parseInt(c.qty) || 0), 0) ?? 0), 0)
  }

  const addSession = async (sessionData) => {
    const catchCount = sessionData.catches?.reduce((n, c) => n + (parseInt(c.qty) || 0), 0) ?? 0
    const todayTotal = todayCatchCount()
    if (todayTotal + catchCount > DAILY_CATCH_LIMIT) {
      throw new Error(`Daily limit reached — you can log ${DAILY_CATCH_LIMIT - todayTotal} more catches today`)
    }

    const docRef = await addDoc(collection(db, COLLECTION), {
      ...sessionData,
      userId: user.uid,
      date: Timestamp.fromDate(new Date(sessionData.date)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  }

  const updateSession = async (id, sessionData) => {
    await updateDoc(doc(db, COLLECTION, id), {
      ...sessionData,
      userId: user.uid,
      date: Timestamp.fromDate(new Date(sessionData.date)),
      updatedAt: serverTimestamp(),
    })
  }

  const deleteSession = async (id) => {
    await deleteDoc(doc(db, COLLECTION, id))
  }

  return { sessions, loading, error, addSession, updateSession, deleteSession, todayCatchCount }
}
