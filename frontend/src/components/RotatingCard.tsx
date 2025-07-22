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
  onLoadingComplete?: () => void;
}

const RotatingCard = ({ avatarData, onLoadingComplete }: RotatingCardProps) => {
  const groupRef = useRef<Group>(null!)
  const frontTexture = useLoader(TextureLoader, namecardImage)
  const backTexture = useLoader(TextureLoader, namecardFrontImage)

  // 디폴트 로테이션 및 자동 로테이션 범위 정의
  const DEFAULT_ROTATION = {
    x: -Math.PI * 0.4, // -36도
    y: 0,
    z: 0
  }

  // 드래그 상태 관리
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [rotationStart, setRotationStart] = useState<{ x: number; y: number } | null>(null)
  const [dragEndTime, setDragEndTime] = useState<number | null>(null)
  const [rotationDirection, setRotationDirection] = useState<{ x: number; y: number }>(() => ({
    x: Math.random() > 0.5 ? 1 : -1,
    y: Math.random() > 0.5 ? 1 : -1
  }))
  const [isInAutoRotationRange, setIsInAutoRotationRange] = useState<{ x: boolean; y: boolean }>({ x: false, y: false })
  const [autoRotationStarted, setAutoRotationStarted] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const AUTO_ROTATION_RANGE = {
    x: { min: DEFAULT_ROTATION.x - Math.PI / 9, max: DEFAULT_ROTATION.x + Math.PI / 9 }, // ±20도
    y: { min: DEFAULT_ROTATION.y - Math.PI * 5 / 18, max: DEFAULT_ROTATION.y + Math.PI * 5 / 18 }  // ±50도
  }

  // 부드러운 전환을 위한 lerp 함수
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor
  }



  // 마우스 이벤트 감지
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      setIsDragging(true)
      setDragStart({ x: event.clientX, y: event.clientY })
      setRotationStart({
        x: groupRef.current.rotation.x,
        y: groupRef.current.rotation.y
      })
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || !dragStart || !rotationStart) return

      const deltaX = event.clientX - dragStart.x
      const deltaY = event.clientY - dragStart.y

      // 가로 드래그 → y축 회전, 세로 드래그 → x축 회전
      const sensitivity = 0.005
      groupRef.current.rotation.y = rotationStart.y + deltaX * sensitivity
      groupRef.current.rotation.x = rotationStart.x + deltaY * sensitivity
      groupRef.current.rotation.z = 0 // z축 회전 항상 0으로 고정
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        setDragStart(null)
        setRotationStart(null)
        setDragEndTime(Date.now())
        setIsInAutoRotationRange({ x: false, y: false })
        setAutoRotationStarted(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, rotationStart])



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

  // 자동 로테이션 로직
  useFrame(() => {
    if (isDragging) {
      // 드래그 중일 때는 아무것도 하지 않음
      return
    }

    const currentTime = Date.now()
    const currentX = groupRef.current.rotation.x
    const currentY = groupRef.current.rotation.y

    // 드래그 종료 후 1초 동안 디폴트 로테이션으로 부드럽게 복귀
    if (dragEndTime && currentTime - dragEndTime < 1000) {
      // 디폴트 로테이션으로 부드럽게 이동
      const lerpSpeed = 0.05
      groupRef.current.rotation.x = lerp(currentX, DEFAULT_ROTATION.x, lerpSpeed)
      groupRef.current.rotation.y = lerp(currentY, DEFAULT_ROTATION.y, lerpSpeed)
      groupRef.current.rotation.z = 0
      return
    }

    // 1초 지연 완료, 로테이션 시작
    if (dragEndTime) {
      setDragEndTime(null)

      // 랜덤한 방향으로 시작
      const xDirection = Math.random() > 0.5 ? 1 : -1
      const yDirection = Math.random() > 0.5 ? 1 : -1

      setRotationDirection({ x: xDirection, y: yDirection })
    }

    const rotationSpeed = 0.001

    let newX = currentX
    let newY = currentY

    // X축 로테이션 처리
    if (!isInAutoRotationRange.x) {
      // 아직 범위에 들어가지 않음 - 일정한 속도로 이동
      const targetX = rotationDirection.x > 0 ? AUTO_ROTATION_RANGE.x.min : AUTO_ROTATION_RANGE.x.max
      const direction = targetX > currentX ? 1 : -1
      newX = currentX + direction * rotationSpeed * 2

      // 범위에 도달했는지 확인 (목표를 지나쳤는지 확인)
      if ((direction > 0 && newX >= targetX) || (direction < 0 && newX <= targetX)) {
        setIsInAutoRotationRange(prev => ({ ...prev, x: true }))
        // 방향 전환하고 즉시 한 스텝 이동
        const newDirection = targetX === AUTO_ROTATION_RANGE.x.min ? 1 : -1
        newX = targetX + newDirection * rotationSpeed
        setRotationDirection(prev => ({ ...prev, x: newDirection }))
      }
    } else {
      // 범위 내에서 자동 로테이션
      newX = currentX + rotationDirection.x * rotationSpeed

      // 범위 끝에 도달하면 방향 바꾸기
      if (newX >= AUTO_ROTATION_RANGE.x.max) {
        newX = AUTO_ROTATION_RANGE.x.max
        setRotationDirection(prev => ({ ...prev, x: -1 }))
      } else if (newX <= AUTO_ROTATION_RANGE.x.min) {
        newX = AUTO_ROTATION_RANGE.x.min
        setRotationDirection(prev => ({ ...prev, x: 1 }))
      }
    }

    // Y축 로테이션 처리
    if (!isInAutoRotationRange.y) {
      // 아직 범위에 들어가지 않음 - 일정한 속도로 이동
      const targetY = rotationDirection.y > 0 ? AUTO_ROTATION_RANGE.y.min : AUTO_ROTATION_RANGE.y.max
      const direction = targetY > currentY ? 1 : -1
      newY = currentY + direction * rotationSpeed * 2

      // 범위에 도달했는지 확인 (목표를 지나쳤는지 확인)
      if ((direction > 0 && newY >= targetY) || (direction < 0 && newY <= targetY)) {
        setIsInAutoRotationRange(prev => ({ ...prev, y: true }))
        // 방향 전환하고 즉시 한 스텝 이동
        const newDirection = targetY === AUTO_ROTATION_RANGE.y.min ? 1 : -1
        newY = targetY + newDirection * rotationSpeed
        setRotationDirection(prev => ({ ...prev, y: newDirection }))
      }
    } else {
      // 범위 내에서 자동 로테이션
      newY = currentY + rotationDirection.y * rotationSpeed

      // 범위 끝에 도달하면 방향 바꾸기
      if (newY >= AUTO_ROTATION_RANGE.y.max) {
        newY = AUTO_ROTATION_RANGE.y.max
        setRotationDirection(prev => ({ ...prev, y: -1 }))
      } else if (newY <= AUTO_ROTATION_RANGE.y.min) {
        newY = AUTO_ROTATION_RANGE.y.min
        setRotationDirection(prev => ({ ...prev, y: 1 }))
      }
    }

    groupRef.current.rotation.x = newX
    groupRef.current.rotation.y = newY
    groupRef.current.rotation.z = 0
  })

  // 아바타 데이터가 로드되지 않았으면 기본 카드만 표시
  if (!avatarData) {
    // 기본 카드에도 초기 로테이션 적용 (한 번만)
    useEffect(() => {
      if (groupRef.current && !isInitialized) {
        groupRef.current.rotation.x = DEFAULT_ROTATION.x
        groupRef.current.rotation.y = DEFAULT_ROTATION.y
        groupRef.current.rotation.z = DEFAULT_ROTATION.z
        setIsInitialized(true)
        
        // 기본 카드는 로딩이 없으므로 콜백 호출하지 않음
      }
    }, [])

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

  // 초기 로테이션 설정 (한 번만)
  useEffect(() => {
    if (groupRef.current && !isInitialized) {
      groupRef.current.rotation.x = DEFAULT_ROTATION.x
      groupRef.current.rotation.y = DEFAULT_ROTATION.y
      groupRef.current.rotation.z = DEFAULT_ROTATION.z
      setIsInitialized(true)
    }
  }, [])


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
        <AvatarElements avatarData={avatarData} onLoadingComplete={onLoadingComplete} />
      </group>
    </group>
  )
}

export default RotatingCard