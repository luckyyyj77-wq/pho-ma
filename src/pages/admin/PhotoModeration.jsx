// src/pages/admin/PhotoModeration.jsx - 사진 검수 관리
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Check, X, AlertCircle, Shield, Eye } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function PhotoModeration() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [pendingPhotos, setPendingPhotos] = useState([])
  const [moderationStats, setModerationStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  })

  useEffect(() => {
    loadModerationData()
  }, [])

  // 검수 데이터 로드
  async function loadModerationData() {
    setLoading(true)
    try {
      const { data: queueData, error: queueError } = await supabase
        .from('moderation_queue')
        .select(`
          *,
          photos (
            id,
            preview_url,
            title,
            current_price,
            user_id
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (queueError) throw queueError

      // 판매자 정보 추가 (N+1 문제 해결)
      if (queueData && queueData.length > 0) {
        const userIds = [
          ...new Set(queueData.map((item) => item.photos?.user_id).filter(Boolean))
        ]

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds)

          if (profilesData) {
            const profilesMap = {}
            profilesData.forEach((profile) => {
              profilesMap[profile.id] = profile.username
            })

            queueData.forEach((item) => {
              if (item.photos?.user_id) {
                item.seller_name =
                  profilesMap[item.photos.user_id] || '알 수 없음'
              }
            })
          }
        }
      }

      setPendingPhotos(queueData || [])

      // 검수 통계
      const { data: statsData } = await supabase
        .from('moderation_queue')
        .select('status')

      const statsCounts = {
        pending: 0,
        approved: 0,
        rejected: 0
      }

      statsData?.forEach((item) => {
        statsCounts[item.status] = (statsCounts[item.status] || 0) + 1
      })

      setModerationStats(statsCounts)
    } catch (error) {
      console.error('검수 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 승인 처리
  async function handleApprove(queueItem) {
    if (!confirm('이 사진을 승인하시겠습니까?')) return

    try {
      const { error: photoError } = await supabase
        .from('photos')
        .update({
          moderation_status: 'approved',
          status: 'active'
        })
        .eq('id', queueItem.photo_id)

      if (photoError) throw photoError

      const { error: queueError } = await supabase
        .from('moderation_queue')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', queueItem.id)

      if (queueError) throw queueError

      alert('✅ 승인되었습니다!')
      loadModerationData()
    } catch (error) {
      console.error('승인 실패:', error)
      alert('승인 처리 중 오류가 발생했습니다')
    }
  }

  // 거부 처리
  async function handleReject(queueItem) {
    const reason = prompt('거부 사유를 입력하세요:', '부적절한 콘텐츠')
    if (!reason) return

    try {
      const { error: photoError } = await supabase
        .from('photos')
        .update({
          moderation_status: 'rejected',
          status: 'inactive'
        })
        .eq('id', queueItem.photo_id)

      if (photoError) throw photoError

      const { error: queueError } = await supabase
        .from('moderation_queue')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: reason
        })
        .eq('id', queueItem.id)

      if (queueError) throw queueError

      alert('❌ 거부되었습니다!')
      loadModerationData()
    } catch (error) {
      console.error('거부 실패:', error)
      alert('거부 처리 중 오류가 발생했습니다')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#B3D966] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">사진 검수</h2>
        <p className="text-gray-600">
          업로드된 사진의 안전성을 확인하고 승인/거부하세요
        </p>
      </div>

      {/* 검수 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={18} className="text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-700">
              대기 중
            </span>
          </div>
          <p className="text-3xl font-bold text-yellow-700">
            {moderationStats.pending}
          </p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Check size={18} className="text-green-600" />
            <span className="text-sm font-semibold text-green-700">승인됨</span>
          </div>
          <p className="text-3xl font-bold text-green-700">
            {moderationStats.approved}
          </p>
        </div>

        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <X size={18} className="text-red-600" />
            <span className="text-sm font-semibold text-red-700">거부됨</span>
          </div>
          <p className="text-3xl font-bold text-red-700">
            {moderationStats.rejected}
          </p>
        </div>
      </div>

      {/* 검수 대기 목록 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={20} className="text-gray-700" />
          <h3 className="text-lg font-bold text-gray-800">
            검수 대기 목록 ({pendingPhotos.length})
          </h3>
        </div>

        {pendingPhotos.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">
              검수 대기 중인 사진이 없습니다
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {pendingPhotos.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl overflow-hidden shadow-md border-2 border-yellow-200"
              >
                <div className="p-4">
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100">
                    <img
                      src={item.photos?.preview_url}
                      alt={item.photos?.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">{item.photos?.title}</h3>
                    <p className="text-sm text-gray-600">
                      판매자:{' '}
                      <span className="font-medium">
                        {item.seller_name || '알 수 없음'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      가격:{' '}
                      <span className="font-bold text-[#558B2F]">
                        {item.photos?.current_price?.toLocaleString()}P
                      </span>
                    </p>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">안전 점수:</span>
                      <span
                        className={`font-bold ${
                          item.safety_score >= 0.8
                            ? 'text-green-600'
                            : item.safety_score >= 0.5
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {(item.safety_score * 100).toFixed(0)}점
                      </span>
                    </div>

                    {item.detected_issues && item.detected_issues.length > 0 && (
                      <div className="text-sm bg-red-50 border border-red-200 rounded-lg p-2">
                        <span className="font-semibold text-red-700">
                          ⚠️ 검출:
                        </span>
                        <span className="text-red-600 ml-2">
                          {item.detected_issues.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-0 border-t-2 border-gray-100">
                  <button
                    onClick={() => handleApprove(item)}
                    className="flex items-center justify-center gap-2 py-4 bg-green-50 hover:bg-green-100 text-green-700 font-bold transition-colors"
                  >
                    <Check size={18} />
                    승인
                  </button>
                  <button
                    onClick={() => handleReject(item)}
                    className="flex items-center justify-center gap-2 py-4 bg-red-50 hover:bg-red-100 text-red-700 font-bold transition-colors border-l-2 border-gray-100"
                  >
                    <X size={18} />
                    거부
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
