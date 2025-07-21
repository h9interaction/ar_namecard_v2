import React, { useState, useEffect, useRef } from 'react'
import { extractAllFrames, type ExtractedFrame } from '../utils/spriteExtractor'

interface OptimizedAnimatedSpriteProps {
  spriteImage: string;
  position: { x: number; y: number };
  scale: number;
  animationSpeed?: number; // ms per frame, default 200
}

const OptimizedAnimatedSprite: React.FC<OptimizedAnimatedSpriteProps> = ({ 
  spriteImage, 
  position, 
  scale,
  animationSpeed = 200
}) => {
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const animationRef = useRef<number>();

  // 스프라이트 프레임 추출
  useEffect(() => {
    let isMounted = true;
    
    const loadFrames = async () => {
      try {
        setIsLoading(true);
        const extractedFrames = await extractAllFrames(`/src/assets/test_images/sprites/${spriteImage}`);
        
        if (isMounted) {
          setFrames(extractedFrames);
          setIsLoading(false);
          console.log(`✅ ${spriteImage}: ${extractedFrames.length} frames extracted`);
        }
      } catch (error) {
        console.error(`❌ Failed to extract frames for ${spriteImage}:`, error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFrames();

    return () => {
      isMounted = false;
    };
  }, [spriteImage]);

  // 프레임 애니메이션
  useEffect(() => {
    if (frames.length === 0) return;

    const animate = () => {
      setCurrentFrameIndex(prev => (prev + 1) % frames.length);
      animationRef.current = setTimeout(animate, animationSpeed);
    };

    // 첫 애니메이션 시작
    animationRef.current = setTimeout(animate, animationSpeed);

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [frames, animationSpeed]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${position.x}%`,
          top: `${position.y}%`,
          width: '64px',
          height: '64px',
          background: 'rgba(200, 200, 200, 0.3)',
          borderRadius: '4px',
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      />
    );
  }

  if (frames.length === 0) {
    return null;
  }

  const currentFrame = frames[currentFrameIndex];

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <img
        src={currentFrame.dataUrl}
        alt={`${spriteImage} frame ${currentFrameIndex}`}
        style={{
          width: '64px',
          height: '64px',
          display: 'block',
        }}
      />
    </div>
  );
};

export default OptimizedAnimatedSprite;