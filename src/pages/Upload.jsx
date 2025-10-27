// ============================================
// 📦 라이브러리 및 컴포넌트 import
// ============================================
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ArrowLeft, Upload as UploadIcon, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { generateImageHash } from '../utils/imageHash'
import { performImageModeration } from '../utils/imageModeration'  // ← AI 검증 추가!




// ============================================
// 🎯 메인 컴포넌트
// ============================================
export default function Upload() {

  // ------------------------------------------
  // 🔐 로그인 상태 체크
  // ------------------------------------------
  const { user, loading: authLoading } = useAuth()




  // ------------------------------------------
  // 📝 입력 폼 state 관리
  // ------------------------------------------
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [startPrice, setStartPrice] = useState('')
  const [buyNowPrice, setBuyNowPrice] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [moderating, setModerating] = useState(false)  // AI 검증 중
  const [moderationMessage, setModerationMessage] = useState('')  // 검증 메시지
  const [agreedToTerms, setAgreedToTerms] = useState(false)




  // ------------------------------------------
  // 🚪 로그인 체크: 로그인 안 되어있으면 로그인 페이지로 이동
  // ------------------------------------------
  useEffect(() => {
    if (!authLoading && !user) {
      alert('로그인이 필요해요!')
      window.location.href = '/auth'
    }
  }, [user, authLoading])




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




  // ------------------------------------------
  // 🖼️ 이미지 파일 선택 처리
  // ------------------------------------------
  function handleImageChange(e) {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }




  // ------------------------------------------
  // 📤 사진 업로드 및 DB 저장
  // ------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault()
    setUploading(true)

    let hash = null
    let fileName = null

    try {
      // ------------------------------------------
      // 🔍 중복 검사
      // ------------------------------------------
      if (imageFile) {
        // 1. 이미지 해시 생성
        hash = await generateImageHash(imageFile)
        
        if (!hash) {
          throw new Error('이미지 처리 중 오류가 발생했습니다.')
        }

        // 2. 기존 사진과 비교
        const { data: existingPhotos, error: checkError } = await supabase
          .from('photos')
          .select('id, title, user_id')
          .eq('image_hash', hash)

        if (checkError) throw checkError

        // 3. 중복 발견!
        if (existingPhotos && existingPhotos.length > 0) {
          const existing = existingPhotos[0]
          
          // 내가 올린 거면
          if (existing.user_id === user.id) {
            alert('⚠️ 이미 등록한 사진입니다!\n\n같은 사진을 중복으로 등록할 수 없어요.')
          } else {
            // 다른 사람이 올린 거면
            alert('🚫 이미 등록된 사진입니다!\n\n다른 사용자가 먼저 등록한 사진이에요.\n재판매는 금지되어 있습니다.')
          }
          
          setUploading(false)
          return
        }

        console.log('✅ 중복 검사 통과! 해시:', hash)
      }


      // ------------------------------------------
      // 📤 Storage 업로드
      // ------------------------------------------
      let imageUrl = null

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        fileName = `${Math.random()}.${fileExt}`
        const { data, error } = await supabase.storage
          .from('photos')
          .upload(fileName, imageFile)

        if (error) throw error
        
        // 전체 공개 URL 생성
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName)
        
        imageUrl = publicUrl
      }


      // ------------------------------------------
      // 🤖 AI 콘텐츠 검증 (새로 추가!)
      // ------------------------------------------
      setModerating(true)
      setModerationMessage('🔍 이미지 검증 중... 잠시만 기다려주세요')
      
      const moderationResult = await performImageModeration(imageUrl)

      // 디버깅 추가!
console.log('========== AI 검증 결과 ==========')
console.log('Decision:', moderationResult.decision)
console.log('Safety Score:', moderationResult.safetyScore)
console.log('Issues:', moderationResult.issues)
console.log('Reason:', moderationResult.reason)
console.log('==================================')

