import { useEffect, useState } from 'react'
import type { AvatarData } from '../types/avatar'
import ThreeJSAnimatedSprite from './ThreeJSAnimatedSprite'
import { composeFaceTexture, type ComposedFaceTexture } from '../utils/faceComposer'

interface AvatarElementsProps {
  avatarData: AvatarData;
}

const AvatarElements = ({ avatarData }: AvatarElementsProps) => {
  const [composedFace, setComposedFace] = useState<ComposedFaceTexture | null>(null);

  // 얼굴 요소들을 합성하여 하나의 텍스처 생성
  useEffect(() => {
    let isMounted = true;

    const createComposedFace = async () => {
      try {
        const composed = await composeFaceTexture(avatarData.face);

        if (isMounted) {
          setComposedFace(composed);
        }
      } catch (error) {
        console.error('❌ 얼굴 합성 실패:', error);
      }
    };

    createComposedFace();

    return () => {
      isMounted = false;
    };
  }, [avatarData.face]);

  // 스프라이트 기본 포지션 (공통 룰)
  const spritePositions = [
    { position: [0.35, 0.3, 0.1] as [number, number, number], scale: 1.0 },    // 우상 - 버블
    { position: [-0.4, 0.4, -0.2] as [number, number, number], scale: 1.1 },   // 좌상 (스케일 1.1)
    { position: [-0.3, -0.4, 0.1] as [number, number, number], scale: 1.0 },   // 좌하
    { position: [0.4, -0.3, -0.2] as [number, number, number], scale: 1.0 }    // 우하
  ];

  return (
    <group
      position={[0, 0.5, 0.5]}
      rotation={[Math.PI * 0.2, 0, 0]}
    >
      {/* 합성된 얼굴 텍스처 렌더링 */}
      {composedFace && (
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={composedFace.texture}
            transparent
            alphaTest={0.1}
            side={2}
            toneMapped={false}
            depthTest={false}
          />
        </mesh>
      )}

      {/* 최적화된 Three.js 스프라이트들 */}
      {avatarData.sprites.slice(0, 4).map((sprite, index) => {
        const spriteConfig = spritePositions[index];
        if (!spriteConfig) {
          return null;
        }

        return (
          <ThreeJSAnimatedSprite
            key={sprite.id}
            spriteImage={sprite.image}
            position={spriteConfig.position}
            scale={[spriteConfig.scale, spriteConfig.scale, 1]}
            animationSpeed={16.67} // 60fps (1000ms / 60 = 16.67ms)
          />
        );
      })}
    </group>
  )
}

export default AvatarElements