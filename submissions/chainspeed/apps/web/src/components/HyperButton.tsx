'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

interface HyperButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

function ButtonMesh({ hovered }: { hovered: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;

        // Rotate based on hover
        const t = state.clock.getElapsedTime();
        meshRef.current.rotation.x = Math.sin(t) * 0.1;
        meshRef.current.rotation.y = Math.cos(t) * 0.1;

        if (hovered) {
            meshRef.current.rotation.z += 0.05;
            meshRef.current.scale.setScalar(1.1 + Math.sin(t * 10) * 0.05);
        } else {
            meshRef.current.scale.setScalar(1);
        }
    });

    return (
        <Float speed={5} rotationIntensity={0.2} floatIntensity={0.5}>
            <group>
                {/* Main Sphere */}
                <mesh ref={meshRef}>
                    <sphereGeometry args={[1.8, 64, 64]} />
                    <MeshDistortMaterial
                        color={hovered ? "#0ea5e9" : "#000000"}
                        emissive={hovered ? "#0ea5e9" : "#0ea5e9"}
                        emissiveIntensity={hovered ? 0.8 : 0.2}
                        roughness={0.1}
                        metalness={0.8}
                        distort={hovered ? 0.4 : 0}
                        speed={5}
                        wireframe={!hovered}
                    />
                </mesh>

                {/* Text Label */}
                <Text
                    position={[0, 0, 2.2]}
                    fontSize={0.8}
                    color={hovered ? "#ffffff" : "#0ea5e9"}
                    anchorX="center"
                    anchorY="middle"
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff"
                >
                    GO
                </Text>

                {/* Outer Ring */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[2.5, 0.02, 16, 100]} />
                    <meshBasicMaterial color="#0ea5e9" transparent opacity={0.3} />
                </mesh>
            </group>
        </Float>
    );
}

export default function HyperButton(props: HyperButtonProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="w-64 h-64 relative cursor-pointer z-50"
            onClick={props.disabled ? undefined : props.onClick}
            onMouseEnter={() => !props.disabled && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Canvas>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <ButtonMesh hovered={hovered} />
            </Canvas>
        </div>
    );
}
