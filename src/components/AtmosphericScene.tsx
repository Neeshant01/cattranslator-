import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function FloatingShard({
  position,
  rotationSpeed,
}: {
  position: [number, number, number];
  rotationSpeed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scale = useMemo(() => 0.3 + Math.random() * 0.7, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.y = t * rotationSpeed * 0.2;
    meshRef.current.rotation.x = t * rotationSpeed * 0.1;
    meshRef.current.position.y = position[1] + Math.sin(t * 0.5 + position[0]) * 0.3;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <boxGeometry args={[1, 1, 0.1]} />
      <meshPhysicalMaterial
        transmission={0.95}
        roughness={0.1}
        thickness={1.5}
        clearcoat={1}
        ior={1.9}
        color={new THREE.Color(0.1, 0.3, 0.4)}
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}

function ShardsField() {
  const shards = useMemo(() => {
    const items: { pos: [number, number, number]; speed: number }[] = [];
    for (let i = 0; i < 40; i++) {
      items.push({
        pos: [
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20 - 5,
        ],
        speed: 0.2 + Math.random() * 0.8,
      });
    }
    return items;
  }, []);

  return (
    <>
      {shards.map((shard, i) => (
        <FloatingShard key={i} position={shard.pos} rotationSpeed={shard.speed} />
      ))}
    </>
  );
}

function CameraRig() {
  const { camera, pointer } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    target.current.x += (pointer.x * 0.1 - target.current.x) * 0.05;
    target.current.y += (pointer.y * 0.1 - target.current.y) * 0.05;
    camera.lookAt(target.current);
  });

  return null;
}

function BackgroundSphere() {
  return (
    <mesh>
      <sphereGeometry args={[50, 32, 32]} />
      <meshBasicMaterial
        color={new THREE.Color("#080818")}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function FogEffect() {
  const { scene } = useThree();

  useMemo(() => {
    scene.fog = new THREE.FogExp2("#050510", 0.02);
  }, [scene]);

  return null;
}

function PostProcessingPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { pointer, size } = useThree();

  const uniforms = useMemo(
    () => ({
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uMouse.value.x +=
        (pointer.x * 0.5 + 0.5 - materialRef.current.uniforms.uMouse.value.x) * 0.05;
      materialRef.current.uniforms.uMouse.value.y +=
        (pointer.y * 0.5 + 0.5 - materialRef.current.uniforms.uMouse.value.y) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -10]}>
      <planeGeometry args={[100, 100]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec2 uMouse;
          uniform vec2 uResolution;
          varying vec2 vUv;

          void main() {
            vec2 uv = vUv;
            float dist = distance(uv, uMouse);
            float light = 0.02 / (dist + 0.01);
            vec3 color = vec3(0.02, 0.08, 0.12);
            color += vec3(0.1, 0.4, 0.3) * light * 0.3;
            float noise = (fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.015;
            color += noise;
            gl_FragColor = vec4(color, 1.0);
          }
        `}
        transparent
      />
    </mesh>
  );
}

export default function AtmosphericScene() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <FogEffect />
        <BackgroundSphere />
        <ambientLight intensity={0.15} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#33ff99" />
        <pointLight position={[-5, -3, 3]} intensity={0.3} color="#33ccdd" />
        <ShardsField />
        <CameraRig />
        <PostProcessingPlane />
      </Canvas>
    </div>
  );
}
