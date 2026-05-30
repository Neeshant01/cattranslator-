import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface OrbitalRingsProps {
  isRecording?: boolean;
  audioData: number[];
  emotion: string;
}

function Ring({
  radius,
  rotationSpeed,
  audioData,
  index,
}: {
  radius: number;
  rotationSpeed: [number, number, number];
  audioData: number[];
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseScale = useRef(1);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += rotationSpeed[0] * 0.01;
    meshRef.current.rotation.y += rotationSpeed[1] * 0.01;
    meshRef.current.rotation.z += rotationSpeed[2] * 0.01;

    if (audioData.length > 0) {
      const freqIndex = Math.min(index * 3, audioData.length - 1);
      const norm = audioData[freqIndex] / 255;
      const targetScale = 1 + norm * 0.5;
      baseScale.current += (targetScale - baseScale.current) * 0.1;
      meshRef.current.scale.setScalar(baseScale.current);
    } else {
      baseScale.current += (1 - baseScale.current) * 0.05;
      meshRef.current.scale.setScalar(baseScale.current);
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[radius, 0.02, 16, 100]} />
      <meshBasicMaterial
        color={new THREE.Color("#33ff99")}
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

function EmotionText({ emotion }: { emotion: string }) {
  const textRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(1);

  useFrame(({ clock }) => {
    if (!textRef.current) return;
    const time = clock.getElapsedTime();
    const pulse = 1 + Math.sin(time * 3) * 0.05;
    scaleRef.current += (pulse - scaleRef.current) * 0.1;
    textRef.current.scale.setScalar(scaleRef.current);
  });

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "transparent";
  ctx.fillRect(0, 0, 512, 128);
  ctx.font = "bold 64px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#33ff99";
  ctx.fillText(emotion.toUpperCase(), 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  return (
    <mesh ref={textRef} position={[0, 0, 0]}>
      <planeGeometry args={[3, 0.75]} />
      <meshBasicMaterial map={texture} transparent opacity={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Scene({ audioData, emotion }: { audioData: number[]; emotion: string }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 5]} intensity={0.8} color="#33ff99" />
      <Ring radius={1.2} rotationSpeed={[0.2, 0.4, -0.1]} audioData={audioData} index={0} />
      <Ring radius={1.8} rotationSpeed={[-0.3, 0.2, 0.15]} audioData={audioData} index={1} />
      <Ring radius={2.4} rotationSpeed={[0.1, -0.3, 0.2]} audioData={audioData} index={2} />
      <EmotionText emotion={emotion} />
    </>
  );
}

export default function OrbitalRings({
  audioData,
  emotion,
}: OrbitalRingsProps) {
  return (
    <div className="w-full h-64 rounded-t-3xl overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ alpha: true }}>
        <Scene audioData={audioData} emotion={emotion} />
      </Canvas>
    </div>
  );
}
