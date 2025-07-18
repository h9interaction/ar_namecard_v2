import { useState, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture } from 'three'
import { extractAllFrames, type ExtractedFrame } from '../utils/spriteExtractor'

interface ThreeJSAnimatedSpriteProps {
  spriteImage: string;
  position: [number, number, number];
  scale: [number, number, number];
  animationSpeed?: number; // ms per frame
}

const ThreeJSAnimatedSprite = ({
  spriteImage,
  position,
  scale,
  animationSpeed = 250
}: ThreeJSAnimatedSpriteProps) => {
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTexture, setCurrentTexture] = useState<CanvasTexture | null>(null);
  const lastFrameTimeRef = useRef(0);

  // 스프라이트 프레임 추출
  useEffect(() => {
    let isMounted = true;

    const loadFrames = async () => {
      try {
        setIsLoading(true);
        const extractedFrames = await extractAllFrames(`/src/assets/test_images/sprites/${spriteImage}`);

        if (isMounted && extractedFrames.length > 0) {
          setFrames(extractedFrames);

          // 첫 번째 프레임 텍스처 생성
          const firstTexture = new CanvasTexture(extractedFrames[0].canvas);
          firstTexture.needsUpdate = true;
          setCurrentTexture(firstTexture);

          setIsLoading(false);
          console.log(`✅ Three.js ${spriteImage}: ${extractedFrames.length} frames extracted`);
        } else if (isMounted) {
          console.warn(`⚠️ No frames extracted for ${spriteImage}`);
          setIsLoading(false);
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

  // 프레임 변경 시 텍스처 업데이트
  useEffect(() => {
    if (frames.length > 0 && currentFrameIndex < frames.length) {
      const newTexture = new CanvasTexture(frames[currentFrameIndex].canvas);
      newTexture.needsUpdate = true;

      // 이전 텍스처 정리
      if (currentTexture) {
        currentTexture.dispose();
      }

      setCurrentTexture(newTexture);
    }
  }, [currentFrameIndex, frames]);

  // 프레임 애니메이션
  useFrame((state) => {
    if (frames.length <= 1) return;

    const currentTime = state.clock.getElapsedTime() * 1000;

    if (currentTime - lastFrameTimeRef.current >= animationSpeed) {
      setCurrentFrameIndex(prev => (prev + 1) % frames.length);
      lastFrameTimeRef.current = currentTime;
    }
  });

  // 컴포넌트 언마운트 시 텍스처 정리
  useEffect(() => {
    return () => {
      if (currentTexture) {
        currentTexture.dispose();
      }
    };
  }, [currentTexture]);

  if (isLoading || !currentTexture) {
    return null;
  }

  return (
    <mesh
      position={position}
      scale={scale}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={currentTexture}
        transparent
        alphaTest={0.1}
        side={2}
        toneMapped={false}
        depthTest={false}
      />
    </mesh>
  );
};

export default ThreeJSAnimatedSprite;