console.log('AI 검증 결과:', moderationResult)

      console.log('AI 검증 결과:', moderationResult)
      setModerating(false)
      setModerationMessage('')

      // 자동 거부 처리
      if (moderationResult.decision === 'rejected') {
        // 업로드한 파일 삭제
        if (fileName) {
          await supabase.storage.from('photos').remove([fileName])
        }

        alert(moderationResult.reason)
        
        setUploading(false)
        return
      }


      // ------------------------------------------
      // 💾 DB에 사진 정보 저장
      // ------------------------------------------
      const { data: photo, error } = await supabase.from('photos').insert({
        title,
        category,
        description,
        current_price: parseInt(startPrice),
        buy_now_price: parseInt(buyNowPrice),
        preview_url: imageUrl,
        image_hash: hash,
        status: 'active',
        user_id: user.id,
        
        // AI 검증 정보 추가
        moderation_status: moderationResult.decision,
        ai_score: moderationResult.aiResult,
        safety_score: moderationResult.safetyScore
      })
      .select()
      .single()

      if (error) throw error


      // ------------------------------------------
      // 📋 검수 대기열 처리
      // ------------------------------------------
      if (moderationResult.decision === 'reviewing') {
        // 관리자 검수 대기열에 추가
        await supabase.from('moderation_queue').insert({
          photo_id: photo.id,
          user_id: user.id,
          ai_service: 'google_vision',
          ai_results: moderationResult.aiResult,
          safety_score: moderationResult.safetyScore,
          detected_issues: moderationResult.issues || [],
          severity: moderationResult.severity || 'medium',
          status: 'pending',
          auto_decision: false
        })
        
        alert(
          '⏰ 사진이 등록되었습니다!\n\n' +
          '관리자 검토 후 게시됩니다.\n' +
          '(일반적으로 24시간 이내 처리)'
        )
      } else {
        // 자동 승인
        alert('✅ 사진이 성공적으로 등록되었습니다!')
      }

      window.location.href = '/'

    } catch (error) {
      console.error('Upload error:', error)
      
      // 에러 발생 시 업로드한 파일 삭제
      if (fileName) {
        try {
          await supabase.storage.from('photos').remove([fileName])
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError)
        }
      }
      
      alert('업로드 실패: ' + error.message)
    } finally {
      setUploading(false)
    }
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
          className="flex items-center gap-2 mb-2"
        >
          <ArrowLeft size={20} />
          <span>뒤로</span>
        </button>
        <h1 className="text-xl font-bold">사진 업로드</h1>
      </div>




      {/* ------------------------------------------
          📋 업로드 폼
      ------------------------------------------ */}
      <form onSubmit={handleSubmit} className="p-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">


          {/* 이미지 업로드 영역 */}
          <div>
            <label className="block text-sm font-semibold mb-2">사진</label>
            <div className="relative">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="미리보기" className="w-full h-64 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setPreview(null)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <UploadIcon size={48} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">클릭해서 사진 선택</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    required
                  />
                </label>
              )}
            </div>
            {/* AI 검증 안내 */}
            <p className="text-xs text-gray-500 mt-2">
              🔒 모든 이미지는 AI로 자동 검증됩니다
            </p>
          </div>


          {/* 제목 입력 */}
          <div>
            <label className="block text-sm font-semibold mb-2">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 서울 남산타워 일몰"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>


          {/* 카테고리 선택 */}
          <div>
            <label className="block text-sm font-semibold mb-2">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">선택하세요</option>
              <option value="음식">음식</option>
              <option value="풍경">풍경</option>
              <option value="인테리어">인테리어</option>
              <option value="제품">제품</option>
              <option value="라이프">라이프</option>
            </select>
          </div>


          {/* 설명 입력 */}
          <div>
            <label className="block text-sm font-semibold mb-2">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="사진에 대한 설명을 입력하세요"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows="3"
            />
          </div>


          {/* 가격 설정 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">시작가</label>
              <input
                type="number"
                value={startPrice}
                onChange={(e) => setStartPrice(e.target.value)}
                placeholder="500"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">500원~10,000원</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">즉시구매가</label>
              <input
                type="number"
                value={buyNowPrice}
                onChange={(e) => setBuyNowPrice(e.target.value)}
                placeholder="2000"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>


          {/* 이용약관 동의 */}
          <div className="border-t pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                required
              />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-2">판매자 약관에 동의합니다</p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• 본인이 저작권을 보유한 사진임을 확인합니다</li>
                  <li>• 구매자는 <span className="font-semibold">재판매를 제외한</span> 모든 용도로 사용 가능합니다</li>
                  <li>• 구매자의 2차 창작, 블로그/SNS 게시, 광고, 인쇄물 제작 등을 허용합니다</li>
                  <li>• 중복 판매 시 계정 정지 및 법적 책임을 집니다</li>
                  <li>• 판매 후에도 개인적 용도로 사진을 보관할 수 있습니다</li>
                  <li>• <span className="font-semibold text-orange-600">부적절한 이미지는 자동으로 거부됩니다</span></li>
                </ul>
              </div>
            </label>
          </div>


          {/* AI 검증 중 메시지 */}
          {moderating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-700 font-medium">{moderationMessage}</p>
            </div>
          )}


          {/* 등록 버튼 */}
          <button
            type="submit"
            disabled={uploading || moderating || !agreedToTerms}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 transition-colors"
          >
            {moderating ? '검증 중...' : uploading ? '업로드 중...' : '등록하기'}
          </button>


        </div>
      </form>


    </div>
  )
}