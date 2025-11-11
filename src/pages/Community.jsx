// src/pages/Community.jsx - 커뮤니티 게시판 (이미지 자동 압축 + 욕설 필터링)
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Loader,
  AlertCircle
} from 'lucide-react'
import { validateContent, validatePhotoTitle } from '../utils/profanityFilter'

export default function Community() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [sortBy, setSortBy] = useState('new') // 'new' | 'popular'
  
  // 글쓰기 폼 상태
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  // 필터링 에러 상태
  const [titleError, setTitleError] = useState('')
  const [contentError, setContentError] = useState('')

  useEffect(() => {
    checkUser()
    fetchPosts()
  }, [])

  // 정렬 방식 변경 시 게시글 다시 불러오기
  useEffect(() => {
    fetchPosts()
  }, [sortBy])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchPosts = async () => {
    setLoading(true)

    let query = supabase
      .from('community_posts')
      .select('*')

    // 정렬 방식 적용
    if (sortBy === 'popular') {
      // 인기순: 좋아요 개수 우선, 같으면 댓글 개수, 그것도 같으면 최신순
      query = query
        .order('likes_count', { ascending: false })
        .order('comments_count', { ascending: false })
        .order('created_at', { ascending: false })
    } else {
      // 신규순: 등록 시점 기준 최신순
      query = query.order('created_at', { ascending: false })
    }

    const { data: postsData, error: postsError } = await query

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      setLoading(false)
      return
    }

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

  // 이미지 자동 압축 (모바일 최적화)
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target.result
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // 모바일 최적화: 최대 1280px
          let width = img.width
          let height = img.height
          const maxSize = 1280
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
          
          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)
          
          // 최대 압축 (품질 0.7)
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            },
            'image/jpeg',
            0.7
          )
        }
      }
    })
  }

  // 이미지 선택 핸들러
  const handleImageSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // 자동 압축
    const compressed = await compressImage(file)
    setImage(compressed)
    setImagePreview(URL.createObjectURL(compressed))
  }

  // 이미지 제거
  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  // 제목 입력 핸들러 (욕설 필터링 추가)
  const handleTitleChange = (e) => {
    const value = e.target.value
    setTitle(value)
    
    // 실시간 욕설 검증
    if (value.length > 0) {
      const validation = validatePhotoTitle(value)
      setTitleError(validation.isValid ? '' : validation.message)
    } else {
      setTitleError('')
    }
  }

  // 내용 입력 핸들러 (욕설 필터링 추가)
  const handleContentChange = (e) => {
    const value = e.target.value
    setContent(value)
    
    // 실시간 욕설 검증
    if (value.length > 0) {
      const validation = validateContent(value, 1, 2000)
      setContentError(validation.isValid ? '' : validation.message)
    } else {
      setContentError('')
    }
  }

  // 글 작성 핸들러
  const handleSubmitPost = async (e) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    // 최종 욕설 검증
    const titleValidation = validatePhotoTitle(title)
    if (!titleValidation.isValid) {
      alert(titleValidation.message)
      return
    }

    const contentValidation = validateContent(content, 1, 2000)
    if (!contentValidation.isValid) {
      alert(contentValidation.message)
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
      setTitleError('')
      setContentError('')
      
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
    const diff = Math.floor((now - date) / 1000)

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

      {/* 정렬 탭 */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('new')}
            className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md transition-all ${
              sortBy === 'new'
                ? 'bg-[#B3D966] text-white'
                : 'bg-white text-gray-700 hover:bg-[#B3D966] hover:text-white'
            }`}
          >
            🆕 신규
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md transition-all ${
              sortBy === 'popular'
                ? 'bg-[#B3D966] text-white'
                : 'bg-white text-gray-700 hover:bg-[#B3D966] hover:text-white'
            }`}
          >
            🔥 인기
          </button>
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
                onClick={() => navigate(`/community/${post.id}`)}
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
                  setTitleError('')
                  setContentError('')
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
                  onChange={handleTitleChange}
                  placeholder="제목을 입력하세요"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    titleError 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-[#B3D966]'
                  }`}
                  maxLength={100}
                  disabled={uploading}
                />
                {titleError ? (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle size={14} className="text-red-500" />
                    <p className="text-xs text-red-500">{titleError}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {title.length}/100
                  </p>
                )}
              </div>

              {/* 내용 입력 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="내용을 입력하세요"
                  rows={8}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors resize-none ${
                    contentError 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-[#B3D966]'
                  }`}
                  maxLength={2000}
                  disabled={uploading}
                />
                {contentError ? (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle size={14} className="text-red-500" />
                    <p className="text-xs text-red-500">{contentError}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {content.length}/2000
                  </p>
                )}
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
                        JPG/PNG (자동 압축)
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
                disabled={uploading || !title.trim() || !content.trim() || titleError || contentError}
                className="w-full bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    <span>등록 중...</span>
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