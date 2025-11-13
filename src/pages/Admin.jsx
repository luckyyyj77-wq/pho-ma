// src/pages/Admin.jsx - 통합 관리자 대시보드
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  ArrowLeft, Shield, Menu,
  Home, ImageIcon as PhotoIcon, FolderOpen, MessageSquare, UserCog, Coins
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

// 관리자 페이지 컴포넌트들
import Dashboard from './admin/Dashboard'
import PhotoModeration from './admin/PhotoModeration'
import CategoryManagement from './admin/CategoryManagement'

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // 권한 및 메뉴 상태
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0)

  // 관리자 권한 체크
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setCheckingAdmin(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        if (error) throw error

        if (data?.is_admin) {
          setIsAdmin(true)
        } else {
          alert('❌ 관리자 권한이 없습니다!')
          navigate('/')
        }
      } catch (error) {
        console.error('권한 체크 실패:', error)
        navigate('/')
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdminStatus()
  }, [user, navigate])

  // 검수 대기 수 로드 (배지 표시용)
  useEffect(() => {
    if (isAdmin) {
      loadPendingReviews()
    }
  }, [isAdmin])

  async function loadPendingReviews() {
    try {
      const { count } = await supabase
        .from('moderation_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      setPendingReviewsCount(count || 0)
    } catch (error) {
      console.error('검수 대기 수 로드 실패:', error)
    }
  }

  // 로딩 화면
  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B3D966] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩중...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  // 메뉴 아이템
  const menuItems = [
    { id: 'dashboard', icon: Home, label: '대시보드', badge: null },
    { id: 'photos', icon: PhotoIcon, label: '사진 관리', badge: pendingReviewsCount },
    { id: 'categories', icon: FolderOpen, label: '카테고리', badge: null },
    { id: 'board', icon: MessageSquare, label: '게시판', badge: null },
    { id: 'users', icon: UserCog, label: '회원 관리', badge: null },
    { id: 'points', icon: Coins, label: '포인트', badge: null },
  ]

  // 현재 활성 컴포넌트 렌더링
  function renderActiveContent() {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />
      case 'photos':
        return <PhotoModeration />
      case 'categories':
        return <CategoryManagement />
      case 'board':
        return <ComingSoon title="게시판 관리" />
      case 'users':
        return <ComingSoon title="회원 관리" />
      case 'points':
        return <ComingSoon title="포인트 관리" />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9]">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-[#B3D966] to-[#9DC183] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>

            <div className="flex items-center gap-2">
              <Shield size={24} className="text-white" />
              <h1 className="text-xl font-black text-white">관리자</h1>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors md:hidden"
            >
              <Menu size={24} className="text-white" />
            </button>
            <div className="w-10 hidden md:block"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* 사이드바 메뉴 */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-64 bg-white shadow-lg min-h-screen sticky top-[72px] overflow-y-auto`}>
          <div className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id)
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeMenu === item.id
                    ? 'bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white shadow-md'
                    : 'hover:bg-[#F1F8E9] text-gray-700'
                }`}
              >
                <item.icon size={20} />
                <span className="font-semibold flex-1 text-left">{item.label}</span>
                {item.badge !== null && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 p-4 md:p-6">
          {renderActiveContent()}
        </div>
      </div>
    </div>
  )
}

// ComingSoon 컴포넌트 (미구현 기능용)
function ComingSoon({ title }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-12">
      <div className="text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600">곧 제공될 예정입니다</p>
      </div>
    </div>
  )
}
