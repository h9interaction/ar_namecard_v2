import React from 'react'
import './CSSAnimatedSprite.css'

interface CSSAnimatedSpriteProps {
  spriteImage: string;
  position: { x: number; y: number };
  scale: number;
}

const CSSAnimatedSprite: React.FC<CSSAnimatedSpriteProps> = ({ 
  spriteImage, 
  position, 
  scale 
}) => {
  return (
    <div
      className="css-animated-sprite smooth"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `scale(${scale})`,
        backgroundImage: `url(/src/assets/test_images/sprites/${spriteImage})`,
      }}
    />
  )
}

export default CSSAnimatedSprite