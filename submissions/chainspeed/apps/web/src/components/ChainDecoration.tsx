'use client';

import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Chain Link component (reused from Scene3D)
function ChainLink({ position, rotation, color }: { position: [number, number, number], rotation: [number, number, number], color: string }) {
    return (
        <group position={position} rotation={rotation}>
            <mesh>
                <torusGeometry args={[0.5, 0.15, 16, 32]} />
                <meshStandardMaterial
                    color="#222"
                    roughness={0.2}
                    metalness={0.9}
                />
            </mesh>
            <mesh scale={[1, 1, 1]}>
                <torusGeometry args={[0.5, 0.05, 16, 32]} />
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
        </group>
    );
}

// Decorative chain for card background
function CardChainDecor({ color, side }: { color: string, side: 'left' | 'right' }) {
    const count = 6;
    const isLeft = side === 'left';

    return (
        <group rotation={[0, 0, isLeft ? -Math.PI / 6 : Math.PI / 6]} position={[0, 0, 0]}>
            {Array.from({ length: count }).map((_, i) => {
                const isHorizontal = i % 2 === 0;
                const xOffset = i * 0.75 * (isLeft ? -1 : 1);

                return (
                    <ChainLink
                        key={i}
                        position={[xOffset, i * 0.5, 0]}
                        rotation={[isHorizontal ? Math.PI / 2 : 0, 0, 0]}
                        color={color}
                    />
                );
            })}
        </group>
    );
}

export default function ChainDecoration({ color, side }: { color: string, side: 'left' | 'right' }) {
    return (
        <div className={`absolute inset-0 pointer-events-none opacity-30 ${side === 'left' ? '-left-12 -top-12' : '-right-12 -top-12'}`}>
            <div className="w-full h-full">
                <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}>
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[5, 5, 5]} intensity={1} color={color} />
                    <CardChainDecor color={color} side={side} />
                </Canvas>
            </div>
        </div>
    );
}
