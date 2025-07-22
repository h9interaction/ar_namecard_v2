import { Canvas } from '@react-three/fiber'
import RotatingCard from './RotatingCard'
import type { AvatarData } from '../types/avatar'

interface AvatarPreviewProps {
  avatarData: AvatarData | null;
  isVisible?: boolean;
  isFading?: boolean;
  onLoadingComplete?: () => void;
}

const AvatarPreview = ({ avatarData, isVisible = true, isFading = false, onLoadingComplete }: AvatarPreviewProps) => {
  // 표시 상태에 따른 클래스 결정
  const getClassName = () => {
    if (isFading) return 'avatar-preview fading'
    if (isVisible) return 'avatar-preview'
    return 'avatar-preview hidden'
  }

  return (
    <div className={getClassName()}>
      <Canvas
        camera={{ position: [0, 3, 4], fov: 50 }}
        style={{ background: '#f8f8f8' }}
      >
        <color attach="background" args={['#f8f8f8']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-5, -5, 5]} intensity={0.8} />
        <RotatingCard key="rotating-card" avatarData={avatarData} onLoadingComplete={onLoadingComplete} />
      </Canvas>
    </div>
  )
}

export default AvatarPreview