import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Heart, Clock, Gavel, Zap } from 'lucide-react'

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bidAmount, setBidAmount] = useState('')

  useEffect(() => {
    fetchPhoto()
  }, [id])

  async function fetchPhoto() {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setPhoto(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl">📸</div>
      </div>
    )
  }

  if (!photo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>사진을 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-sm sticky top-0 z-10 p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-2xl">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg flex-1 truncate">{photo.title}</h1>
        <Heart size={24} className="text-gray-400" />
      </div>

      <div className="aspect-square bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center relative">
        {photo.preview_url ? (
          <img src={photo.preview_url} alt={photo.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-9xl">📸</div>
        )}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-white/30 text-6xl font-bold transform -rotate-45">
            Pho-Ma
          </div>
        </div>
      </div>

      <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-red-700 flex items-center gap-2">
            <Clock size={20} />
            경매 종료까지
          </span>
          <div className="text-xl font-bold text-red-600 font-mono">
            2일 12시간
          </div>
        </div>
      </div>

      <div className="bg-white p-4 m-4 rounded-xl shadow-sm space-y-3">
        <div className="flex justify-between items-center pb-3 border-b">
          <span className="text-gray-600">현재가</span>
          <span className="text-3xl font-bold text-orange-600">
            {photo.current_price?.toLocaleString()}원
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">즉시구매가</span>
          <span className="text-xl font-bold text-green-600">
            {photo.buy_now_price?.toLocaleString()}원
          </span>
        </div>
      </div>

      <div className="bg-white p-4 m-4 rounded-xl shadow-sm">
        <h2 className="font-bold text-lg mb-3">입찰하기</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`최소 ${(photo.current_price + 1000).toLocaleString()}원`}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
            />
            <button
              onClick={() => setBidAmount((photo.current_price + 1000).toString())}
              className="px-4 py-3 bg-gray-100 rounded-lg font-semibold"
            >
              +1천
            </button>
          </div>
          
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-semibold">
              +5천
            </button>
            <button className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-semibold">
              +1만
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t p-4 flex gap-3">
        <button className="flex-1 bg-orange-500 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:bg-orange-600">
          <Gavel size={20} />
          입찰하기
        </button>
        <button className="flex-1 bg-green-500 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:bg-green-600">
          <Zap size={20} />
          즉시구매
        </button>
      </div>
    </div>
  )
}