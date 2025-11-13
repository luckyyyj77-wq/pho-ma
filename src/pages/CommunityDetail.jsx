// src/pages/CommunityDetail.jsx - 게시글 상세 페이지
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Clock,
  MoreVertical,
  Trash2,
  Edit,
  Send,
  X,
  AlertCircle,
  Eye
} from 'lucide-react'
import { validateContent, validatePhotoTitle } from '../utils/profanityFilter'


export default function CommunityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  
  // 댓글 작성
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  
  // 메뉴
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  // 필터링 에러 상태
  const [commentError, setCommentError] = useState('')
  const [editTitleError, setEditTitleError] = useState('')
  const [editContentError, setEditContentError] = useState('')

  useEffect(() => {
    checkUser()
    fetchPost()
    fetchComments()
    incrementViewCount() // 조회수 증가
  }, [id])

  useEffect(() => {
    if (user && post) {
      checkIfLiked()
    }
  }, [user, post])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  // 조회수 증가 함수 (중복 방지)
  const incrementViewCount = async () => {
    try {
      // 세션 ID 가져오기 (없으면 생성)
      let sessionId = localStorage.getItem('view_session_id')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('view_session_id', sessionId)
      }

      // Supabase RPC로 중복 방지 조회수 증가 함수 호출
      const { data, error } = await supabase.rpc('increment_community_views_once_per_day', {
        p_post_id: id,
        p_user_id: user?.id || null,
        p_session_id: sessionId
      })

      if (error) {
        console.error('조회수 증가 실패:', error)
      } else {
        if (data) {
          console.log('👁️ 조회수 증가 (+1)')
        } else {
          console.log('👁️ 오늘 이미 조회한 게시글입니다')
        }
      }
    } catch (error) {
      console.error('조회수 증가 오류:', error)
    }
  }

  // 수정 제목 입력 핸들러
const handleEditTitleChange = (e) => {
  const value = e.target.value
  setEditTitle(value)
  
  if (value.length > 0) {
    const validation = validatePhotoTitle(value)
    setEditTitleError(validation.isValid ? '' : validation.message)
  } else {
    setEditTitleError('')
  }
}

// 수정 내용 입력 핸들러
const handleEditContentChange = (e) => {
  const value = e.target.value
  setEditContent(value)
  
  if (value.length > 0) {
    const validation = validateContent(value, 1, 2000)
    setEditContentError(validation.isValid ? '' : validation.message)
  } else {
    setEditContentError('')
  }
}


