// ============================================
// ❤️ 좋아요 기능 Hook (완전 수정 버전)
// ============================================
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useLikes(photoId, userId) {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // 초기 좋아요 상태 확인
  useEffect(() => {
    if (photoId && userId) {
      checkLikeStatus()
    }
  }, [photoId, userId])

  async function checkLikeStatus() {
    try {
      // 내가 좋아요 했는지 확인
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('photo_id', photoId)
        .eq('user_id', userId)
        .maybeSingle()

      setIsLiked(!!likeData)

      // 총 좋아요 수 확인
      const { data: photoData } = await supabase
        .from('photos')
        .select('likes_count')
        .eq('id', photoId)
        .single()

      setLikesCount(photoData?.likes_count || 0)
    } catch (error) {
      console.error('좋아요 상태 확인 실패:', error)
    }
  }

  async function toggleLike() {
    if (!userId) return { success: false, message: '로그인이 필요해요!' }
    if (loading) return { success: false, message: '처리 중입니다...' }

    setLoading(true)

    try {
      if (isLiked) {
        // ===== 좋아요 취소 =====
        await supabase
          .from('likes')
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', userId)

        // 좋아요 수 감소
        await supabase.rpc('decrement_likes', { photo_id: photoId })

        setIsLiked(false)
        setLikesCount(prev => prev - 1)

        return { success: true, action: 'unliked' }

      } else {
        // ===== 좋아요 추가 =====
        
        // 1. 중복 체크 (동시 클릭 방지)
        const { data: existingLike } = await supabase
          .from('likes')
          .select('id')
          .eq('photo_id', photoId)
          .eq('user_id', userId)
          .maybeSingle()

        if (existingLike) {
          return { success: false, message: '이미 좋아요 했어요!' }
        }

        // 2. 좋아요 추가
        const { error: likeError } = await supabase
          .from('likes')
          .insert({ user_id: userId, photo_id: photoId })

        if (likeError) {
          // unique 제약 위반 = 이미 좋아요함
          if (likeError.code === '23505') {
            return { success: false, message: '이미 좋아요 했어요!' }
          }
          throw likeError
        }

        // 3. 좋아요 수 증가
        await supabase.rpc('increment_likes', { photo_id: photoId })

        // 4. 포인트 지급 여부 확인 (한 번만 지급!)
        const reward = await checkAndGiveReward()

        setIsLiked(true)
        setLikesCount(prev => prev + 1)

        return { 
          success: true, 
          action: 'liked',
          reward: reward
        }
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error)
      return { success: false, message: '오류가 발생했어요' }
    } finally {
      setLoading(false)
    }
  }

  async function checkAndGiveReward() {
    try {
      const today = new Date().toISOString().split('T')[0]

      // ===== 🔥 핵심: 이미 포인트 받은 사진인지 체크 =====
      const { data: alreadyRewarded } = await supabase
        .from('like_rewards_history')
        .select('id')
        .eq('user_id', userId)
        .eq('photo_id', photoId)
        .eq('reward_date', today)
        .maybeSingle()

      if (alreadyRewarded) {
        return { 
          given: false, 
          message: '이 사진은 이미 포인트를 받았어요!' 
        }
      }

      // ===== 일일 제한 확인 =====
      const { data: dailyData } = await supabase
        .from('daily_like_rewards')
        .select('likes_count')
        .eq('user_id', userId)
        .eq('reward_date', today)
        .maybeSingle()

      const currentCount = dailyData?.likes_count || 0

      // 10회 제한
      if (currentCount >= 10) {
        return { 
          given: false, 
          message: '오늘 좋아요 포인트를 모두 받았어요!' 
        }
      }

      // ===== 포인트 지급 =====

      // 1. 일일 카운트 증가
      if (dailyData) {
        await supabase
          .from('daily_like_rewards')
          .update({ likes_count: currentCount + 1 })
          .eq('user_id', userId)
          .eq('reward_date', today)
      } else {
        await supabase
          .from('daily_like_rewards')
          .insert({
            user_id: userId,
            reward_date: today,
            likes_count: 1
          })
      }

      // 2. 이 사진에 대한 포인트 지급 기록
      await supabase
        .from('like_rewards_history')
        .insert({
          user_id: userId,
          photo_id: photoId,
          reward_date: today
        })

      // 3. 포인트 지급
      const { data: pointData, error: pointFetchError } = await supabase
        .from('user_points')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle()

      if (pointFetchError) {
        console.error('포인트 조회 실패:', pointFetchError)
        return { given: false }
      }

      const currentBalance = pointData?.balance || 0
      const newBalance = currentBalance + 10

      // UPDATE 또는 INSERT
      if (pointData) {
        const { error: updateError } = await supabase
          .from('user_points')
          .update({ balance: newBalance })
          .eq('user_id', userId)

        if (updateError) {
          console.error('포인트 업데이트 실패:', updateError)
          return { given: false }
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_points')
          .insert({
            user_id: userId,
            balance: newBalance
          })

        if (insertError) {
          console.error('포인트 생성 실패:', insertError)
          return { given: false }
        }
      }

      // 4. 거래 내역 기록
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          photo_id: photoId,
          type: 'reward',
          amount: 100,
          balance_after: newBalance,
          description: '좋아요 포인트'
        })

      if (txError) {
        console.error('거래 내역 기록 실패:', txError)
      }

      return { 
        given: true, 
        points: 100, 
        remaining: 10 - currentCount - 1,
        message: `💰 +10P 획득! (오늘 ${10 - currentCount - 1}회 남음)`
      }

    } catch (error) {
      console.error('포인트 지급 실패:', error)
      return { given: false }
    }
  }

  return {
    isLiked,
    likesCount,
    loading,
    toggleLike
  }
}