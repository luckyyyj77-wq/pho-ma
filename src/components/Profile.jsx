// src/components/Profile.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { LogOut, User, Mail, Calendar } from 'lucide-react'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 현재 사용자 정보 가져오기
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍜</div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍜</div>
          <p className="text-gray-600 mb-4">로그인이 필요합니다</p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
          >
            로그인하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🍜</div>
          <h1 className="text-2xl font-bold text-gray-800">내 정보</h1>
        </div>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          
          {/* 프로필 사진 */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {user.user_metadata?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
            </div>
          </div>

          {/* 사용자 정보 */}
          <div className="space-y-4">
            
            {user.user_metadata?.name && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <User className="text-orange-600 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">이름</p>
                  <p className="font-semibold text-gray-800">{user.user_metadata.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="text-orange-600 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-500">이메일</p>
                <p className="font-semibold text-gray-800">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="text-orange-600 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-500">가입일</p>
                <p className="font-semibold text-gray-800">
                  {new Date(user.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>

            {/* 인증 제공자 */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs mt-1">
                ✓
              </div>
              <div>
                <p className="text-sm text-gray-500">로그인 방식</p>
                <p className="font-semibold text-gray-800 capitalize">
                  {user.app_metadata.provider === 'email' ? '이메일' : 
                   user.app_metadata.provider === 'google' ? 'Google' :
                   user.app_metadata.provider}
                </p>
              </div>
            </div>
          </div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className="w-full mt-8 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            로그아웃
          </button>
        </div>

        {/* 추가 액션 */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow font-semibold text-gray-700"
          >
            홈으로
          </button>
          <button
            onClick={() => window.location.href = '/upload'}
            className="py-3 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 transition-colors font-semibold"
          >
            사진 올리기
          </button>
        </div>
      </div>
    </div>
  )
}
