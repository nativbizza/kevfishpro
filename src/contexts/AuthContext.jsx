import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          // Ensure user profile exists — creates it on first login.
          // This is what isAppUser() checks in Firestore rules.
          const userRef  = doc(db, 'users', u.uid)
          const userSnap = await getDoc(userRef)
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid:         u.uid,
              email:       u.email,
              displayName: u.displayName ?? null,
              role:        'user',
              createdAt:   new Date().toISOString(),
            })
          }

          // Check admin role
          const adminSnap = await getDoc(doc(db, 'admins', u.uid))
          setIsAdmin(adminSnap.exists())
        } catch {
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      // setLoading(false) is called after profile is guaranteed to exist,
      // so by the time the app renders, isAppUser() will pass in Firestore rules.
      setLoading(false)
    })
    return unsub
  }, [])

  const loginWithGoogle  = () => signInWithPopup(auth, googleProvider)
  const loginWithEmail   = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const signupWithEmail  = (email, password) => createUserWithEmailAndPassword(auth, email, password)
  const resetPassword    = (email) => sendPasswordResetEmail(auth, email)
  const logout           = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
