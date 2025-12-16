'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Stars, PerspectiveCamera } from '@react-three/drei';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

// --- Blockchain Network Component ---
function BlockchainNetwork({ phase }: { phase: 'idle' | 'testing' | 'complete' }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const linesRef = useRef<THREE.LineSegments>(null);
    const groupRef = useRef<THREE.Group>(null);

    // Configuration
    const count = 150; // Number of nodes
    const connectionDistance = 4;

    // Generate nodes (blocks)
    const { positions, colors, connections } = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const connections: number[] = [];

        const spread = 30;
        const color1 = new THREE.Color('#0ea5e9'); // Cyan
        const color2 = new THREE.Color('#E6007A'); // Magenta (Polkadot)
        const color3 = new THREE.Color('#ffffff'); // White

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // Spread nodes in a cloud
            positions[i3] = (Math.random() - 0.5) * spread;
            positions[i3 + 1] = (Math.random() - 0.5) * spread * 0.8;
            positions[i3 + 2] = (Math.random() - 0.5) * spread;

            // Assign random theme color
            const rand = Math.random();
            const color = rand > 0.6 ? color1 : rand > 0.3 ? color2 : color3;
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        // Generate connections (simple distance check)
        const pos = new THREE.Vector3();
        const otherPos = new THREE.Vector3();

        for (let i = 0; i < count; i++) {
            pos.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
            for (let j = i + 1; j < count; j++) {
                otherPos.set(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
                if (pos.distanceTo(otherPos) < connectionDistance) {
                    connections.push(
                        positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
                        positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
                    );
                }
            }
        }

        return { positions, colors, connections: new Float32Array(connections) };
    }, []);

    // Setup instances
    useEffect(() => {
        if (!meshRef.current) return;
        const tempObj = new THREE.Object3D();
        const color = new THREE.Color();

        for (let i = 0; i < count; i++) {
            tempObj.position.set(
                positions[i * 3],
                positions[i * 3 + 1],
                positions[i * 3 + 2]
            );
            // Random rotation unique to each block
            tempObj.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            tempObj.scale.setScalar(0.3 + Math.random() * 0.4); // Varied sizes
            tempObj.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObj.matrix);

            color.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
            meshRef.current.setColorAt(i, color);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }, [positions, colors]);

    // Animation Loop
    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // 1. Idle rotation
        groupRef.current.rotation.y += delta * 0.05;

        // 2. Camera movement / Warp Effect
        if (phase === 'testing') {
            groupRef.current.position.z += delta * 25; // Warp speed
            if (groupRef.current.position.z > 20) {
                groupRef.current.position.z = -50;
            }
        } else {
            // Gentle floating
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.5;
            groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0, delta * 2);
        }
    });

    return (
        <group ref={groupRef}>
            {/* Nodes (Blocks) */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial
                    toneMapped={false}
                    emissive="#0ea5e9"
                    emissiveIntensity={0.8}
                    roughness={0.1}
                    metalness={0.9}
                />
            </instancedMesh>

            {/* Connections (Network Lines) */}
            <lineSegments ref={linesRef}>
                <bufferGeometry>
                    {/* Use args to pass array and itemSize to constructor */}
                    <bufferAttribute
                        attach="attributes-position"
                        args={[connections, 3]}
                    />
                </bufferGeometry>
                <lineBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.12}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </lineSegments>

            <Stars radius={60} depth={20} count={1000} factor={4} saturation={0} fade speed={1} />
        </group>
    );
}

// --- Chain Connection Component ---
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
            {/* Glow effect for the "energy" inside the chain */}
            <mesh scale={[1, 1, 1]}>
                <torusGeometry args={[0.5, 0.05, 16, 32]} />
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
        </group>
    );
}

