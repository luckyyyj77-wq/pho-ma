// src/pages/UserProfile.jsx - 다른 사용자 프로필 페이지
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ArrowLeft, Store, Award, FileText } from 'lucide-react'

export default function UserProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [photos, setPhotos] = useState([])
  const [stats, setStats] = useState({ selling: 0, sold: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
      fetchUserPhotos()
      fetchUserStats()
    }
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchUserPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      // 판매중인 사진 수
      const { count: sellingCount } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active')

      // 판매완료된 사진 수
      const { count: soldCount } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'sold')

      setStats({
        selling: sellingCount || 0,
        sold: soldCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B3D966] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">프로필 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">사용자를 찾을 수 없습니다</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#B3D966] to-[#9DC183] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            <h1 className="text-lg font-black text-white">판매자 프로필</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          {/* 프로필 이미지 + 기본 정보 */}
          <div className="flex items-start gap-6 mb-6">
            {/* 프로필 이미지 */}
            <div className="flex-shrink-0">
              {profile.profile_image ? (
                <img
                  src={profile.profile_image}
                  alt={profile.username}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#B3D966]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C8E6C9] to-[#A5D6A7] flex items-center justify-center text-4xl border-4 border-[#B3D966]">
                  {profile.username?.[0]?.toUpperCase() || '😊'}
                </div>
              )}
            </div>

            {/* 기본 정보 */}
            <div className="flex-1">
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                {profile.username || '익명 사용자'}
              </h2>

              {/* 등급 (미구현 - 자리만) */}
              <div className="flex items-center gap-2 mb-3">
                <Award size={20} className="text-yellow-500" />
                <span className="text-sm font-semibold text-gray-600">
                  일반 회원
                </span>
                <span className="text-xs text-gray-400">
                  (등급 시스템 준비중)
                </span>
              </div>

              {/* 통계 */}
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-black text-[#558B2F]">{stats.selling}</p>
                  <p className="text-sm text-gray-600">판매중</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-blue-600">{stats.sold}</p>
                  <p className="text-sm text-gray-600">판매완료</p>
                </div>
              </div>
            </div>
          </div>

          {/* 소개글 (미구현 - 자리만) */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={18} className="text-gray-500" />
              <h3 className="font-bold text-gray-700">소개</h3>
            </div>
            <p className="text-sm text-gray-500 italic">
              {profile.bio || '아직 소개글이 없습니다. (소개글 기능 준비중)'}
            </p>
          </div>
        </div>

        {/* 판매중인 사진 리스트 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Store size={24} className="text-[#558B2F]" />
            <h2 className="text-xl font-black text-gray-900">판매중인 사진</h2>
            <span className="text-sm text-gray-500">({photos.length})</span>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-600">판매중인 사진이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => navigate(`/detail/${photo.id}`)}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer"
                >
                  {/* 이미지 */}
                  <div className="relative aspect-square bg-gray-100">
                    {photo.preview_url ? (
                      <img
                        src={photo.preview_url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#C8E6C9] to-[#A5D6A7] flex items-center justify-center">
                        <span className="text-4xl">📸</span>
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="p-3">
                    <h3 className="font-bold text-gray-900 mb-1 truncate">
                      {photo.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">현재가</span>
                      <span className="text-lg font-black text-[#558B2F]">
                        {photo.current_price?.toLocaleString() || 0}P
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
