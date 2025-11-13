import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * 전화번호 인증 훅
 */
export function usePhoneAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 전화번호 포맷팅 (한국 번호)
  const formatPhoneNumber = (phone) => {
    let formatted = phone.trim().replace(/-/g, '')

    if (formatted.startsWith('010')) {
      formatted = '+82' + formatted.substring(1)
    } else if (!formatted.startsWith('+82')) {
      formatted = '+82' + formatted
    }

    return formatted
  }

  // SMS 인증 코드 발송
  const sendOtp = async (phone) => {
    try {
      setLoading(true)
      setError(null)

      const formattedPhone = formatPhoneNumber(phone)

      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone
      })

      if (authError) throw authError

      return {
        success: true,
        message: '인증코드를 발송했습니다!'
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // 인증 코드 확인
  const verifyOtp = async (phone, code) => {
    try {
      setLoading(true)
      setError(null)

      const formattedPhone = formatPhoneNumber(phone)

      const { data, error: authError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: 'sms'
      })

      if (authError) throw authError

      return {
        success: true,
        data,
        message: '인증 성공!'
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    sendOtp,
    verifyOtp,
    loading,
    error
  }
}
