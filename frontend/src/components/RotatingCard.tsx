import { useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Group } from 'three'
import { TextureLoader } from 'three'
import namecardImage from '../assets/images/namecard.png'
import AvatarElements from './AvatarElements'

const RotatingCard = () => {
  const groupRef = useRef<Group>(null!)
  const texture = useLoader(TextureLoader, namecardImage)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    // 정면(0도)을 기준으로 앞면만 보이는 범위에서 회전
    // Y축 회전: -25도 ~ +25도 (좌우 회전, 뒷면 안보이게)
    groupRef.current.rotation.y = Math.sin(time * 0.4) * 0.44 // 0.44 rad = 약 25도
    
    // X축 회전: -20도 ~ +20도 (위아래 회전)
    groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.35 // 0.35 rad = 약 20도
    
    // Z축 회전: -8도 ~ +8도 (약간의 기울기)
    groupRef.current.rotation.z = Math.sin(time * 0.6) * 0.14 // 0.14 rad = 약 8도
  })

  return (
    <group ref={groupRef}>
      {/* 명함 기본 카드 */}
      <mesh>
        <boxGeometry args={[2.25, 3.15, 0.02]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      
      {/* 아바타 요소들 */}
      <AvatarElements />
    </group>
  )
}

export default RotatingCard