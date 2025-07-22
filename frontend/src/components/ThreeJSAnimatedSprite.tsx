import { useState, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture } from 'three'
import { extractAllFrames, type ExtractedFrame } from '../utils/spriteExtractor'

interface ThreeJSAnimatedSpriteProps {
  spriteImage: string;
  position: [number, number, number];
  scale: [number, number, number];
  animationSpeed?: number; // ms per frame
  renderOrder?: number;
  onLoadComplete?: () => void;
}

const ThreeJSAnimatedSprite = ({
  spriteImage,
  position,
  scale,
  animationSpeed = 250,
  renderOrder = 1,
  onLoadComplete
}: ThreeJSAnimatedSpriteProps) => {
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTexture, setCurrentTexture] = useState<CanvasTexture | null>(null);
  const lastFrameTimeRef = useRef(0);

  // 스프라이트 프레임 추출
  useEffect(() => {
    let isMounted = true;
    console.log(`[ThreeJSAnimatedSprite] 🚀 로딩 시작: ${spriteImage}`);

    const loadFrames = async () => {
      try {
        setIsLoading(true);
        console.log(`[ThreeJSAnimatedSprite] 📥 프레임 추출 시작: ${spriteImage}`);
        // spriteImage가 이미 완전한 백엔드 URL이므로 직접 사용
        const extractedFrames = await extractAllFrames(spriteImage);
        console.log(`[ThreeJSAnimatedSprite] 📊 프레임 추출 완료: ${spriteImage}, 프레임 수: ${extractedFrames.length}`);

        if (isMounted && extractedFrames.length > 0) {
          setFrames(extractedFrames);

          // 첫 번째 프레임 텍스처 생성
          const firstTexture = new CanvasTexture(extractedFrames[0].canvas);
          firstTexture.needsUpdate = true;
          setCurrentTexture(firstTexture);

          setIsLoading(false);
          console.log(`[ThreeJSAnimatedSprite] ✅ 로딩 성공: ${spriteImage}`);
          onLoadComplete?.(); // 로딩 완료 콜백 호출
        } else if (isMounted) {
          console.warn(`⚠️ No frames extracted for ${spriteImage}`);
          setIsLoading(false);
          console.log(`[ThreeJSAnimatedSprite] 🔄 빈 프레임으로 완료: ${spriteImage}`);
          onLoadComplete?.(); // 프레임이 없어도 로딩 완료로 처리
        }
      } catch (error) {
        console.error(`❌ Failed to extract frames for ${spriteImage}:`, error);
        if (isMounted) {
          setIsLoading(false);
          console.log(`[ThreeJSAnimatedSprite] 💥 실패로 완료: ${spriteImage}`);
          onLoadComplete?.(); // 실패해도 로딩 완료로 처리
        }
      }
    };

    loadFrames();

    return () => {
      isMounted = false;
      console.log(`[ThreeJSAnimatedSprite] 🔚 언마운트: ${spriteImage}`);
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
      renderOrder={renderOrder}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={currentTexture}
        transparent
        alphaTest={0.1}
        side={0}
        toneMapped={false}
        depthTest={true}
      />
    </mesh>
  );
};

export default ThreeJSAnimatedSprite;