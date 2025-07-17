const AvatarElements = () => {
  return (
    <group>
      {/* 얼굴 - 중심 (명함 두께 0.02 위에 떠있음) */}
      <mesh position={[0, 0.2, 0.15]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial color="#FFB3BA" transparent opacity={0.8} />
      </mesh>
      
      {/* 스티커 1 - 왼쪽 위 */}
      <mesh position={[-0.6, 0.8, 0.12]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshBasicMaterial color="#BAFFC9" transparent opacity={0.8} />
      </mesh>
      
      {/* 스티커 2 - 오른쪽 위 */}
      <mesh position={[0.6, 0.8, 0.18]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshBasicMaterial color="#BAE1FF" transparent opacity={0.8} />
      </mesh>
      
      {/* 스티커 3 - 왼쪽 아래 */}
      <mesh position={[-0.6, -0.4, 0.13]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshBasicMaterial color="#FFFFBA" transparent opacity={0.8} />
      </mesh>
      
      {/* 스티커 4 - 오른쪽 아래 */}
      <mesh position={[0.6, -0.4, 0.16]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshBasicMaterial color="#FFBAFE" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

export default AvatarElements