import { useState, useEffect, useCallback } from 'react'
import { handleSupabaseError, logError } from '../utils/errorHandler'
import { useNavigate } from 'react-router-dom'

/**
 * Supabase 쿼리를 실행하고 상태를 관리하는 통합 훅
 * @param {Function} queryFn - Supabase 쿼리 함수
 * @param {Object} options - 설정 옵션
 * @param {string} options.errorMessage - 에러 발생 시 표시할 메시지
 * @param {boolean} options.autoFetch - 마운트 시 자동 실행 여부 (기본: true)
 * @param {Array} options.dependencies - 의존성 배열 (변경 시 재실행)
 * @param {Function} options.onSuccess - 성공 시 콜백
 * @param {Function} options.onError - 에러 시 콜백
 * @param {boolean} options.showAlert - 에러 시 alert 표시 여부 (기본: true)
 * @returns {Object} { data, error, loading, refetch, reset }
 */
export function useSupabaseQuery(queryFn, options = {}) {
  const {
    errorMessage = '데이터를 불러오는데 실패했습니다',
    autoFetch = true,
    dependencies = [],
    onSuccess,
    onError,
    showAlert = true
  } = options

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(autoFetch)
  const navigate = useNavigate()

  const executeQuery = useCallback(async () => {
    if (!queryFn) return

    setLoading(true)
    setError(null)

    try {
      const result = await queryFn()

      // Supabase 응답 처리
      if (result?.error) {
        const handled = handleSupabaseError(result.error, errorMessage)
        setError(handled)

        // 로그 기록
        logError(result.error, { queryFn: queryFn.toString() })

        // 에러 alert 표시
        if (showAlert) {
          alert(handled.message)
        }

        // 리다이렉트 필요 시
        if (handled.shouldRedirect) {
          navigate(handled.shouldRedirect)
        }

        // 에러 콜백 실행
        if (onError) {
          onError(handled)
        }
      } else {
        setData(result.data)

        // 성공 콜백 실행
        if (onSuccess) {
          onSuccess(result.data)
        }
      }
    } catch (e) {
      const handled = handleSupabaseError(e, errorMessage)
      setError(handled)

      logError(e, { queryFn: queryFn.toString() })

      if (showAlert) {
        alert(handled.message)
      }

      if (onError) {
        onError(handled)
      }
    } finally {
      setLoading(false)
    }
  }, [queryFn, errorMessage, navigate, onSuccess, onError, showAlert])

  // 자동 실행
  useEffect(() => {
    if (autoFetch) {
      executeQuery()
    }
  }, [autoFetch, executeQuery, ...dependencies])

  // 상태 초기화
  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    error,
    loading,
    refetch: executeQuery,
    reset
  }
}

/**
 * Supabase mutation (insert, update, delete)을 실행하는 훅
 * @param {Function} mutationFn - Mutation 함수
 * @param {Object} options - 설정 옵션
 * @returns {Object} { mutate, data, error, loading }
 */
export function useSupabaseMutation(mutationFn, options = {}) {
  const {
    errorMessage = '작업을 수행하는데 실패했습니다',
    onSuccess,
    onError,
    showAlert = true
  } = options

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const mutate = useCallback(async (...args) => {
    setLoading(true)
    setError(null)

    try {
      const result = await mutationFn(...args)

      if (result?.error) {
        const handled = handleSupabaseError(result.error, errorMessage)
        setError(handled)

        logError(result.error, { mutationFn: mutationFn.toString(), args })

        if (showAlert) {
          alert(handled.message)
        }

        if (handled.shouldRedirect) {
          navigate(handled.shouldRedirect)
        }

        if (onError) {
          onError(handled)
        }

        return { success: false, error: handled }
      } else {
        setData(result.data)

        if (onSuccess) {
          onSuccess(result.data)
        }

        return { success: true, data: result.data }
      }
    } catch (e) {
      const handled = handleSupabaseError(e, errorMessage)
      setError(handled)

      logError(e, { mutationFn: mutationFn.toString(), args })

      if (showAlert) {
        alert(handled.message)
      }

      if (onError) {
        onError(handled)
      }

      return { success: false, error: handled }
    } finally {
      setLoading(false)
    }
  }, [mutationFn, errorMessage, navigate, onSuccess, onError, showAlert])

  return {
    mutate,
    data,
    error,
    loading
  }
}
