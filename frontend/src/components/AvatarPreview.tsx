import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import RotatingCard from './RotatingCard'

const AvatarPreview = () => {
  return (
    <div className="avatar-preview">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: '#ffffff' }}
      >
        <color attach="background" args={['#ffffff']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-5, -5, 5]} intensity={0.8} />
        <RotatingCard />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  )
}

export default AvatarPreview