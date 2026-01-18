import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, Suspense } from 'react'
import * as THREE from 'three'
import { Cylinder, useTexture, Float } from '@react-three/drei'

const LogoMesh = ({ isThinking }) => {
    const meshRef = useRef()
    const texture = useTexture('/logo.jpg')

    // Hardened texture configurations for perfect fit
    texture.center.set(0.5, 0.5)
    texture.repeat.set(0.75, 0.75) // 15% zoom
    texture.rotation = Math.PI / 2 // Correct orientation
    texture.anisotropy = 16
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true

    useFrame((state) => {
        if (!meshRef.current) return
        const t = state.clock.getElapsedTime()

        if (isThinking) {
            meshRef.current.rotation.y += 0.1
            meshRef.current.scale.setScalar(1.2 + Math.sin(t * 10) * 0.05)
        } else {
            meshRef.current.rotation.y += 0.015
        }
    })

    return (
        <group ref={meshRef}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <Cylinder args={[2.5, 2.5, 0.1, 64]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial attach="material-0" color="#00f3ff" metalness={1} roughness={0} emissive="#00f3ff" emissiveIntensity={0.5} />
                    <meshStandardMaterial attach="material-1" map={texture} />
                    <meshStandardMaterial attach="material-2" map={texture} />
                </Cylinder>
            </Float>
            <pointLight intensity={15} color="#00f3ff" position={[0, 0, 5]} />
        </group>
    )
}

const AssistantAvatar = ({ isThinking }) => {
    return (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center relative pointer-events-none">
            <Canvas camera={{ position: [0, 0, 8] }}>
                <ambientLight intensity={1.5} />
                <pointLight position={[10, 10, 10]} intensity={2.5} />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#bc13fe" />

                <Suspense fallback={
                    <mesh>
                        <cylinderGeometry args={[2.5, 2.5, 0.4, 32]} />
                        <meshStandardMaterial color="#00f3ff" wireframe />
                    </mesh>
                }>
                    <LogoMesh isThinking={isThinking} />
                </Suspense>
            </Canvas>
        </div>
    )
}

export default AssistantAvatar
