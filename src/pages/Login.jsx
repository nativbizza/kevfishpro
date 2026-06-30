import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword } = useAuth()
  const [mode, setMode]       = useState('login')   // 'login' | 'signup' | 'reset'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (fn) => {
    setError(''); setMessage(''); setLoading(true)
    try { await fn() }
    catch (e) { setError(friendlyError(e.code)) }
    finally { setLoading(false) }
  }

  const handleGoogle = () => handle(loginWithGoogle)

  const handleEmail = () => handle(async () => {
    if (mode === 'login')  await loginWithEmail(email, password)
    if (mode === 'signup') await signupWithEmail(email, password)
    if (mode === 'reset') {
      await resetPassword(email)
      setMessage('Reset link sent — check your inbox')
    }
  })

  return (
    <div className="min-h-screen bg-ocean-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">

        {/* Logo */}
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">🎣</p>
          <h1 className="text-2xl font-bold text-ocean-800">KevFishPro</h1>
          <p className="text-xs text-gray-400 mt-1">Your SA fishing companion</p>
        </div>

        {/* Google */}
        {mode !== 'reset' && (
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition mb-4 disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.2 33.1 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 2.9l6-6C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z"/>
            </svg>
            Continue with Google
          </button>
        )}

        {mode !== 'reset' && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        )}

        {/* Email */}
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
          />
          {mode !== 'reset' && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmail()}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
            />
          )}

          {error   && <p className="text-xs text-red-500">{error}</p>}
          {message && <p className="text-xs text-emerald-600">{message}</p>}

          <button
            onClick={handleEmail}
            disabled={loading}
            className="w-full bg-ocean-700 hover:bg-ocean-800 text-white font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-60"
          >
            {loading ? '…' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>
        </div>

        {/* Mode switchers */}
        <div className="mt-5 text-center space-y-2">
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('signup'); setError('') }} className="text-xs text-ocean-600 hover:underline block w-full">
                Don't have an account? Sign up
              </button>
              <button onClick={() => { setMode('reset'); setError('') }} className="text-xs text-gray-400 hover:underline block w-full">
                Forgot password?
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button onClick={() => { setMode('login'); setError('') }} className="text-xs text-ocean-600 hover:underline">
              Already have an account? Sign in
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => { setMode('login'); setError('') }} className="text-xs text-ocean-600 hover:underline">
              ← Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':       'No account found with that email',
    'auth/wrong-password':       'Incorrect password',
    'auth/email-already-in-use': 'An account already exists with that email',
    'auth/weak-password':        'Password must be at least 6 characters',
    'auth/invalid-email':        'Invalid email address',
    'auth/too-many-requests':    'Too many attempts — try again later',
    'auth/popup-closed-by-user': 'Sign-in cancelled',
    'auth/invalid-credential':   'Incorrect email or password',
  }
  return map[code] ?? 'Something went wrong — please try again'
}