// 댓글 입력 핸들러 (욕설 필터링)
const handleCommentChange = (e) => {
  const value = e.target.value
  setCommentText(value)
  
  // 실시간 욕설 검증
  if (value.length > 0) {
    const validation = validateContent(value, 1, 500)
    setCommentError(validation.isValid ? '' : validation.message)
  } else {
    setCommentError('')
  }
}
  const fetchPost = async () => {
    setLoading(true)
    
    const { data: postData, error: postError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (postError) {
      console.error('Error fetching post:', postError)
      alert('게시글을 불러올 수 없습니다.')
      navigate('/community')
      return
    }

    // 작성자 정보 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', postData.user_id)
      .single()

    setPost({
      ...postData,
      profiles: profile || { username: '알 수 없음', avatar_url: null }
    })
    setLikesCount(postData.likes_count || 0)
    setLoading(false)
  }

  const fetchComments = async () => {
    const { data: commentsData, error: commentsError } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      return
    }

    // 각 댓글의 작성자 정보 가져오기 (N+1 문제 해결)
    const userIds = [...new Set((commentsData || []).map(c => c.user_id).filter(Boolean))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds)

    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    const commentsWithProfiles = (commentsData || []).map(comment => ({
      ...comment,
      profiles: profileMap.get(comment.user_id) || { username: '알 수 없음', avatar_url: null }
    }))

    setComments(commentsWithProfiles)
  }

  const checkIfLiked = async () => {
    const { data, error } = await supabase
      .from('community_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()

    if (!error && data) {
      setLiked(true)
    }
  }

  // 좋아요 토글
  const toggleLike = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (liked) {
      // 좋아요 취소
      const { error } = await supabase
        .from('community_likes')
        .delete()
        .eq('post_id', id)
        .eq('user_id', user.id)

      if (!error) {
        setLiked(false)
        setLikesCount(prev => prev - 1)
        
        // posts 테이블 업데이트
        await supabase
          .from('community_posts')
          .update({ likes_count: likesCount - 1 })
          .eq('id', id)
      }
    } else {
      // 좋아요 추가
      const { error } = await supabase
        .from('community_likes')
        .insert([{ post_id: id, user_id: user.id }])

      if (!error) {
        setLiked(true)
        setLikesCount(prev => prev + 1)
        
        // posts 테이블 업데이트
        await supabase
          .from('community_posts')
          .update({ likes_count: likesCount + 1 })
          .eq('id', id)
      }
    }
  }

  // 댓글 작성
  const handleSubmitComment = async (e) => {
    e.preventDefault()
    
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
    
    // 댓글 욕설 검증
const validation = validateContent(commentText, 1, 500)
if (!validation.isValid) {
  alert(validation.message)
  return
}

    if (!commentText.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    setSubmittingComment(true)

    try {
      const { error } = await supabase
        .from('community_comments')
        .insert([
          {
            post_id: id,
            user_id: user.id,
            content: commentText.trim()
          }
        ])

      if (error) throw error

      // 댓글 수 업데이트
      await supabase
        .from('community_posts')
        .update({ comments_count: (post.comments_count || 0) + 1 })
        .eq('id', id)

      setCommentText('')
      fetchComments()
      fetchPost()
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('댓글 작성 중 오류가 발생했습니다.')
    } finally {
      setSubmittingComment(false)
    }
  }

  // 게시글 수정
  const handleEditPost = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
      // 제목 검증
  const titleValidation = validatePhotoTitle(editTitle)
  if (!titleValidation.isValid) {
    alert(titleValidation.message)
    return
  }

  // 내용 검증
  const contentValidation = validateContent(editContent, 1, 2000)
  if (!contentValidation.isValid) {
    alert(contentValidation.message)
    return
  }
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .update({
          title: editTitle.trim(),
          content: editContent.trim()
        })
        .eq('id', id)

      if (error) throw error

      setShowEditModal(false)
      fetchPost()
      alert('게시글이 수정되었습니다.')
    } catch (error) {
      console.error('Error updating post:', error)
      alert('게시글 수정 중 오류가 발생했습니다.')
    }
  }

  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      // 댓글 먼저 삭제
      await supabase
        .from('community_comments')
        .delete()
        .eq('post_id', id)

      // 좋아요 삭제
      await supabase
        .from('community_likes')
        .delete()
        .eq('post_id', id)

      // 게시글 삭제
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('게시글이 삭제되었습니다.')
      navigate('/community')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('게시글 삭제 중 오류가 발생했습니다.')
    }
  }

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('community_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      // 댓글 수 업데이트
      await supabase
        .from('community_posts')
        .update({ comments_count: Math.max((post.comments_count || 0) - 1, 0) })
        .eq('id', id)

      fetchComments()
      fetchPost()
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('댓글 삭제 중 오류가 발생했습니다.')
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B3D966] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">게시글을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!post) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#B3D966] to-[#9DC183] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/community')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            
            <h1 className="text-lg font-black text-white">게시글</h1>

            {user && user.id === post.user_id && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <MoreVertical size={24} className="text-white" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        setEditTitle(post.title)
                        setEditContent(post.content)
                        setShowEditModal(true)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                    >
                      <Edit size={16} />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        handleDeletePost()
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 size={16} />
                      <span>삭제</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {(!user || user.id !== post.user_id) && (
              <div className="w-10"></div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 게시글 카드 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
          {/* 작성자 정보 */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={() => navigate(`/user/${post.user_id}`)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity w-full text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B3D966] to-[#9DC183] flex items-center justify-center text-white font-bold">
                {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">
                  {post.profiles?.username || '익명'}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={12} />
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            </button>
          </div>

          {/* 제목 */}
          <div className="px-4 pt-4">
            <h1 className="text-xl font-black text-gray-900 mb-3">
              {post.title}
            </h1>
          </div>

          {/* 이미지 */}
          {post.image_url && (
            <div className="px-4 mb-4">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full rounded-xl object-cover max-h-96"
              />
            </div>
          )}

          {/* 내용 */}
          <div className="px-4 pb-4">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* 조회수, 좋아요, 댓글 수 */}
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Eye size={18} />
                <span className="font-semibold">{post.views_count || 0}</span>
              </div>
              <button
                onClick={toggleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  liked
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                <span className="font-semibold">{likesCount}</span>
              </button>
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle size={18} />
                <span className="font-semibold">{post.comments_count || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <MessageCircle size={20} />
              댓글 {comments.length}개
            </h2>
          </div>

          {/* 댓글 목록 */}
          <div className="divide-y divide-gray-100">
            {comments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>첫 번째 댓글을 작성해보세요!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/user/${comment.user_id}`)}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B3D966] to-[#9DC183] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <button
                          onClick={() => navigate(`/user/${comment.user_id}`)}
                          className="font-semibold text-sm text-gray-800 hover:opacity-80 transition-opacity"
                        >
                          {comment.profiles?.username || '익명'}
                        </button>
                        {user && user.id === comment.user_id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mb-1 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 댓글 작성 */}
          {user && (
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <input
    type="text"
    value={commentText}
    onChange={handleCommentChange}
    placeholder="댓글을 입력하세요..."
    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${
      commentError 
        ? 'border-red-300 focus:border-red-500' 
        : 'border-gray-200 focus:border-[#B3D966]'
    }`}
    disabled={submittingComment}
    maxLength={500}
  />
  {commentError && (
    <div className="flex items-center gap-1 mt-1">
      <AlertCircle size={12} className="text-red-500" />
      <p className="text-xs text-red-500">{commentError}</p>
    </div>
  )}
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#B3D966] to-[#9DC183] p-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-xl font-black text-white">게시글 수정</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  제목
                </label>
                <input
  type="text"
  value={editTitle}
  onChange={handleEditTitleChange}
  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${
    editTitleError 
      ? 'border-red-300 focus:border-red-500' 
      : 'border-gray-200 focus:border-[#B3D966]'
  }`}
  maxLength={100}
/>
{editTitleError && (
  <div className="flex items-center gap-1 mt-1">
    <AlertCircle size={12} className="text-red-500" />
    <p className="text-xs text-red-500">{editTitleError}</p>
  </div>
)}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  내용
                </label>
              <textarea
  value={editContent}
  onChange={handleEditContentChange}
  rows={8}
  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none resize-none ${
    editContentError 
      ? 'border-red-300 focus:border-red-500' 
      : 'border-gray-200 focus:border-[#B3D966]'
  }`}
  maxLength={2000}
/>
{editContentError && (
  <div className="flex items-center gap-1 mt-1">
    <AlertCircle size={12} className="text-red-500" />
    <p className="text-xs text-red-500">{editContentError}</p>
  </div>
)}
              </div>

              <button
  onClick={handleEditPost}
  disabled={editTitleError || editContentError}
  className="w-full bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
>
                수정 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}