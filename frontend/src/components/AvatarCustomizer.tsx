import { useState } from 'react'
import './AvatarCustomizer.css'
import AvatarPreview from './AvatarPreview'
import type { AvatarData } from '../types/avatar'

interface AvatarCustomizerProps {
  currentAvatar: AvatarData | null;
  onAvatarChange: (newAvatar: AvatarData) => void;
  onBack?: () => void;
}

// 카테고리 데이터
const categories = [
  { id: 'face', name: '얼굴', icon: '👤' },
  { id: 'hair', name: '헤어', icon: '💇' },
  { id: 'eyebrows', name: '눈썹', icon: '👀' },
  { id: 'eyes', name: '눈', icon: '👁' },
  { id: 'nose', name: '코', icon: '👃' },
  { id: 'mouth', name: '입', icon: '👄' },
  { id: 'accessories', name: '악세사리', icon: '👓' },
]

// 실제 이미지 리소스 경로
const getImagePath = (category: string, filename: string) => {
  return new URL(`../assets/test_images/${category}/${filename}`, import.meta.url).href
}

const getSpriteImagePath = (filename: string) => {
  return new URL(`../assets/test_images/sprites/${filename}`, import.meta.url).href
}

// 카테고리별 옵션 데이터 - 실제 파일 기준
const categoryOptions = {
  face: [
    // shape 폴더의 얼굴형들 (1_1 ~ 7_3)
    ...Array.from({ length: 7 }, (_, i) => 
      Array.from({ length: 3 }, (_, j) => ({
        id: `face-${i + 1}_${j + 1}`,
        name: `얼굴형 ${i + 1}-${j + 1}`,
        thumbnail: getImagePath('face/shape', `${i + 1}_${j + 1}.png`),
      }))
    ).flat(),
  ],
  hair: Array.from({ length: 32 }, (_, i) => ({
    id: `hair-${i + 1}`,
    name: `헤어 ${i + 1}`,
    thumbnail: getImagePath('face/hair', `${i + 1}.png`),
  })),
  eyebrows: Array.from({ length: 17 }, (_, i) => ({
    id: `eyebrows-${i + 1}`,
    name: `눈썹 ${i + 1}`,
    thumbnail: getImagePath('face/brows', `${i + 1}.png`),
  })),
  eyes: Array.from({ length: 18 }, (_, i) => ({
    id: `eyes-${i + 1}`,
    name: `눈 ${i + 1}`,
    thumbnail: getImagePath('face/eyes', `${i + 1}.png`),
  })),
  nose: Array.from({ length: 6 }, (_, i) => ({
    id: `nose-${i + 1}`,
    name: `코 ${i + 1}`,
    thumbnail: getImagePath('face/nose', `${i + 1}.png`),
  })),
  mouth: Array.from({ length: 24 }, (_, i) => ({
    id: `mouth-${i + 1}`,
    name: `입 ${i + 1}`,
    thumbnail: getImagePath('face/mouth', `${i + 1}.png`),
  })),
  accessories: Array.from({ length: 6 }, (_, i) => ({
    id: `accessories-${i + 1}`,
    name: `안경 ${i + 1}`,
    thumbnail: getImagePath('face/glasses', `${i + 1}.png`),
  })),
  stickers: [
    'backpack.png', 'baseball.png', 'beer.png', 'book.png', 'camera.png', 'camera_1.png',
    'cat_1.png', 'cat_3.png', 'cocktail.png', 'coffee.png', 'coke.png', 'cycle.png',
    'dog_1.png', 'dumbel.png', 'fish_shaped_bun.png', 'flower_pot.png', 'frog.png',
    'golf.png', 'grass.png', 'guitar.png', 'guitar_blue.png', 'ice_coffee.png',
    'mask_blue.png', 'mask_yellow.png', 'mountain.png', 'pen_tool.png', 'soju.png',
    'square.png', 'suit_case_blue.png', 'wine.png'
  ].map((filename, i) => ({
    id: `sticker-${i + 1}`,
    name: filename.replace('.png', ''),
    thumbnail: getSpriteImagePath(filename),
  })),
}

