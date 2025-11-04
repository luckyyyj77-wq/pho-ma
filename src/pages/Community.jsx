// src/pages/Community.jsx - 커뮤니티 게시판 with 글쓰기 기능
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  MessageSquare, 
  ArrowLeft, 
  PenSquare, 
  X, 
  Image as ImageIcon, 
  Send,
  Heart,
  MessageCircle,
  Clock,
  Loader
} from 'lucide-react'

export default function Community() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [showWriteModal, setShowWriteModal] = useState(false)
  
  // 글쓰기 폼 상태
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    checkUser()
    fetchPosts()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchPosts = async () => {
    setLoading(true)
    
    // 1. 먼저 게시글 가져오기
    const { data: postsData, error: postsError } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      setLoading(false)
      return
    }

    // 2. 각 게시글의 작성자 정보 가져오기
    const postsWithProfiles = await Promise.all(
      (postsData || []).map(async (post) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', post.user_id)
          .single()

        return {
          ...post,
          profiles: profile || { username: '알 수 없음', avatar_url: null }
        }
      })
    )

    setPosts(postsWithProfiles)
    setLoading(false)
  }

  // 이미지 선택 핸들러
  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.')
        return
      }
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // 이미지 제거
  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  // 글 작성 핸들러
  const handleSubmitPost = async (e) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    setUploading(true)

    try {
      let imageUrl = null

      // 이미지가 있으면 업로드
      if (image) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `community/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, image)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath)

        imageUrl = publicUrl
      }

      // 게시글 저장
      const { error: insertError } = await supabase
        .from('community_posts')
        .insert([
          {
            user_id: user.id,
            title: title.trim(),
            content: content.trim(),
            image_url: imageUrl,
            likes_count: 0,
            comments_count: 0
          }
        ])

      if (insertError) throw insertError

      // 성공 시 초기화
      setTitle('')
      setContent('')
      setImage(null)
      setImagePreview(null)
      setShowWriteModal(false)
      
      // 게시글 목록 새로고침
      fetchPosts()
      
      alert('게시글이 작성되었습니다! 🎉')
    } catch (error) {
      console.error('Error creating post:', error)
      alert('게시글 작성 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  // 시간 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000) // 초 단위

    if (diff < 60) return '방금 전'
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
    
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9]">
      
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#B3D966] to-[#9DC183] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.location.href = '/'}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            
            <div className="flex items-center gap-2">
              <MessageSquare size={24} className="text-white" />
              <h1 className="text-xl font-black text-white">커뮤니티 게시판</h1>
            </div>

            <button
              onClick={() => setShowWriteModal(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <PenSquare size={24} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#B3D966] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">게시글을 불러오는 중...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <MessageSquare size={64} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">아직 게시글이 없어요</p>
            <p className="text-gray-400 text-sm mb-6">첫 번째 게시글을 작성해보세요!</p>
            <button
              onClick={() => setShowWriteModal(true)}
              className="bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              글쓰기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer"
              >
                <div className="flex gap-3 p-3">
                  {/* 좌측: 텍스트 영역 */}
                  <div className="flex-1 min-w-0">
                    {/* 작성자 정보 */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#B3D966] to-[#9DC183] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 truncate">
                        {post.profiles?.username || '익명'}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={10} />
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>

                    {/* 제목 */}
                    <h3 className="font-bold text-sm text-gray-800 mb-1 line-clamp-1">
                      {post.title}
                    </h3>

                    {/* 내용 미리보기 */}
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {post.content}
                    </p>

                    {/* 좋아요, 댓글 */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Heart size={14} />
                        <span className="text-xs font-medium">{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <MessageCircle size={14} />
                        <span className="text-xs font-medium">{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* 우측: 썸네일 이미지 */}
                  {post.image_url ? (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={24} className="text-[#9DC183]" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 글쓰기 모달 */}
      {showWriteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-gradient-to-r from-[#B3D966] to-[#9DC183] p-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-xl font-black text-white">글쓰기</h2>
              <button
                onClick={() => {
                  setShowWriteModal(false)
                  setTitle('')
                  setContent('')
                  removeImage()
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            {/* 글쓰기 폼 */}
            <form onSubmit={handleSubmitPost} className="p-6 space-y-4">
              {/* 제목 입력 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B3D966] focus:outline-none transition-colors"
                  maxLength={100}
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {title.length}/100
                </p>
              </div>

              {/* 내용 입력 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="내용을 입력하세요"
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B3D966] focus:outline-none transition-colors resize-none"
                  maxLength={2000}
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {content.length}/2000
                </p>
              </div>

              {/* 이미지 첨부 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이미지 첨부 (선택)
                </label>
                
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full rounded-xl object-cover max-h-64"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      disabled={uploading}
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="block">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#B3D966] transition-colors">
                      <ImageIcon size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        클릭하여 이미지 선택
                      </p>
                      <p className="text-xs text-gray-400">
                        최대 5MB, JPG/PNG
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={uploading || !title.trim() || !content.trim()}
                className="w-full bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    <span>작성 중...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>게시글 작성</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}