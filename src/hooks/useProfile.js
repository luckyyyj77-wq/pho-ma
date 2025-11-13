import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useSupabaseQuery } from './useSupabaseQuery'

/**
 * 단일 사용자 프로필을 조회하는 훅
 * @param {string} userId - 조회할 사용자 ID
 * @param {Object} options - 설정 옵션
 * @returns {Object} { profile, loading, error, refetch }
 */
export function useProfile(userId, options = {}) {
  const { autoFetch = true } = options

  const { data, loading, error, refetch } = useSupabaseQuery(
    userId
      ? async () => {
          return await supabase
            .from('profiles')
            .select('id, username, avatar_url, created_at')
            .eq('id', userId)
            .single()
        }
      : null,
    {
      errorMessage: '프로필을 불러오는데 실패했습니다',
      autoFetch: autoFetch && !!userId,
      dependencies: [userId],
      showAlert: false
    }
  )

  return {
    profile: data || { username: '익명' },
    loading,
    error,
    refetch
  }
}

/**
 * 여러 사용자의 프로필을 한 번에 조회하는 훅 (N+1 문제 해결)
 * @param {Array<string>} userIds - 조회할 사용자 ID 배열
 * @returns {Object} { profiles, profileMap, loading, error, refetch }
 */
export function useProfiles(userIds = []) {
  const [profiles, setProfiles] = useState([])
  const [profileMap, setProfileMap] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfiles = useCallback(async () => {
    if (!userIds || userIds.length === 0) {
      setProfiles([])
      setProfileMap(new Map())
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 중복 제거
      const uniqueIds = [...new Set(userIds)]

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', uniqueIds)

      if (fetchError) {
        console.error('프로필 조회 에러:', fetchError)
        setError(fetchError)
        setProfiles([])
        setProfileMap(new Map())
      } else {
        setProfiles(data || [])

        // Map 생성 (빠른 조회를 위해)
        const map = new Map()
        ;(data || []).forEach((profile) => {
          map.set(profile.id, profile)
        })
        setProfileMap(map)
      }
    } catch (e) {
      console.error('프로필 조회 에러:', e)
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [userIds.join(',')])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  // 특정 ID의 프로필 가져오기 헬퍼 함수
  const getProfile = useCallback(
    (userId) => {
      return profileMap.get(userId) || { username: '익명' }
    },
    [profileMap]
  )

  return {
    profiles,
    profileMap,
    getProfile,
    loading,
    error,
    refetch: fetchProfiles
  }
}

/**
 * 데이터에 프로필 정보를 추가하는 유틸리티 훅
 * @param {Array} items - 프로필을 추가할 아이템 배열
 * @param {string} userIdKey - 사용자 ID가 있는 키 이름 (기본: 'user_id')
 * @returns {Object} { itemsWithProfiles, loading, error }
 */
export function useEnrichWithProfiles(items = [], userIdKey = 'user_id') {
  const userIds = items.map((item) => item[userIdKey]).filter(Boolean)
  const { profileMap, loading, error } = useProfiles(userIds)

  const itemsWithProfiles = items.map((item) => ({
    ...item,
    profiles: profileMap.get(item[userIdKey]) || { username: '익명' }
  }))

  return {
    itemsWithProfiles,
    loading,
    error
  }
}

/**
 * 현재 로그인한 사용자의 프로필을 조회하는 훅
 * @returns {Object} { profile, loading, error, refetch }
 */
export function useCurrentUserProfile() {
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    async function getCurrentUser() {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }

    getCurrentUser()

    // 인증 상태 변경 구독
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return useProfile(userId)
}
