import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import RotatingCard from './RotatingCard'
import type { AvatarData } from '../types/avatar'

interface AvatarPreviewProps {
  avatarData: AvatarData | null;
}

const AvatarPreview = ({ avatarData }: AvatarPreviewProps) => {
  return (
    <div className="avatar-preview">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: '#f8f8f8' }}
      >
        <color attach="background" args={['#f8f8f8']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-5, -5, 5]} intensity={0.8} />
        <RotatingCard avatarData={avatarData} />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  )
}

export default AvatarPreview