function ChainStrand({ count = 8, color, side }: { count?: number, color: string, side: 'left' | 'right' }) {
    const isLeft = side === 'left';
    return (
        <group>
            {Array.from({ length: count }).map((_, i) => {
                // Alternating rotation: 0, 90, 0, 90...
                const isHorizontal = i % 2 === 0;
                // Position links along X axis
                const xOffset = i * 0.75 * (isLeft ? 1 : -1);

                return (
                    <ChainLink
                        key={i}
                        position={[xOffset, 0, 0]}
                        rotation={[isHorizontal ? Math.PI / 2 : 0, 0, 0]}
                        color={color}
                    />
                );
            })}
            {/* End hook/connector */}
            <mesh position={[(count * 0.75) * (isLeft ? 1 : -1), 0, 0]}>
                <sphereGeometry args={[0.2]} />
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
        </group>
    );
}

function ChainLockAnimation({ phase }: { phase: string }) {
    const leftChain = useRef<THREE.Group>(null);
    const rightChain = useRef<THREE.Group>(null);
    const sparkRef = useRef<THREE.PointLight>(null);

    useFrame((state) => {
        if (!leftChain.current || !rightChain.current) return;

        // Target positions
        let targetXLeft = -6.5;
        let targetXRight = 6.5;

        // Idle: Offscreen
        if (phase === 'idle') {
            targetXLeft = -15;
            targetXRight = 15;
        }
        // Testing: Interlock
        else if (phase === 'testing') {
            // Slight overlap for locking
            targetXLeft = -5.8;
            targetXRight = 5.8;
        }
        // Complete: Pull away
        else if (phase === 'complete') {
            targetXLeft = -20;
            targetXRight = 20;
        }

        // Animate - faster lerp during 'complete' phase for snappier transition
        const lerpFactor = phase === 'testing' ? 0.08 : phase === 'complete' ? 0.12 : 0.05;
        leftChain.current.position.x = THREE.MathUtils.lerp(leftChain.current.position.x, targetXLeft, lerpFactor);
        rightChain.current.position.x = THREE.MathUtils.lerp(rightChain.current.position.x, targetXRight, lerpFactor);

        // Add some tension/shake when locked
        if (phase === 'testing' && Math.abs(leftChain.current.position.x - targetXLeft) < 0.5) {
            const shake = Math.sin(state.clock.elapsedTime * 50) * 0.05;
            leftChain.current.position.y = shake;
            rightChain.current.position.y = -shake;
        } else {
            leftChain.current.position.y = THREE.MathUtils.lerp(leftChain.current.position.y, 0, 0.1);
            rightChain.current.position.y = THREE.MathUtils.lerp(rightChain.current.position.y, 0, 0.1);
        }

        // Spark Effect
        if (sparkRef.current) {
            if (phase === 'testing' && Math.abs(leftChain.current.position.x - targetXLeft) < 0.5) {
                sparkRef.current.intensity = THREE.MathUtils.lerp(sparkRef.current.intensity, 10, 0.2);
            } else {
                sparkRef.current.intensity = THREE.MathUtils.lerp(sparkRef.current.intensity, 0, 0.2);
            }
        }
    });

    return (
        <group position={[0, -1, 5]}> {/* Positioned clearly in view */}
            <group ref={leftChain} position={[-15, 0, 0]}>
                <ChainStrand side="left" color="#0ea5e9" count={10} />
            </group>
            <group ref={rightChain} position={[15, 0, 0]}>
                <ChainStrand side="right" color="#E6007A" count={10} />
            </group>

            {/* Spark at center */}
            <pointLight
                ref={sparkRef}
                position={[0, 0, 0]}
                color="#ffffff"
                distance={8}
                decay={2}
            />
        </group>
    );
}

interface Scene3DProps {
    speed: number;
    phase: 'idle' | 'testing' | 'complete';
}

export default function Scene3D({ speed, phase }: Scene3DProps) {
    return (
        <div className="w-full h-full absolute inset-0 bg-black">
            <Canvas dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
                <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={60} />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#0ea5e9" />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#E6007A" />

                {/* The Blockchain Network */}
                <BlockchainNetwork phase={phase} />

                {/* The Chain Connection Animation */}
                <ChainLockAnimation phase={phase} />

                {/* Post-processing-like effects via environment */}
                <Environment preset="city" />
                <fog attach="fog" args={['#000000', 5, 50]} />
            </Canvas>
        </div>
    );
}
