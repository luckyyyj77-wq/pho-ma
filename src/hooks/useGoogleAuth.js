import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Google 인증 훅
 */
export function useGoogleAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })

      if (authError) throw authError

      return { success: true, data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    signInWithGoogle,
    loading,
    error
  }
}
