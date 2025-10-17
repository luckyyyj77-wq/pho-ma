// ============================================
// 📦 라이브러리 및 컴포넌트 import
// ============================================
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, User, Image, Heart, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'




// ============================================
// 🎯 메인 컴포넌트
// ============================================
export default function Profile() {

  // ------------------------------------------
  // 🔐 로그인 상태 체크
  // ------------------------------------------
  const { user, loading: authLoading } = useAuth()


  // ------------------------------------------
  // 📊 내 정보 state 관리
  // ------------------------------------------
  const [myPhotos, setMyPhotos] = useState([])
  const [points, setPoints] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [activeTab, setActiveTab] = useState('photos')
  const [stats, setStats] = useState({
    totalPhotos: 0,
    totalSales: 0,
    totalEarnings: 0
  })




  // ------------------------------------------
  // 🚪 로그인 체크 및 데이터 로드
  // ------------------------------------------
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth'
    } else if (user) {
      fetchMyPhotos() 
    }
  }, [user, authLoading])




  // ------------------------------------------
  // 📸 내가 올린 사진 목록 불러오기
  // ------------------------------------------
  async function fetchMyPhotos() {
    try {
      // 내 사진 목록
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setMyPhotos(data || [])
      
      // 내 포인트 조회
      const { data: pointData } = await supabase
        .from('user_points')
        .select('balance')
        .eq('user_id', user.id)
        .single()
      
      setPoints(pointData?.balance || 0)

      // 거래 내역 조회
      const { data: transData } = await supabase
        .from('transactions')
        .select(`
          *,
          photos (title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      setTransactions(transData || [])

      // 통계 계산
      setStats({
        totalPhotos: data?.length || 0,
        totalSales: 0,
        totalEarnings: data?.reduce((sum, p) => sum + (p.current_price || 0), 0) || 0
      })
    } catch (error) {
      console.error('Error:', error)
    }
  }




  // ------------------------------------------
  // ⏳ 로딩 중 화면
  // ------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🍜</div>
          <p className="text-gray-500">로딩중...</p>
        </div>
      </div>
    )
  }




  // ============================================
  // 🎨 UI 렌더링
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50 pb-20">


      {/* ------------------------------------------
          📌 상단 헤더
      ------------------------------------------ */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4">
        <button 
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft size={20} />
          <span>뒤로</span>
        </button>
        

        {/* 프로필 정보 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <User size={40} />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {user?.user_metadata?.nickname || '포마 유저'}
            </h1>
            <p className="text-sm opacity-90">{user?.email}</p>
            <p className="text-sm font-bold mt-1">💰 {points.toLocaleString()}P</p>
          </div>
        </div>


        {/* 통계 정보 */}
        <div className="grid grid-cols-3 gap-3 bg-white/10 rounded-xl p-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.totalPhotos}</p>
            <p className="text-xs opacity-90">등록 사진</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.totalSales}</p>
            <p className="text-xs opacity-90">판매 완료</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{(stats.totalEarnings / 10000).toFixed(1)}만</p>
            <p className="text-xs opacity-90">총 수익</p>
          </div>
        </div>
      </div>




      {/* ------------------------------------------
          📋 탭 메뉴 + 컨텐츠
      ------------------------------------------ */}
      <div className="p-4 max-w-7xl mx-auto">
        
        {/* 탭 버튼 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'photos'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            내 사진 ({myPhotos.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'transactions'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            거래내역 ({transactions.length})
          </button>
        </div>




        {/* ------------------------------------------
            📸 내 사진 탭
        ------------------------------------------ */}
        {activeTab === 'photos' && (
          <>
            {/* 사진이 없을 때 */}
            {myPhotos.length === 0 ? (
              <div className="text-center py-20">
                <Image size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">등록한 사진이 없어요</p>
                <button
                  onClick={() => window.location.href = '/upload'}
                  className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold"
                >
                  첫 사진 등록하기
                </button>
              </div>


            ) : (


              /* 사진 그리드 */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {myPhotos.map(photo => (
                  <div 
                    key={photo.id}
                    className="bg-white rounded-xl overflow-hidden shadow-md"
                  >
                    <div className="aspect-square bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                      {photo.preview_url ? (
                        <img 
                          src={photo.preview_url} 
                          alt={photo.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Image size={32} className="text-orange-300" />
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-sm truncate mb-2">{photo.title}</h3>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">
                          {photo.status === 'active' ? '경매중' : '종료'}
                        </span>
                        <span className="font-bold text-orange-500">
                          {photo.current_price?.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>


            )}
          </>
        )}




        {/* ------------------------------------------
            💳 거래내역 탭
        ------------------------------------------ */}
        {activeTab === 'transactions' && (
          <div>
            {transactions.length === 0 ? (
              
              /* 거래내역 없음 */
              <div className="text-center py-20">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-gray-500">거래 내역이 없어요</p>
              </div>


            ) : (


              /* 거래내역 리스트 */
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div 
                    key={tx.id}
                    className="bg-white rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`text-sm font-semibold ${
                          tx.type === 'purchase' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {tx.type === 'purchase' ? '💸 구매' : '💰 판매'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(tx.created_at).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <p className={`text-lg font-bold ${
                        tx.type === 'purchase' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {tx.type === 'purchase' ? '-' : '+'}{Math.abs(tx.amount).toLocaleString()}P
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{tx.description}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">거래 후 잔액</span>
                      <span className="font-semibold text-gray-700">
                        {tx.balance_after.toLocaleString()}P
                      </span>
                    </div>
                  </div>
                ))}
              </div>


            )}
          </div>
        )}


      </div>


    </div>
  )
}