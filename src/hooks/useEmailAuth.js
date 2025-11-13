import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * 이메일 인증 훅
 */
export function useEmailAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 이메일 회원가입
  const signUp = async (email, password, name) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })

      if (authError) throw authError

      return {
        success: true,
        data,
        message: '회원가입 성공! 이메일을 확인해주세요.'
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // 이메일 로그인
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      return {
        success: true,
        data,
        message: '로그인 성공!'
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    signUp,
    signIn,
    loading,
    error
  }
}
