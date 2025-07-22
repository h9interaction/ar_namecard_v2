import { useEffect, useState, useRef } from 'react'
import type { UserAvatarData } from '../types/avatar'
import ThreeJSAnimatedSprite from './ThreeJSAnimatedSprite'
import { getFullImageUrl } from '../utils/avatarDataUtils'
import { composeBackendFaceTexture, type ComposedFaceTexture } from '../utils/backendFaceComposer'

interface AvatarElementsProps {
  avatarData: UserAvatarData;
  onLoadingComplete?: () => void;
}

const AvatarElements = ({ avatarData, onLoadingComplete }: AvatarElementsProps) => {
  const [composedFace, setComposedFace] = useState<ComposedFaceTexture | null>(null);
  const [loadedSprites, setLoadedSprites] = useState<Set<string>>(new Set());
  const [loadingState, setLoadingState] = useState<'initializing' | 'loading' | 'completed'>('initializing');
  const [currentAvatarId, setCurrentAvatarId] = useState<string | null>(null);
  const currentAvatarIdRef = useRef<string | null>(null);
  
  // 예상되는 스프라이트 수 계산
  const expectedSprites = [avatarData.item1, avatarData.item2, avatarData.item3].filter(Boolean).length;
  const expectedSpriteIds = [avatarData.item1?.id, avatarData.item2?.id, avatarData.item3?.id].filter(Boolean) as string[];

  // 스프라이트 로딩 완료 콜백
  const handleSpriteLoaded = (itemId: string) => {
    console.log(`[AvatarElements] 🖼️  스프라이트 로딩 완료: ${itemId} (현재 아바타: ${currentAvatarIdRef.current})`);
    
    // 현재 아바타의 스프라이트가 아니면 무시
    if (!expectedSpriteIds.includes(itemId)) {
      console.log(`[AvatarElements] ⚠️  현재 아바타에 해당하지 않는 스프라이트 무시: ${itemId}`);
      console.log(`[AvatarElements] 현재 기대하는 스프라이트들:`, expectedSpriteIds);
      return;
    }
    
    setLoadedSprites(prev => {
      // 현재 아바타의 스프라이트만 필터링하여 새로운 Set 생성
      const currentAvatarSprites = Array.from(prev).filter(id => expectedSpriteIds.includes(id));
      const newSet = new Set(currentAvatarSprites);
      
      if (newSet.has(itemId)) {
        console.log(`[AvatarElements] ⚠️  현재 아바타의 중복 스프라이트 로딩 무시: ${itemId}`);
        return newSet; // 현재 아바타 스프라이트만 포함된 Set 반환
      }
      
      newSet.add(itemId);
      console.log(`[AvatarElements] 📊 로드된 스프라이트: ${newSet.size}/${expectedSprites}`, Array.from(newSet));
      return newSet;
    });
  };

  // 새 아바타 로딩 초기화
  useEffect(() => {
    const avatarId = avatarData.id;
    
    // 아바타 ID가 바뀐었을 때만 새로 시작
    if (currentAvatarId === avatarId) {
      return;
    }
    
    console.log(`[AvatarElements] 🔄 새 아바타 로딩 시작: ${avatarId}`);
    console.log(`[AvatarElements] 예상 스프라이트: ${expectedSprites}개, IDs:`, expectedSpriteIds);
    
    // 상태 리셋
    setCurrentAvatarId(avatarId);
    currentAvatarIdRef.current = avatarId;
    setLoadingState('initializing');
    setComposedFace(null);
    setLoadedSprites(new Set());
    
    console.log(`[AvatarElements] 🎨 얼굴 합성 시작: ${avatarId}`);
    
    // 즉시 loading 상태로 변경 (setTimeout 제거)
    setLoadingState('loading');
    console.log(`[AvatarElements] 🔄 상태를 'loading'으로 변경`);
    
    // 스프라이트별 개별 타임아웃 (1.5초)  
    expectedSpriteIds.forEach((spriteId, index) => {
      setTimeout(() => {
        if (currentAvatarIdRef.current === avatarId && !loadedSprites.has(spriteId)) {
          console.log(`[AvatarElements] ⏰ 스프라이트 로딩 타임아웃: ${spriteId}`);
          handleSpriteLoaded(spriteId); // 강제로 로딩 완료 처리
        }
      }, 1500 + (index * 200)); // 각 스프라이트마다 200ms씩 지연
    });
    
    // 무한 로딩 방지를 위한 타임아웃 (2.5초)
    const timeoutId = setTimeout(() => {
      if (currentAvatarIdRef.current === avatarId) {
        console.log(`[AvatarElements] ⏰ 로딩 타임아웃 - 강제 완료: ${avatarId}`);
        console.log(`[AvatarElements] 타임아웃 시점 로딩 상태:`, {
          얼굴: !!composedFace,
          스프라이트수: loadedSprites.size,
          예상수: expectedSprites
        });
        setLoadingState('completed');
      }
    }, 2500);
    
    // 비동기 리소스 로딩 시작
    const startLoading = async () => {
      try {
        // 얼굴 합성
        const composed = await composeBackendFaceTexture(avatarData.avatarSelections);
        
        // 현재 아바타 ID와 다르면 중단 (React Strict Mode 대응)
        if (currentAvatarIdRef.current !== avatarId) {
          console.log(`[AvatarElements] ❌ 다른 아바타로 변경됨, 중단: ${avatarId} -> ${currentAvatarIdRef.current}`);
          return;
        }
        
        setComposedFace(composed);
        console.log(`[AvatarElements] ✅ 얼굴 합성 완료: ${avatarId}`);
        
        // 스프라이트가 없으면 즉시 완료
        if (expectedSprites === 0) {
          setLoadingState('completed');
          console.log(`[AvatarElements] 📋 스프라이트 없음 - 즉시 완료`);
        }
        
      } catch (error) {
        console.error(`❌ 얼굴 합성 실패: ${avatarId}`, error);
        // 실패해도 완료 처리
        if (currentAvatarIdRef.current === avatarId) {
          setLoadingState('completed');
        }
      }
    };
    
    startLoading();
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [avatarData.id, expectedSprites, expectedSpriteIds.join(','), currentAvatarId]);

  // 로딩 완료 체크
  useEffect(() => {
    console.log(`[AvatarElements] 🔍 로딩 완료 체크 useEffect 실행:`);
    console.log(`  - loadingState: ${loadingState}`);
    console.log(`  - currentAvatarId: ${currentAvatarId}`);
    
    // 로딩 상태가 아니면 체크 안함
    if (loadingState !== 'loading') {
      console.log(`[AvatarElements] ⏭️ 로딩 상태가 아님, 체크 건너뜀 (${loadingState})`);
      return;
    }
    
    // 스프라이트 로딩 완료 체크
    const hasAllSprites = expectedSpriteIds.every(id => loadedSprites.has(id));
    
    console.log(`[AvatarElements] 로딩 완료 체크:`);
    console.log(`  - 아바타 ID: ${currentAvatarId}`);
    console.log(`  - 로딩 상태: ${loadingState}`);
    console.log(`  - 얼굴: ${composedFace ? '✅' : '❌'}`);
    console.log(`  - 예상 스프라이트 IDs:`, expectedSpriteIds);
    console.log(`  - 로드된 스프라이트 IDs:`, Array.from(loadedSprites));
    console.log(`  - 모든 스프라이트 준비: ${hasAllSprites ? '✅' : '❌'}`);
    
    // 얼굴 또는 스프라이트가 준비되면 즉시 체크 시작 (더 빠른 반응)
    if (composedFace && hasAllSprites) {
      console.log(`[AvatarElements] 🎉 모든 리소스 로딩 완료!`);
      setLoadingState('completed');
      onLoadingComplete?.();
    } else if (composedFace || hasAllSprites) {
      // 일부 리소스가 준비되면 더 자주 체크하기 위해 작은 딜레이 추가
      setTimeout(() => {
        if (loadingState === 'loading') {
          // 재체크 트리거
          setLoadedSprites(prev => new Set(prev));
        }
      }, 50);
    }
  }, [loadingState, composedFace, loadedSprites, expectedSpriteIds, onLoadingComplete, currentAvatarId]);

  
  // 스티커 아이템들을 고정 위치에 매핑 (role은 현재 없으므로 제외)
  const stickerItems = [
    { item: avatarData.item1, positionIndex: 1 }, // 좌상
    { item: avatarData.item2, positionIndex: 2 }, // 좌하  
    { item: avatarData.item3, positionIndex: 3 }, // 우하
  ].filter(entry => entry.item); // item이 있는 것만 필터링

  // 스프라이트 기본 포지션 (공통 룰)
  const spritePositions = [
    { position: [0.35, 0.3, 0.1] as [number, number, number], scale: 1.0 },    // 우상 - 버블
    { position: [-0.4, 0.4, -0.2] as [number, number, number], scale: 1.1 },   // 좌상 (스케일 1.1)
    { position: [-0.3, -0.4, 0.1] as [number, number, number], scale: 1.0 },   // 좌하
    { position: [0.4, -0.3, -0.2] as [number, number, number], scale: 1.0 }    // 우하
  ];

  return (
    <group
      position={[0, 0.5, 0.6]}
      rotation={[Math.PI * 0.2, 0, 0]}
    >
      {/* 합성된 얼굴 텍스처 렌더링 */}
      {composedFace && (
        <mesh position={[0, 0, 0]} renderOrder={0}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={composedFace.texture}
            transparent
            alphaTest={0.1}
            side={0}
            toneMapped={false}
            depthTest={true}
          />
        </mesh>
      )}

      {/* 스티커 렌더링 (item1,2,3을 고정 위치에) */}
      {stickerItems.map(({ item, positionIndex }) => {
        if (!item?.imageUrl) return null;
        
        const spriteConfig = spritePositions[positionIndex];
        if (!spriteConfig) return null;

        return (
          <ThreeJSAnimatedSprite
            key={`${currentAvatarId}-sticker-${item.id}-${positionIndex}`}
            spriteImage={getFullImageUrl(item.imageUrl)}
            position={spriteConfig.position}
            scale={[spriteConfig.scale, spriteConfig.scale, 1]}
            animationSpeed={16.67}
            renderOrder={Math.round((spriteConfig.position[2] + 1) * 10)}
            onLoadComplete={() => handleSpriteLoaded(item.id)}
          />
        );
      })}
    </group>
  )
}

export default AvatarElements