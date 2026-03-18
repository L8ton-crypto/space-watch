"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { SatellitePosition, latLngToVector3 } from "@/lib/satellites";
import { OrbitPoint } from "@/lib/orbits";
import { playSelectTone } from "@/lib/audio";

// --- Earth with day/night textures ---
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const dayTexture = useLoader(
    THREE.TextureLoader,
    "https://unpkg.com/three-globe@2.37.4/example/img/earth-blue-marble.jpg"
  );
  const nightTexture = useLoader(
    THREE.TextureLoader,
    "https://unpkg.com/three-globe@2.37.4/example/img/earth-night.jpg"
  );
  const bumpMap = useLoader(
    THREE.TextureLoader,
    "https://unpkg.com/three-globe@2.37.4/example/img/earth-topology.png"
  );

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: dayTexture },
        nightMap: { value: nightTexture },
        bumpMap: { value: bumpMap },
        sunDirection: { value: new THREE.Vector3(5, 3, 5).normalize() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayMap;
        uniform sampler2D nightMap;
        uniform sampler2D bumpMap;
        uniform vec3 sunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          float dotProduct = dot(vNormal, sunDirection);
          float mixFactor = smoothstep(-0.15, 0.25, dotProduct);
          vec4 dayColor = texture2D(dayMap, vUv);
          vec4 nightColor = texture2D(nightMap, vUv) * 1.5;
          vec4 finalColor = mix(nightColor, dayColor, mixFactor);
          // Add slight blue tint to atmosphere edge
          float fresnel = pow(1.0 - abs(dot(vNormal, normalize(-vWorldPos))), 2.0);
          finalColor.rgb += vec3(0.1, 0.3, 0.6) * fresnel * 0.15;
          gl_FragColor = finalColor;
        }
      `,
    });
  }, [dayTexture, nightTexture, bumpMap]);

  // No rotation - satellites must stay aligned with geography

  return (
    <mesh ref={meshRef} material={shaderMaterial}>
      <sphereGeometry args={[1, 64, 64]} />
    </mesh>
  );
}

// --- Atmosphere glow ---
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[1.02, 64, 64]} />
      <meshPhongMaterial
        color={0x4fc3f7}
        transparent
        opacity={0.06}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// --- Category colors and icons ---
const CATEGORY_COLORS: Record<string, string> = {
  "Space Stations": "#ff4444",
  Brightest: "#4fc3f7",
  Active: "#66bb6a",
  Starlink: "#ffd54f",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Space Stations": "🛸",
  Brightest: "🛰️",
  Active: "📡",
  Starlink: "⭐",
};

// --- Satellite sprite with icon ---
// Occlusion: hide satellites behind the globe by checking if position
// is on the far side relative to camera
function SatelliteMarker({
  position,
  sat,
  isSelected,
  isNearby,
  onClick,
}: {
  position: [number, number, number];
  sat: SatellitePosition;
  isSelected: boolean;
  isNearby: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [occluded, setOccluded] = useState(false);
  const color = CATEGORY_COLORS[sat.category] || "#4fc3f7";
  const isStation = sat.category === "Space Stations";

  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.4;
        meshRef.current.scale.setScalar(scale);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
    if (glowRef.current && isNearby) {
      const opacity = 0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }

    // Occlusion check: is this satellite behind the Earth from camera's perspective?
    const cam = state.camera.position;
    const satPos = new THREE.Vector3(...position);
    const camToSat = satPos.clone().sub(cam);
    const camToOrigin = new THREE.Vector3().sub(cam);

    // Ray from camera to satellite - check if it intersects Earth sphere (r=1)
    const rayDir = camToSat.clone().normalize();
    const oc = cam.clone(); // origin to camera
    const a = rayDir.dot(rayDir);
    const b = 2 * oc.dot(rayDir);
    const c = oc.dot(oc) - 1.0; // Earth radius = 1
    const discriminant = b * b - 4 * a * c;

    if (discriminant > 0) {
      const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
      const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const tSat = camToSat.length();
      // If Earth intersection is closer than satellite, it's occluded
      const tMin = Math.min(t1, t2);
      setOccluded(tMin > 0 && tMin < tSat);
    } else {
      setOccluded(false);
    }
  });

  const handleClick = () => {
    if (occluded) return;
    playSelectTone();
    onClick();
  };

  return (
    <group position={position} ref={groupRef} visible={!occluded}>
      {/* Invisible hit target - much bigger for easy tapping */}
      <mesh onClick={handleClick}>
        <sphereGeometry args={[isStation ? 0.05 : 0.03, 8, 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Core dot */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[isStation ? 0.015 : 0.006, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Glow ring */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[isStation ? 0.03 : 0.012, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={isNearby ? 0.25 : 0.12} />
      </mesh>

      {/* Nearby pulse ring */}
      {isNearby && !occluded && (
        <mesh>
          <ringGeometry args={[0.02, 0.025, 16]} />
          <meshBasicMaterial color="#ff9800" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Icon label for stations or selected */}
      {(isStation || isSelected) && !occluded && (
        <Html distanceFactor={3} style={{ pointerEvents: "none" }}>
          <div style={{ fontSize: isStation ? 14 : 10, textAlign: "center", marginTop: -20 }}>
            {CATEGORY_ICONS[sat.category] || "🛰️"}
          </div>
        </Html>
      )}

      {/* Info popup for selected */}
      {isSelected && !occluded && (
        <Html distanceFactor={3} style={{ pointerEvents: "none" }}>
          <div
            style={{
              background: "rgba(10, 10, 15, 0.92)",
              border: `1px solid ${color}40`,
              borderRadius: "10px",
              padding: "10px 14px",
              color: "#e0e0e8",
              fontSize: "12px",
              whiteSpace: "nowrap",
              backdropFilter: "blur(12px)",
              minWidth: "200px",
              marginTop: 8,
              boxShadow: `0 0 20px ${color}20`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>{CATEGORY_ICONS[sat.category] || "🛰️"}</span>
              <span style={{ color, fontWeight: 700, fontSize: 13 }}>{sat.name}</span>
            </div>
            {sat.description && (
              <div style={{ fontSize: 11, color: "#a0a0b0", marginBottom: 6, lineHeight: 1.4 }}>
                {sat.description}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#6b6b80" }}>
              <span>🔺 {sat.alt.toFixed(0)} km</span>
              {sat.velocity && <span>💨 {(sat.velocity * 3600).toFixed(0)} km/h</span>}
            </div>
            <div style={{ fontSize: 10, color: "#4a4a5a", marginTop: 3 }}>
              {Math.abs(sat.lat).toFixed(2)}°{sat.lat >= 0 ? "N" : "S"},{" "}
              {Math.abs(sat.lng).toFixed(2)}°{sat.lng >= 0 ? "E" : "W"}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// --- Orbit trail line ---
function OrbitTrail({ points, color }: { points: OrbitPoint[]; color: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;
    // Clear previous
    while (groupRef.current.children.length) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);
    const col = new THREE.Color(color);

    for (let i = 0; i < points.length; i++) {
      const [x, y, z] = points[i].position;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const fade = i / points.length;
      colors[i * 3] = col.r * fade;
      colors[i * 3 + 1] = col.g * fade;
      colors[i * 3 + 2] = col.b * fade;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5 });
    const line = new THREE.Line(geo, mat);
    groupRef.current.add(line);

    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [points, color]);

  return <group ref={groupRef} />;
}

// --- Observer marker ---
function ObserverMarker({ lat, lng }: { lat: number; lng: number }) {
  const pos = latLngToVector3(lat, lng, 0);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [occluded, setOccluded] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
      meshRef.current.scale.setScalar(scale);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
      ringRef.current.scale.setScalar(scale);
    }
    // Occlusion: check if marker is on the far side
    const cam = state.camera.position;
    const markerPos = new THREE.Vector3(...pos);
    const toMarker = markerPos.clone().sub(cam).normalize();
    const toOrigin = new THREE.Vector3().sub(cam).normalize();
    // Simple: if the dot product of camera-to-marker and camera-to-origin
    // is high AND marker is further than Earth surface, it's behind
    const camDist = cam.length();
    const markerDist = markerPos.clone().sub(cam).length();
    const originDist = cam.length();
    // Use ray-sphere intersection
    const rayDir = toMarker;
    const oc = cam.clone();
    const b = 2 * oc.dot(rayDir);
    const c = oc.dot(oc) - 1.0;
    const disc = b * b - 4 * c;
    if (disc > 0) {
      const t1 = (-b - Math.sqrt(disc)) / 2;
      setOccluded(t1 > 0 && t1 < markerDist);
    } else {
      setOccluded(false);
    }
  });

  return (
    <group position={pos} visible={!occluded}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.01, 16, 16]} />
        <meshBasicMaterial color="#ff9800" />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.018, 0.022, 24]} />
        <meshBasicMaterial color="#ff9800" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {!occluded && (
        <Html distanceFactor={3} style={{ pointerEvents: "none" }}>
          <div
            style={{
              color: "#ff9800",
              fontSize: 10,
              fontWeight: 700,
              whiteSpace: "nowrap",
              textShadow: "0 0 8px rgba(255, 152, 0, 0.5)",
            }}
          >
            📍 YOU
          </div>
        </Html>
      )}
    </group>
  );
}

// --- All satellites ---
function Satellites({
  satellites,
  nearbySatellites,
  selectedId,
  onSelect,
}: {
  satellites: SatellitePosition[];
  nearbySatellites: SatellitePosition[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const nearbyIds = useMemo(() => new Set(nearbySatellites.map((s) => s.id)), [nearbySatellites]);

  return (
    <>
      {satellites.map((sat) => {
        const pos = latLngToVector3(sat.lat, sat.lng, sat.alt);
        return (
          <SatelliteMarker
            key={sat.id}
            position={pos}
            sat={sat}
            isSelected={selectedId === sat.id}
            isNearby={nearbyIds.has(sat.id)}
            onClick={() => onSelect(selectedId === sat.id ? null : sat.id)}
          />
        );
      })}
    </>
  );
}

// --- Camera fly-to controller ---
function CameraController({ flyTarget }: { flyTarget: [number, number, number] | null }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetRef = useRef<THREE.Vector3 | null>(null);
  const progressRef = useRef(0);
  const startPosRef = useRef(new THREE.Vector3());

  useEffect(() => {
    if (flyTarget) {
      // Calculate camera position: place camera looking at the target from outside
      const targetVec = new THREE.Vector3(...flyTarget).normalize();
      const camPos = targetVec.clone().multiplyScalar(2.8); // distance from origin
      startPosRef.current.copy(camera.position);
      targetRef.current = camPos;
      progressRef.current = 0;
    }
  }, [flyTarget, camera]);

  useFrame(() => {
    if (targetRef.current && progressRef.current < 1) {
      progressRef.current += 0.02;
      const t = Math.min(1, progressRef.current);
      // Smooth ease-in-out
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      camera.position.lerpVectors(startPosRef.current, targetRef.current, ease);
      camera.lookAt(0, 0, 0);

      if (t >= 1) {
        targetRef.current = null;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={1.5}
      maxDistance={8}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
    />
  );
}

// --- Scene ---
function Scene({
  satellites,
  nearbySatellites,
  selectedId,
  onSelect,
  observerLat,
  observerLng,
  orbitTrail,
  orbitColor,
  flyTarget,
}: {
  satellites: SatellitePosition[];
  nearbySatellites: SatellitePosition[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  observerLat: number | null;
  observerLng: number | null;
  orbitTrail: OrbitPoint[];
  orbitColor: string;
  flyTarget: [number, number, number] | null;
}) {
  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[5, 3, 5]} intensity={1.6} />
      <pointLight position={[-5, -3, -5]} intensity={0.1} color="#4fc3f7" />
      <Stars radius={100} depth={50} count={6000} factor={4} fade speed={0.5} />
      <Earth />
      <Atmosphere />
      <Satellites
        satellites={satellites}
        nearbySatellites={nearbySatellites}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      {orbitTrail.length > 0 && <OrbitTrail points={orbitTrail} color={orbitColor} />}
      {observerLat !== null && observerLng !== null && (
        <ObserverMarker lat={observerLat} lng={observerLng} />
      )}
      <CameraController flyTarget={flyTarget} />
    </>
  );
}

// --- Globe export ---
export default function Globe({
  satellites,
  nearbySatellites,
  selectedId,
  onSelect,
  observerLat,
  observerLng,
  orbitTrail,
  orbitColor,
  flyTarget,
}: {
  satellites: SatellitePosition[];
  nearbySatellites: SatellitePosition[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  observerLat: number | null;
  observerLng: number | null;
  orbitTrail: OrbitPoint[];
  orbitColor: string;
  flyTarget: [number, number, number] | null;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 45 }}
      style={{ background: "#0a0a0f" }}
      gl={{ antialias: true, alpha: false }}
    >
      <Scene
        satellites={satellites}
        nearbySatellites={nearbySatellites}
        selectedId={selectedId}
        onSelect={onSelect}
        observerLat={observerLat}
        observerLng={observerLng}
        orbitTrail={orbitTrail}
        orbitColor={orbitColor}
        flyTarget={flyTarget}
      />
    </Canvas>
  );
}
