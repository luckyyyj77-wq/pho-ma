// src/pages/admin/CategoryManagement.jsx - 카테고리 관리
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  GripVertical,
  Eye,
  EyeOff,
  Tag,
  X
} from 'lucide-react'

export default function CategoryManagement() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    color: '#B3D966',
    description: '',
    is_active: true
  })

  useEffect(() => {
    loadCategories()
  }, [])

  // 카테고리 로드
  async function loadCategories() {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }

  // 카테고리 추가
  async function handleAddCategory(e) {
    e.preventDefault()

    const autoSlug =
      categoryFormData.slug ||
      categoryFormData.name.toLowerCase().replace(/\s+/g, '-') ||
      `category-${Date.now()}`

    const { error } = await supabase.from('categories').insert([
      {
        ...categoryFormData,
        slug: autoSlug,
        display_order: categories.length
      }
    ])

    if (error) {
      alert('카테고리 추가 실패: ' + error.message)
    } else {
      alert('✅ 카테고리가 추가되었습니다!')
      setShowAddCategoryModal(false)
      setCategoryFormData({
        name: '',
        slug: '',
        icon: '',
        color: '#B3D966',
        description: '',
        is_active: true
      })
      loadCategories()
    }
  }

  // 카테고리 수정
  async function handleUpdateCategory(id, updates) {
    const { error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)

    if (error) {
      alert('카테고리 수정 실패: ' + error.message)
    } else {
      loadCategories()
      setEditingCategoryId(null)
    }
  }

  // 카테고리 삭제
  async function handleDeleteCategory(id, name) {
    if (name === '전체') {
      alert('⚠️ "전체" 카테고리는 삭제할 수 없습니다.')
      return
    }

    if (
      !confirm(
        `정말 "${name}" 카테고리를 삭제하시겠습니까?\n\n이 카테고리의 모든 사진은 "전체" 카테고리로 이동됩니다.`
      )
    ) {
      return
    }

    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (error) {
      alert('카테고리 삭제 실패: ' + error.message)
    } else {
      alert('✅ 카테고리가 삭제되었습니다.')
      loadCategories()
    }
  }

  // 활성화/비활성화 토글
  async function toggleCategoryActive(id, currentStatus) {
    await handleUpdateCategory(id, { is_active: !currentStatus })
  }

  // 순서 변경
  async function moveCategory(index, direction) {
    const newCategories = [...categories]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newCategories.length) return

    ;[newCategories[index], newCategories[targetIndex]] = [
      newCategories[targetIndex],
      newCategories[index]
    ]

    const updates = newCategories.map((cat, idx) => ({
      id: cat.id,
      display_order: idx
    }))

    for (const update of updates) {
      await supabase
        .from('categories')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
    }

    loadCategories()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#B3D966] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            카테고리 관리
          </h2>
          <p className="text-gray-600">사진 카테고리를 추가하고 관리하세요</p>
        </div>
        <button
          onClick={() => setShowAddCategoryModal(true)}
          className="flex items-center gap-2 bg-[#B3D966] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#9DC183] transition-colors shadow-lg"
        >
          <Plus size={20} />
          카테고리 추가
        </button>
      </div>

      {/* 카테고리 목록 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag size={20} className="text-gray-700" />
          <h3 className="text-lg font-bold text-gray-800">
            카테고리 목록 ({categories.length})
          </h3>
        </div>

        <div className="space-y-3">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="bg-gray-50 rounded-xl p-4 border-2 border-gray-100 hover:border-[#B3D966] transition-colors"
            >
              {editingCategoryId === category.id ? (
                // 편집 모드
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => {
                        const updated = categories.map((c) =>
                          c.id === category.id
                            ? { ...c, name: e.target.value }
                            : c
                        )
                        setCategories(updated)
                      }}
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#B3D966] focus:outline-none"
                      placeholder="카테고리 이름"
                    />
                    <input
                      type="text"
                      value={category.icon}
                      onChange={(e) => {
                        const updated = categories.map((c) =>
                          c.id === category.id
                            ? { ...c, icon: e.target.value }
                            : c
                        )
                        setCategories(updated)
                      }}
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#B3D966] focus:outline-none"
                      placeholder="이모지"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleUpdateCategory(category.id, category)
                      }
                      className="flex-1 bg-[#B3D966] text-white py-2 rounded-lg font-semibold hover:bg-[#9DC183] transition-colors flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditingCategoryId(null)
                        loadCategories()
                      }}
                      className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                // 보기 모드
                <div className="flex items-center gap-3">
                  {/* 드래그 핸들 */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveCategory(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                    >
                      <GripVertical size={16} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => moveCategory(index, 'down')}
                      disabled={index === categories.length - 1}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                    >
                      <GripVertical size={16} className="text-gray-400" />
                    </button>
                  </div>

                  {/* 아이콘 */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    {category.icon || '📁'}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{category.name}</h3>
                    <p className="text-xs text-gray-500">{category.slug}</p>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        toggleCategoryActive(category.id, category.is_active)
                      }
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {category.is_active ? (
                        <Eye size={18} className="text-[#558B2F]" />
                      ) : (
                        <EyeOff size={18} className="text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingCategoryId(category.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} className="text-blue-500" />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteCategory(category.id, category.name)
                      }
                      disabled={category.name === '전체'}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Trash2 size={18} className="text-red-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 카테고리 추가 모달 */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                카테고리 추가
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  카테고리 이름 *
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      name: e.target.value
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#B3D966] focus:outline-none"
                  placeholder="예: 풍경"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  슬러그 (자동 생성)
                </label>
                <input
                  type="text"
                  value={categoryFormData.slug}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      slug: e.target.value
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#B3D966] focus:outline-none"
                  placeholder="landscape (비워두면 자동 생성)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  아이콘 (이모지)
                </label>
                <input
                  type="text"
                  value={categoryFormData.icon}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      icon: e.target.value
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#B3D966] focus:outline-none"
                  placeholder="🏞️"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  색상
                </label>
                <input
                  type="color"
                  value={categoryFormData.color}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      color: e.target.value
                    })
                  }
                  className="w-full h-12 border-2 border-gray-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      description: e.target.value
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#B3D966] focus:outline-none"
                  rows={3}
                  placeholder="카테고리 설명"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#B3D966] text-white py-3 rounded-lg font-bold hover:bg-[#9DC183] transition-colors"
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
