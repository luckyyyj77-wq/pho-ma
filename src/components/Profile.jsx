// src/components/Profile.jsx - 샤인머스켓 테마
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { LogOut, User, Mail, Calendar, Sparkles, Upload, Home, CreditCard, Award } from 'lucide-react'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
          
          if (error) {
            console.error('프로필 조회 에러:', error)
          }
          
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F1F8E9] to-[#E8F5E9]">
        <div className="text-center">
          <svg width="80" height="82" viewBox="0 0 326 335" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-bounce mx-auto mb-4">
            <path d="M200 128.171C200 183.399 155.228 228.171 100 228.171C44.7715 228.171 0 183.399 0 128.171C0 72.9422 44.7715 28.1707 100 28.1707C155.228 28.1707 200 72.9422 200 128.171Z" fill="#D9D9D9"/>
            <path d="M192 127.671C192 178.757 150.586 220.171 99.5 220.171C48.4137 220.171 7 178.757 7 127.671C7 76.5844 48.4137 35.1707 99.5 35.1707C150.586 35.1707 192 76.5844 192 127.671Z" fill="#B3D966"/>
            <path d="M261 234.171C261 289.399 216.228 334.171 161 334.171C105.772 334.171 61 289.399 61 234.171C61 178.942 105.772 134.171 161 134.171C216.228 134.171 261 178.942 261 234.171Z" fill="#D9D9D9"/>
            <path d="M253 233.671C253 284.757 211.586 326.171 160.5 326.171C109.414 326.171 68 284.757 68 233.671C68 182.584 109.414 141.171 160.5 141.171C211.586 141.171 253 182.584 253 233.671Z" fill="#B3D966"/>
            <path d="M326 135.171C326 190.399 281.228 235.171 226 235.171C170.772 235.171 126 190.399 126 135.171C126 79.9422 170.772 35.1707 226 35.1707C281.228 35.1707 326 79.9422 326 135.171Z" fill="#D9D9D9"/>
            <path d="M318 134.671C318 185.757 276.586 227.171 225.5 227.171C174.414 227.171 133 185.757 133 134.671C133 83.5844 174.414 42.1707 225.5 42.1707C276.586 42.1707 318 83.5844 318 134.671Z" fill="#B3D966"/>
            <path d="M148.5 20.0008C147.119 17.6094 147.939 14.5514 150.33 13.1707L171.981 0.670708C174.372 -0.710004 177.43 0.109372 178.811 2.50083L191.311 24.1515C192.692 26.5429 191.872 29.6009 189.481 30.9816L167.83 43.4816C165.439 44.8623 162.381 44.0429 161 41.6515L148.5 20.0008Z" fill="#C96464"/>
          </svg>
          <p className="text-[#558B2F] font-medium">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F1F8E9] to-[#E8F5E9]">
        <div className="text-center px-4">
          <svg width="100" height="103" viewBox="0 0 326 335" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-6">
            <path d="M200 128.171C200 183.399 155.228 228.171 100 228.171C44.7715 228.171 0 183.399 0 128.171C0 72.9422 44.7715 28.1707 100 28.1707C155.228 28.1707 200 72.9422 200 128.171Z" fill="#D9D9D9"/>
            <path d="M192 127.671C192 178.757 150.586 220.171 99.5 220.171C48.4137 220.171 7 178.757 7 127.671C7 76.5844 48.4137 35.1707 99.5 35.1707C150.586 35.1707 192 76.5844 192 127.671Z" fill="#B3D966"/>
            <path d="M261 234.171C261 289.399 216.228 334.171 161 334.171C105.772 334.171 61 289.399 61 234.171C61 178.942 105.772 134.171 161 134.171C216.228 134.171 261 178.942 261 234.171Z" fill="#D9D9D9"/>
            <path d="M253 233.671C253 284.757 211.586 326.171 160.5 326.171C109.414 326.171 68 284.757 68 233.671C68 182.584 109.414 141.171 160.5 141.171C211.586 141.171 253 182.584 253 233.671Z" fill="#B3D966"/>
            <path d="M326 135.171C326 190.399 281.228 235.171 226 235.171C170.772 235.171 126 190.399 126 135.171C126 79.9422 170.772 35.1707 226 35.1707C281.228 35.1707 326 79.9422 326 135.171Z" fill="#D9D9D9"/>
            <path d="M318 134.671C318 185.757 276.586 227.171 225.5 227.171C174.414 227.171 133 185.757 133 134.671C133 83.5844 174.414 42.1707 225.5 42.1707C276.586 42.1707 318 83.5844 318 134.671Z" fill="#B3D966"/>
            <path d="M148.5 20.0008C147.119 17.6094 147.939 14.5514 150.33 13.1707L171.981 0.670708C174.372 -0.710004 177.43 0.109372 178.811 2.50083L191.311 24.1515C192.692 26.5429 191.872 29.6009 189.481 30.9816L167.83 43.4816C165.439 44.8623 162.381 44.0429 161 41.6515L148.5 20.0008Z" fill="#C96464"/>
          </svg>
          <p className="text-[#558B2F] text-xl font-semibold mb-6">로그인이 필요합니다</p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white px-8 py-4 rounded-2xl font-bold shadow-2xl hover:shadow-3xl transition-all transform hover:-translate-y-0.5"
          >
            로그인하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] pb-24">
      <div className="max-w-2xl mx-auto p-4 py-8">
        
        {/* 헤더 */}
        <div className="text-center mb-8">
          <svg width="80" height="82" viewBox="0 0 326 335" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 animate-bounce-slow">
            <path d="M200 128.171C200 183.399 155.228 228.171 100 228.171C44.7715 228.171 0 183.399 0 128.171C0 72.9422 44.7715 28.1707 100 28.1707C155.228 28.1707 200 72.9422 200 128.171Z" fill="#D9D9D9"/>
            <path d="M192 127.671C192 178.757 150.586 220.171 99.5 220.171C48.4137 220.171 7 178.757 7 127.671C7 76.5844 48.4137 35.1707 99.5 35.1707C150.586 35.1707 192 76.5844 192 127.671Z" fill="#B3D966"/>
            <path d="M261 234.171C261 289.399 216.228 334.171 161 334.171C105.772 334.171 61 289.399 61 234.171C61 178.942 105.772 134.171 161 134.171C216.228 134.171 261 178.942 261 234.171Z" fill="#D9D9D9"/>
            <path d="M253 233.671C253 284.757 211.586 326.171 160.5 326.171C109.414 326.171 68 284.757 68 233.671C68 182.584 109.414 141.171 160.5 141.171C211.586 141.171 253 182.584 253 233.671Z" fill="#B3D966"/>
            <path d="M326 135.171C326 190.399 281.228 235.171 226 235.171C170.772 235.171 126 190.399 126 135.171C126 79.9422 170.772 35.1707 226 35.1707C281.228 35.1707 326 79.9422 326 135.171Z" fill="#D9D9D9"/>
            <path d="M318 134.671C318 185.757 276.586 227.171 225.5 227.171C174.414 227.171 133 185.757 133 134.671C133 83.5844 174.414 42.1707 225.5 42.1707C276.586 42.1707 318 83.5844 318 134.671Z" fill="#B3D966"/>
            <path d="M148.5 20.0008C147.119 17.6094 147.939 14.5514 150.33 13.1707L171.981 0.670708C174.372 -0.710004 177.43 0.109372 178.811 2.50083L191.311 24.1515C192.692 26.5429 191.872 29.6009 189.481 30.9816L167.83 43.4816C165.439 44.8623 162.381 44.0429 161 41.6515L148.5 20.0008Z" fill="#C96464"/>
          </svg>
          <h1 className="text-3xl font-black text-[#558B2F]">내 프로필</h1>
          <p className="text-[#7CB342] mt-2">신선한 나의 정보</p>
        </div>

        {/* 포인트 카드 */}
        <div className="bg-gradient-to-br from-[#B3D966] to-[#9DC183] rounded-3xl shadow-2xl p-6 mb-6 text-white relative overflow-hidden">
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={24} />
                <p className="text-sm font-medium opacity-90">보유 포인트</p>
              </div>
              <Award size={32} className="text-white/50" />
            </div>
            <p className="text-6xl font-black mb-2">
              {(profile?.points || 0).toLocaleString()}
              <span className="text-2xl ml-2">P</span>
            </p>
            <p className="text-xs opacity-80">신선한 사진 구매에 사용하세요</p>
          </div>
        </div>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          
          {/* 프로필 아바타 */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-[#B3D966] to-[#8FB573] rounded-full flex items-center justify-center text-white text-4xl font-black shadow-lg">
                {user.user_metadata?.name?.[0]?.toUpperCase() || 
                 profile?.username?.[0]?.toUpperCase() ||
                 user.email?.[0]?.toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#C96464] rounded-full flex items-center justify-center text-white shadow-lg">
                ✓
              </div>
            </div>
          </div>

          {/* 사용자 정보 */}
          <div className="space-y-3">
            
            {(user.user_metadata?.name || profile?.username) && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#F1F8E9] to-[#E8F5E9] rounded-2xl">
                <User className="text-[#B3D966] mt-1" size={20} />
                <div>
                  <p className="text-xs text-gray-500 mb-1">이름</p>
                  <p className="font-bold text-gray-800">
                    {user.user_metadata?.name || profile?.username}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#E3F2FD] to-[#BBDEFB] rounded-2xl">
              <Mail className="text-blue-600 mt-1" size={20} />
              <div>
                <p className="text-xs text-gray-500 mb-1">이메일</p>
                <p className="font-bold text-gray-800 break-all">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#FFF9C4] to-[#FFF59D] rounded-2xl">
              <Calendar className="text-yellow-600 mt-1" size={20} />
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
          </div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl transition-all"
          >
            <LogOut size={20} />
            로그아웃
          </button>
        </div>

        {/* 퀵 액션 버튼들 */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => window.location.href = '/'}
            className="flex flex-col items-center gap-2 py-5 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Home size={26} />
            </div>
            <span className="text-sm font-bold text-gray-700">홈</span>
          </button>

          <button
            onClick={() => window.location.href = '/upload'}
            className="flex flex-col items-center gap-2 py-5 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-[#B3D966] to-[#9DC183] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Upload size={26} />
            </div>
            <span className="text-sm font-bold text-gray-700">업로드</span>
          </button>

          <button
            disabled
            className="flex flex-col items-center gap-2 py-5 bg-gray-100 rounded-2xl shadow-lg opacity-50 cursor-not-allowed"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl flex items-center justify-center text-white">
              <CreditCard size={26} />
            </div>
            <span className="text-sm font-bold text-gray-500">준비중</span>
          </button>
        </div>

        {/* 통계 정보 */}
        <div className="mt-6 bg-white rounded-3xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-[#558B2F] mb-4 flex items-center gap-2">
            <Sparkles size={20} />
            내 활동
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-[#B3D966]">0</p>
              <p className="text-xs text-gray-600 mt-1">업로드</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-500">0</p>
              <p className="text-xs text-gray-600 mt-1">구매</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-pink-500">0</p>
              <p className="text-xs text-gray-600 mt-1">좋아요</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
