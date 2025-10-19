// ============================================
// ❤️ 좋아요 기능 Hook
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
        .single()

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
    if (loading) return { success: false }

    setLoading(true)

    try {
      if (isLiked) {
        // 좋아요 취소
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
        // 좋아요 추가
        const { error: likeError } = await supabase
          .from('likes')
          .insert({ user_id: userId, photo_id: photoId })

        if (likeError) throw likeError

        // 좋아요 수 증가
        await supabase.rpc('increment_likes', { photo_id: photoId })

        // 오늘 좋아요 포인트 지급 확인
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

      // 오늘 받은 좋아요 포인트 확인
      let { data: rewardData } = await supabase
        .from('daily_like_rewards')
        .select('likes_count')
        .eq('user_id', userId)
        .eq('reward_date', today)
        .single()

      const currentCount = rewardData?.likes_count || 0

      // 10회 제한
      if (currentCount >= 10) {
        return { given: false, message: '오늘 좋아요 포인트를 모두 받았어요!' }
      }

      // 좋아요 카운트 먼저 업데이트 (중복 방지!)
      if (rewardData) {
        const { error: updateError } = await supabase
          .from('daily_like_rewards')
          .update({ likes_count: currentCount + 1 })
          .eq('user_id', userId)
          .eq('reward_date', today)
          .eq('likes_count', currentCount)  // 중요! 값이 안 바뀌었을 때만 업데이트
        
        if (updateError) {
          // 이미 다른 요청에서 업데이트됨
          return { given: false, message: '이미 처리 중입니다' }
        }
      } else {
        const { error: insertError } = await supabase
          .from('daily_like_rewards')
          .insert({
            user_id: userId,
            reward_date: today,
            likes_count: 1
          })
        
        if (insertError) {
          // 이미 생성됨
          return { given: false, message: '이미 처리 중입니다' }
        }
      }

      // 포인트 지급
      const { data: pointData } = await supabase
        .from('user_points')
        .select('balance')
        .eq('user_id', userId)
        .single()

      const newBalance = (pointData?.balance || 0) + 10

      await supabase
        .from('user_points')
        .update({ balance: newBalance })
        .eq('user_id', userId)

      // 거래 내역 기록
      await supabase.from('transactions').insert({
        user_id: userId,
        photo_id: photoId,
        type: 'charge',
        amount: 10,
        balance_after: newBalance,
        description: '좋아요 포인트'
      })

      return { 
        given: true, 
        points: 10, 
        remaining: 10 - currentCount - 1,
        message: `+10P 획득! (오늘 ${10 - currentCount - 1}회 남음)`
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