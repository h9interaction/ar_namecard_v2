import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'

interface AnimatedSpriteProps {
  spriteImage: string;
  position: [number, number, number];
  scale: [number, number, number];
}

const AnimatedSprite = ({ spriteImage, position, scale }: AnimatedSpriteProps) => {
  const texture = useLoader(TextureLoader, `/src/assets/test_images/sprites/${spriteImage}`)

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        alphaTest={0.1}
      />
    </mesh>
  )
}

export default AnimatedSprite