const AvatarCustomizer = ({ currentAvatar, onAvatarChange, onBack }: AvatarCustomizerProps) => {
  const [selectedCategory, setSelectedCategory] = useState('face')
  const [selectedTag, setSelectedTag] = useState('character') // 'character' 또는 'sticker'
  const [selectedOptions, setSelectedOptions] = useState({
    face: 'face-1',
    hair: 'hair-1',
    eyebrows: 'eyebrows-1',
    eyes: 'eyes-1',
    nose: 'nose-1',
    mouth: 'mouth-1',
    accessories: '',
    stickers: '',
  })

  const handleOptionSelect = (categoryId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [categoryId]: optionId
    }))
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    }
  }

  // 현재 선택된 태그와 카테고리에 따른 옵션 가져오기
  const getCurrentOptions = () => {
    if (selectedTag === 'sticker') {
      return categoryOptions.stickers
    }
    return categoryOptions[selectedCategory as keyof typeof categoryOptions] || []
  }

  const currentOptions = getCurrentOptions()

  return (
    <div className="avatar-customizer">
      {/* 전체 컨테이너 */}
      <div className="customizer-container">
        
        {/* 좌측 사이드바 */}
        <div className="sidebar">
          {/* h,cARd 로고 */}
          <div className="logo">h,cARd</div>
          
          {/* 캐릭터/스티커 토글 */}
          <div className="tag-toggle">
            <button 
              className={`tag-btn ${selectedTag === 'character' ? 'active' : ''}`}
              onClick={() => setSelectedTag('character')}
            >
              캐릭터
            </button>
            <button 
              className={`tag-btn ${selectedTag === 'sticker' ? 'active' : ''}`}
              onClick={() => setSelectedTag('sticker')}
            >
              스티커
            </button>
          </div>
          
          {/* 캐릭터 선택 시에만 카테고리 리스트 표시 */}
          {selectedTag === 'character' && (
            <div className="category-list">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="main-content">
          
          {/* 상단 헤더 텍스트 */}
          <div className="content-header">
            <h2>
              {selectedTag === 'character' 
                ? '원하는 요소를 선택해 캐릭터를 완성해보세요!' 
                : '원하는 스티커를 선택해보세요!'
              }
            </h2>
          </div>
          
          {/* 옵션 그리드 (스크롤 가능) */}
          <div className="options-scroll-container">
            <div className="options-grid">
              {currentOptions.map(option => {
                const categoryKey = selectedTag === 'sticker' ? 'stickers' : selectedCategory;
                const isSelected = selectedOptions[categoryKey as keyof typeof selectedOptions] === option.id;
                
                return (
                  <button
                    key={option.id}
                    className={`option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleOptionSelect(categoryKey, option.id)}
                  >
                    <div className="option-thumbnail">
                      <img 
                        src={option.thumbnail} 
                        alt={option.name}
                        onError={(e) => {
                          // 이미지 로드 실패 시 기본 아이콘 표시
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.style.display = 'flex';
                        }}
                      />
                      <div className="fallback-icon" style={{ display: 'none' }}>
                        {selectedTag === 'character' ? '👤' : '🏷️'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 우측 미리보기 영역 */}
        <div className="preview-section">
          {/* 아바타 미리보기 */}
          <div className="avatar-preview-container">
            <AvatarPreview avatarData={currentAvatar} />
          </div>
          
          {/* 색상 팔레트 */}
          <div className="color-palette">
            {['#F5DEB3', '#DEB887', '#D2B48C', '#BC9A6A'].map(color => (
              <button
                key={color}
                className="color-option"
                style={{ backgroundColor: color }}
                onClick={() => {/* TODO: 색상 변경 로직 */}}
              />
            ))}
          </div>

          {/* 액션 버튼들 */}
          <div className="action-buttons">
            <button className="action-btn reset-btn">↻</button>
            <button className="action-btn download-btn">↓</button>
            <button className="action-btn complete-btn">✓</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvatarCustomizer