import React from 'react'
import OptimizedAnimatedSprite from './OptimizedAnimatedSprite'
import type { AvatarData } from '../types/avatar'

interface SpriteOverlayProps {
  avatarData: AvatarData | null;
}

const SpriteOverlay: React.FC<SpriteOverlayProps> = ({ avatarData }) => {
  if (!avatarData) return null

  // 스프라이트 위치 매핑 (Three.js 좌표를 CSS % 좌표로 변환)
  const spritePositions = [
    { x: 65, y: 35 },   // 우상
    { x: 25, y: 30 },   // 좌상
    { x: 30, y: 70 },   // 좌하
    { x: 70, y: 65 }    // 우하
  ]

  const spriteScales = [1.0, 1.1, 1.0, 1.0] // 좌상만 약간 크게

  return (
    <div className="sprite-overlay">
      {avatarData.sprites.slice(0, 4).map((sprite, index) => {
        const position = spritePositions[index]
        const scale = spriteScales[index]
        
        if (!position) return null
        
        return (
          <OptimizedAnimatedSprite
            key={sprite.id}
            spriteImage={sprite.image}
            position={position}
            scale={scale}
            animationSpeed={250} // 4fps로 설정
          />
        )
      })}
    </div>
  )
}

export default SpriteOverlay