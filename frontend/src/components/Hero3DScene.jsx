import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

/* ═══════════════════════════════════════════════ */
/*   PREPLOOP 3D HERO — INTERVIEW PREP UNIVERSE   */
/* ═══════════════════════════════════════════════ */

/* ─── Central Hub — rotating code sphere ─── */
function CentralHub() {
    const groupRef = useRef();
    const ringRefs = [useRef(), useRef(), useRef()];
    const coreRef = useRef();
    const pulseRef = useRef();

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        if (groupRef.current) {
            groupRef.current.rotation.y = t * 0.15;
        }
        if (ringRefs[0].current) {
            ringRefs[0].current.rotation.x = t * 0.4;
            ringRefs[0].current.rotation.z = t * 0.2;
        }
        if (ringRefs[1].current) {
            ringRefs[1].current.rotation.y = t * 0.3;
            ringRefs[1].current.rotation.x = Math.PI / 3 + t * 0.15;
        }
        if (ringRefs[2].current) {
            ringRefs[2].current.rotation.z = t * 0.35;
            ringRefs[2].current.rotation.y = Math.PI / 4 + t * 0.1;
        }
        if (coreRef.current) {
            const s = 1 + Math.sin(t * 2) * 0.08;
            coreRef.current.scale.setScalar(s);
        }
        if (pulseRef.current) {
            const ps = 1 + Math.sin(t * 1.5) * 0.3;
            pulseRef.current.scale.setScalar(ps);
            pulseRef.current.material.opacity = 0.08 - Math.sin(t * 1.5) * 0.04;
        }
    });

    const ringColors = ['#a78bfa', '#60a5fa', '#34d399'];
    const ringSizes = [1.1, 0.85, 1.3];

    return (
        <group ref={groupRef} position={[0, 0.3, 0]}>
            {/* Outer pulsing glow */}
            <mesh ref={pulseRef}>
                <sphereGeometry args={[2.2, 32, 32]} />
                <meshBasicMaterial
                    color="#a78bfa"
                    transparent opacity={0.04}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Core bright sphere */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.28, 32, 32]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#c084fc"
                    emissiveIntensity={4}
                    toneMapped={false}
                    roughness={0.05}
                    metalness={0.9}
                />
            </mesh>

            {/* White-hot center */}
            <mesh>
                <sphereGeometry args={[0.14, 16, 16]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>

            {/* Inner glow */}
            <mesh>
                <sphereGeometry args={[0.55, 24, 24]} />
                <meshBasicMaterial
                    color="#c084fc"
                    transparent opacity={0.1}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Orbital rings */}
            {ringColors.map((color, i) => (
                <mesh key={i} ref={ringRefs[i]}>
                    <torusGeometry args={[ringSizes[i], 0.012, 16, 80]} />
                    <meshBasicMaterial
                        color={color}
                        transparent opacity={0.5}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

/* ─── Orbiting Feature Nodes ─── */
const FEATURE_NODES = [
    { label: 'DSA', color: '#a78bfa', glow: '#7c3aed', orbit: 2.3, speed: 0.4, yOffset: 0.8, phase: 0, icon: '{}' },
    { label: 'SQL', color: '#60a5fa', glow: '#3b82f6', orbit: 2.6, speed: -0.3, yOffset: -0.5, phase: Math.PI * 0.5, icon: 'SELECT' },
    { label: 'Mock', color: '#34d399', glow: '#10b981', orbit: 2.9, speed: 0.35, yOffset: 0.2, phase: Math.PI, icon: '🎙' },
    { label: 'AI', color: '#f472b6', glow: '#ec4899', orbit: 2.1, speed: -0.45, yOffset: -0.9, phase: Math.PI * 1.5, icon: '⚡' },
    { label: 'Code', color: '#fbbf24', glow: '#f59e0b', orbit: 3.1, speed: 0.28, yOffset: 1.1, phase: Math.PI * 0.7, icon: '</>' },
    { label: 'Path', color: '#22d3ee', glow: '#06b6d4', orbit: 2.5, speed: -0.38, yOffset: -0.2, phase: Math.PI * 1.2, icon: '📍' },
];

function FeatureNode({ node, index }) {
    const groupRef = useRef();
    const haloRef = useRef();
    const lineRef = useRef();

    const connectionGeo = useMemo(() => {
        const points = [];
        for (let i = 0; i <= 30; i++) {
            points.push(new THREE.Vector3(0, 0, 0));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        return geo;
    }, []);

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        const angle = t * node.speed + node.phase;
        const x = Math.cos(angle) * node.orbit;
        const z = Math.sin(angle) * node.orbit;
        const y = node.yOffset + Math.sin(t * 0.8 + index) * 0.15;

        if (groupRef.current) {
            groupRef.current.position.set(x, y + 0.3, z);
        }
        if (haloRef.current) {
            const s = 1 + Math.sin(t * 2.5 + index * 1.3) * 0.2;
            haloRef.current.scale.setScalar(s);
        }

        // Update connection line to center
        if (lineRef.current) {
            const positions = lineRef.current.geometry.attributes.position.array;
            for (let i = 0; i <= 30; i++) {
                const frac = i / 30;
                positions[i * 3] = x * frac;
                positions[i * 3 + 1] = (y + 0.3) * frac;
                positions[i * 3 + 2] = z * frac;
            }
            lineRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    return (
        <group>
            {/* Connection line to center */}
            <line ref={lineRef} geometry={connectionGeo}>
                <lineBasicMaterial
                    color={node.color}
                    transparent opacity={0.12}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </line>

            <group ref={groupRef}>
                {/* Outer glow */}
                <mesh ref={haloRef}>
                    <sphereGeometry args={[0.35, 16, 16]} />
                    <meshBasicMaterial
                        color={node.glow}
                        transparent opacity={0.06}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>

                {/* Inner glow */}
                <mesh>
                    <sphereGeometry args={[0.18, 16, 16]} />
                    <meshBasicMaterial
                        color={node.color}
                        transparent opacity={0.15}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>

                {/* Core */}
                <mesh>
                    <sphereGeometry args={[0.1, 24, 24]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        emissive={node.color}
                        emissiveIntensity={3}
                        toneMapped={false}
                        roughness={0.1}
                        metalness={0.8}
                    />
                </mesh>

                {/* White center */}
                <mesh>
                    <sphereGeometry args={[0.04, 12, 12]} />
                    <meshBasicMaterial color="#ffffff" toneMapped={false} />
                </mesh>

                {/* Label */}
                <Text
                    position={[0, -0.22, 0]}
                    fontSize={0.1}
                    color={node.color}
                    anchorX="center"
                    anchorY="top"
                    fillOpacity={0.8}
                >
                    {node.label}
                </Text>
            </group>
        </group>
    );
}

/* ─── Data Flow Particles — traveling along orbits ─── */
function DataFlowParticles({ count = 60 }) {
    const ref = useRef();

    const particles = useMemo(() => {
        return Array.from({ length: count }, (_, i) => ({
            orbit: 1.5 + Math.random() * 2.2,
            speed: (0.2 + Math.random() * 0.6) * (Math.random() > 0.5 ? 1 : -1),
            yOffset: (Math.random() - 0.5) * 3,
            phase: Math.random() * Math.PI * 2,
            ySpeed: 0.3 + Math.random() * 0.5,
            size: 0.015 + Math.random() * 0.02,
        }));
    }, [count]);

    const positions = useMemo(() => new Float32Array(count * 3), [count]);
    const colors = useMemo(() => {
        const c = new Float32Array(count * 3);
        const palette = [
            [0.65, 0.55, 0.98], // purple
            [0.37, 0.51, 0.97], // blue
            [0.20, 0.83, 0.60], // green
            [0.96, 0.45, 0.72], // pink
            [0.98, 0.75, 0.14], // gold
            [0.13, 0.83, 0.93], // cyan
        ];
        for (let i = 0; i < count; i++) {
            const col = palette[i % palette.length];
            c[i * 3] = col[0];
            c[i * 3 + 1] = col[1];
            c[i * 3 + 2] = col[2];
        }
        return c;
    }, [count]);

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        const pos = ref.current?.geometry?.attributes?.position;
        if (!pos) return;

        for (let i = 0; i < count; i++) {
            const p = particles[i];
            const angle = t * p.speed + p.phase;
            pos.array[i * 3] = Math.cos(angle) * p.orbit;
            pos.array[i * 3 + 1] = p.yOffset + Math.sin(t * p.ySpeed + p.phase) * 0.4 + 0.3;
            pos.array[i * 3 + 2] = Math.sin(angle) * p.orbit;
        }
        pos.needsUpdate = true;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
                <bufferAttribute attach="attributes-color" array={colors} count={count} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial
                size={0.04}
                vertexColors
                transparent opacity={0.8}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

/* ─── Background Starfield ─── */
function Starfield({ count = 300 }) {
    const ref = useRef();

    const [positions, colors] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            // Distribute in a large sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 5 + Math.random() * 12;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);

            const brightness = 0.3 + Math.random() * 0.7;
            col[i * 3] = brightness * 0.7;
            col[i * 3 + 1] = brightness * 0.75;
            col[i * 3 + 2] = brightness;
        }
        return [pos, col];
    }, [count]);

    useFrame(({ clock }) => {
        if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.005;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
                <bufferAttribute attach="attributes-color" array={colors} count={count} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial
                size={0.02}
                vertexColors
                transparent opacity={0.6}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

/* ─── Floating DSA/Code Concepts ─── */
function FloatingConcepts() {
    const ref = useRef();

    const concepts = [
        { text: 'O(log n)', pos: [-4.5, 2.5, -2], size: 0.16, color: '#a78bfa' },
        { text: 'BFS', pos: [4.5, 2, 1], size: 0.18, color: '#60a5fa' },
        { text: 'DFS', pos: [-4, -1.5, 1.5], size: 0.15, color: '#34d399' },
        { text: 'HashMap', pos: [4.2, -1.2, -2], size: 0.14, color: '#fbbf24' },
        { text: 'Stack', pos: [-3, 3, 0.5], size: 0.13, color: '#f472b6' },
        { text: 'Queue', pos: [3.5, -2.5, 0], size: 0.13, color: '#22d3ee' },
        { text: 'Graph', pos: [-4.8, 0, -1], size: 0.15, color: '#818cf8' },
        { text: 'Tree', pos: [4.8, 0.5, -0.5], size: 0.14, color: '#fb7185' },
        { text: 'DP', pos: [0, 3.5, -1.5], size: 0.17, color: '#a78bfa' },
        { text: 'Greedy', pos: [-3.5, -3, -0.5], size: 0.12, color: '#34d399' },
        { text: 'Sort', pos: [3, 3, -1], size: 0.13, color: '#60a5fa' },
    ];

    useFrame(({ clock }) => {
        if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.015;
    });

    return (
        <group ref={ref}>
            {concepts.map((c, i) => (
                <Text
                    key={i}
                    position={c.pos}
                    fontSize={c.size}
                    color={c.color}
                    anchorX="center"
                    anchorY="middle"
                    fillOpacity={0.18}
                >
                    {c.text}
                </Text>
            ))}
        </group>
    );
}

/* ─── Hexagonal Grid Floor ─── */
function HexGrid() {
    const ref = useRef();

    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.material.opacity = 0.025 + Math.sin(clock.elapsedTime * 0.4) * 0.01;
        }
    });

    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
            <planeGeometry args={[30, 30, 60, 60]} />
            <meshBasicMaterial
                color="#6366f1"
                wireframe
                transparent
                opacity={0.03}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </mesh>
    );
}

/* ─── Energy Waves — expanding rings ─── */
function EnergyWaves() {
    const waves = [useRef(), useRef(), useRef()];

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        waves.forEach((w, i) => {
            if (!w.current) return;
            const progress = ((t * 0.3 + i * 0.33) % 1);
            const scale = 0.5 + progress * 4;
            w.current.scale.set(scale, scale, scale);
            w.current.material.opacity = 0.08 * (1 - progress);
        });
    });

    return (
        <group position={[0, 0.3, 0]}>
            {waves.map((ref, i) => (
                <mesh key={i} ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.95, 1, 64]} />
                    <meshBasicMaterial
                        color="#a78bfa"
                        transparent opacity={0.06}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}
        </group>
    );
}

/* ─── Mouse-interactive rotation container ─── */
function SceneGroup({ children, mouse }) {
    const ref = useRef();

    useFrame(() => {
        if (!ref.current) return;
        // Smooth follow mouse
        const targetX = mouse.current.y * 0.15;
        const targetY = mouse.current.x * 0.3;
        ref.current.rotation.x += (targetX - ref.current.rotation.x) * 0.03;
        ref.current.rotation.y += (targetY - ref.current.rotation.y) * 0.03;
    });

    return <group ref={ref}>{children}</group>;
}

/* ═══════════════════════════════════════════════ */
/*                 MAIN EXPORT                     */
/* ═══════════════════════════════════════════════ */

export default function Hero3DScene() {
    const mouse = useRef({ x: 0, y: 0 });
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouse.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouse.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    return (
        <div
            onMouseMove={handleMouseMove}
            style={{
                width: '100%', height: '100%',
                position: 'absolute', top: 0, left: 0,
                zIndex: 1, pointerEvents: 'auto',
                borderRadius: isLight ? '24px' : '0',
                overflow: 'hidden',
                background: isLight
                    ? 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #0d1117 100%)'
                    : 'transparent',
                boxShadow: isLight
                    ? '0 8px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : 'none',
            }}
        >
            <Canvas
                camera={{ position: [0, 0.5, 7.5], fov: 45 }}
                style={{ background: 'transparent' }}
                gl={{
                    alpha: true,
                    antialias: true,
                    toneMapping: THREE.NoToneMapping,
                }}
                dpr={[1, 2]}
            >
                {/* Subtle lighting — let emissives dominate */}
                <ambientLight intensity={isLight ? 0.12 : 0.06} />
                <pointLight position={[3, 4, 4]} intensity={isLight ? 0.6 : 0.4} color="#a78bfa" />
                <pointLight position={[-3, -2, 3]} intensity={isLight ? 0.4 : 0.25} color="#60a5fa" />
                <pointLight position={[0, 3, -2]} intensity={isLight ? 0.35 : 0.2} color="#34d399" />

                <SceneGroup mouse={mouse}>
                    {/* Central Hub */}
                    <CentralHub />

                    {/* Orbiting feature nodes */}
                    {FEATURE_NODES.map((node, i) => (
                        <FeatureNode key={i} node={node} index={i} />
                    ))}

                    {/* Energy waves from center */}
                    <EnergyWaves />

                    {/* Data flow particles */}
                    <DataFlowParticles count={60} />

                    {/* Floating concepts */}
                    <FloatingConcepts />

                    {/* Grid floor */}
                    <HexGrid />
                </SceneGroup>

                {/* Background starfield (independent) */}
                <Starfield count={250} />
            </Canvas>
        </div>
    );
}