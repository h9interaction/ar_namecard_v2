import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Group } from 'three'
import { TextureLoader, MeshBasicMaterial, Color } from 'three'
import namecardImage from '../assets/test_images/namecard.png'
import namecardFrontImage from '../assets/test_images/namecard_front.png'
import AvatarElements from './AvatarElements'
import type { AvatarData } from '../types/avatar'

interface RotatingCardProps {
  avatarData: AvatarData | null;
}

const RotatingCard = ({ avatarData }: RotatingCardProps) => {
  const groupRef = useRef<Group>(null!)
  const frontTexture = useLoader(TextureLoader, namecardImage)
  const backTexture = useLoader(TextureLoader, namecardFrontImage)

  // 드래그 상태 관리
  const [isDragging, setIsDragging] = useState(false)

  // 자동 로테이션 범위 정의
  const AUTO_ROTATION_RANGE = {
    x: { center: -Math.PI * 0.2, range: Math.PI / 36 }, // ±5도
    y: { center: 0, range: Math.PI / 6 } // ±30도
  }

  // 부드러운 전환을 위한 lerp 함수
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor
  }

  // 각도 차이를 계산하여 가장 짧은 경로로 회전하도록 하는 함수
  const getShortestAngleDifference = (from: number, to: number) => {
    let diff = to - from

    // 차이가 180도(π)보다 크면 반대 방향으로 회전
    if (diff > Math.PI) {
      diff -= 2 * Math.PI
    } else if (diff < -Math.PI) {
      diff += 2 * Math.PI
    }

    return from + diff
  }

  // 각도 보간 함수
  const lerpAngle = (start: number, end: number, factor: number) => {
    const target = getShortestAngleDifference(start, end)
    return lerp(start, target, factor)
  }

  // 마우스 이벤트 감지
  useEffect(() => {
    const handleMouseDown = () => {
      console.log('마우스 다운 - 드래그 시작')
      setIsDragging(true)
    }

    const handleMouseUp = () => {
      if (isDragging) {
        console.log('마우스 업 - 자동 로테이션 시작')
        setIsDragging(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])



  // BoxGeometry의 면 순서: [+X, -X, +Y, -Y, +Z, -Z]
  // 앞면(+Z), 뒷면(-Z)에 다른 텍스처 적용하되 재질 속성은 동일하게
  const materials = useMemo(() => {
    const materialConfig = {
      toneMapped: false,
      color: new Color(0xe8e8e8), // 조금 더 어둡게
    }

    const frontMaterial = new MeshBasicMaterial({
      map: frontTexture,
      ...materialConfig
    })
    const backMaterial = new MeshBasicMaterial({
      map: backTexture,
      ...materialConfig
    })

    return [
      frontMaterial, // +X (오른쪽)
      frontMaterial, // -X (왼쪽)
      frontMaterial, // +Y (위)
      frontMaterial, // -Y (아래)
      frontMaterial, // +Z (앞면)
      backMaterial   // -Z (뒷면)
    ]
  }, [frontTexture, backTexture])

  // 지오메트리 메모이제이션
  const boxGeometry = useMemo(() => [1.22, 2.13, 0.01] as const, [])

  // 부드러운 자동 로테이션 및 범위 수렴
  useFrame((state) => {
    if (isDragging) {
      // 드래그 중일 때는 아무것도 하지 않음
      return
    }

    const time = state.clock.getElapsedTime()
    const currentX = groupRef.current.rotation.x
    const currentY = groupRef.current.rotation.y

    // 현재 위치가 자동 로테이션 범위 내에 있는지 확인
    const isXInRange = Math.abs(currentX - AUTO_ROTATION_RANGE.x.center) <= AUTO_ROTATION_RANGE.x.range
    const isYInRange = Math.abs(currentY - AUTO_ROTATION_RANGE.y.center) <= AUTO_ROTATION_RANGE.y.range

    // 수렴 속도 (범위를 벗어난 경우 중심으로 천천히 이동)
    const convergenceSpeed = 0.02

    let targetX = currentX
    let targetY = currentY

    if (isXInRange && isYInRange) {
      // 범위 내에 있으면 정상적인 자동 로테이션
      targetX = AUTO_ROTATION_RANGE.x.center + Math.sin(time * 0.3) * AUTO_ROTATION_RANGE.x.range
      targetY = AUTO_ROTATION_RANGE.y.center + Math.sin(time * 0.2) * AUTO_ROTATION_RANGE.y.range
    } else {
      // 범위를 벗어나면 천천히 범위 내로 수렴
      if (!isXInRange) {
        targetX = lerp(currentX, AUTO_ROTATION_RANGE.x.center, convergenceSpeed)
      } else {
        targetX = AUTO_ROTATION_RANGE.x.center + Math.sin(time * 0.3) * AUTO_ROTATION_RANGE.x.range
      }

      if (!isYInRange) {
        targetY = lerp(currentY, AUTO_ROTATION_RANGE.y.center, convergenceSpeed)
      } else {
        targetY = AUTO_ROTATION_RANGE.y.center + Math.sin(time * 0.2) * AUTO_ROTATION_RANGE.y.range
      }
    }

    groupRef.current.rotation.x = targetX
    groupRef.current.rotation.y = targetY
    groupRef.current.rotation.z = 0
  })

  // 아바타 데이터가 로드되지 않았으면 기본 카드만 표시
  if (!avatarData) {
    return (
      <group ref={groupRef} position={[0, -0.5, 0]}>
        <group scale={[1.62, 1.62, 1.62]}>
          {/* 자연스러운 분위기 조명 */}
          <ambientLight intensity={0.4} color={0xffffff} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={0.2}
            color={0xfff8dc}
            castShadow={false}
          />

          <mesh material={materials}>
            <boxGeometry args={boxGeometry} />
          </mesh>
        </group>
      </group>
    )
  }

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* 명함과 아바타 요소들이 함께 스케일링되는 그룹 */}
      <group scale={[1.62, 1.62, 1.62]}>
        {/* 자연스러운 분위기 조명 */}
        <ambientLight intensity={0.4} color={0xffffff} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.2}
          color={0xfff8dc}
          castShadow={false}
        />

        {/* 명함 기본 카드 - 실제 명함 비율, 아바타 요소가 상대적으로 더 커보이도록 85% 크기 */}
        <mesh material={materials}>
          <boxGeometry args={boxGeometry} />
        </mesh>

        {/* 아바타 요소들 */}
        <AvatarElements avatarData={avatarData} />
      </group>
    </group>
  )
}

export default RotatingCard