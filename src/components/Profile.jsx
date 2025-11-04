// src/components/Profile.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { LogOut, User, Mail, Calendar, Coins, Upload, Home, CreditCard } from 'lucide-react'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 현재 사용자 정보 가져오기
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // 프로필 정보 가져오기 (포인트 포함)
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
          if (error) {
            console.error('프로필 조회 에러:', error)
          }
          
          // 프로필이 없으면 생성
          if (!profileData) {
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                username: user.user_metadata?.name || user.email?.split('@')[0],
                points: 1000
              })
              .select()
              .single()
            
            if (insertError) {
              console.error('프로필 생성 에러:', insertError)
              // 프로필 생성 실패 시 기본값 사용
              setProfile({ id: user.id, points: 0, username: null })
            } else {
              setProfile(newProfile)
            }
          } else {
            setProfile(profileData)
          }
        }
      } catch (error) {
        console.error('유저 정보 가져오기 에러:', error)
      } finally {
        setLoading(false)
      }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🍜</div>
          <p className="text-gray-600 font-medium">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🍜</div>
          <p className="text-gray-600 mb-6 text-lg">로그인이 필요합니다</p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            로그인하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 pb-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🍜</div>
          <h1 className="text-3xl font-bold text-gray-800">내 프로필</h1>
          <p className="text-gray-600 mt-2">포마에 오신 것을 환영합니다!</p>
        </div>

        {/* 포인트 카드 */}
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl shadow-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Coins size={24} />
              <p className="text-sm font-medium opacity-90">보유 포인트</p>
            </div>
            <button
              disabled
              className="px-4 py-2 bg-white/50 text-white text-sm font-bold rounded-lg cursor-not-allowed"
            >
              충전 준비중
            </button>
          </div>
          <p className="text-5xl font-bold mb-2">
            {(profile?.points || 0).toLocaleString()}P
          </p>
          <p className="text-xs opacity-80">사진 구매 및 입찰에 사용 가능</p>
        </div>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          
          {/* 프로필 사진 */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {user.user_metadata?.name?.[0]?.toUpperCase() || 
               profile?.username?.[0]?.toUpperCase() ||
               user.email?.[0]?.toUpperCase()}
            </div>
          </div>

          {/* 사용자 정보 */}
          <div className="space-y-3">
            
            {(user.user_metadata?.name || profile?.username) && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl">
                <User className="text-orange-600 mt-1" size={20} />
                <div>
                  <p className="text-xs text-gray-500 mb-1">이름</p>
                  <p className="font-bold text-gray-800">
                    {user.user_metadata?.name || profile?.username}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
              <Mail className="text-blue-600 mt-1" size={20} />
              <div>
                <p className="text-xs text-gray-500 mb-1">이메일</p>
                <p className="font-bold text-gray-800 break-all">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl">
              <Calendar className="text-green-600 mt-1" size={20} />
              <div>
                <p className="text-xs text-gray-500 mb-1">가입일</p>
                <p className="font-bold text-gray-800">
                  {new Date(user.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* 인증 제공자 */}
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl">
              <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs mt-1">
                ✓
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">로그인 방식</p>
                <p className="font-bold text-gray-800 capitalize">
                  {user.app_metadata.provider === 'email' ? '이메일' : 
                   user.app_metadata.provider === 'google' ? 'Google' :
                   user.app_metadata.provider === 'phone' ? '전화번호' :
                   user.app_metadata.provider}
                </p>
              </div>
            </div>
          </div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
          >
            <LogOut size={20} />
            로그아웃
          </button>
        </div>

        {/* 퀵 액션 버튼들 */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => window.location.href = '/'}
            className="flex flex-col items-center gap-2 py-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white">
              <Home size={24} />
            </div>
            <span className="text-sm font-bold text-gray-700">홈</span>
          </button>

          <button
            onClick={() => window.location.href = '/upload'}
            className="flex flex-col items-center gap-2 py-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white">
              <Upload size={24} />
            </div>
            <span className="text-sm font-bold text-gray-700">업로드</span>
          </button>

          <button
            disabled
            className="flex flex-col items-center gap-2 py-4 bg-gray-100 rounded-xl shadow-lg opacity-50 cursor-not-allowed"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-white">
              <CreditCard size={24} />
            </div>
            <span className="text-sm font-bold text-gray-500">준비중</span>
          </button>
        </div>

        {/* 통계 정보 (선택사항) */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">내 활동</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-orange-600">0</p>
              <p className="text-xs text-gray-600 mt-1">업로드</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">0</p>
              <p className="text-xs text-gray-600 mt-1">구매</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-xs text-gray-600 mt-1">좋아요</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}