"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { SatellitePosition, latLngToVector3 } from "@/lib/satellites";

// Earth component
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(
    THREE.TextureLoader,
    "https://unpkg.com/three-globe@2.37.4/example/img/earth-blue-marble.jpg"
  );
  const bumpMap = useLoader(
    THREE.TextureLoader,
    "https://unpkg.com/three-globe@2.37.4/example/img/earth-topology.png"
  );

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0002;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial
        map={texture}
        bumpMap={bumpMap}
        bumpScale={0.02}
        specular={new THREE.Color(0x333333)}
        shininess={15}
      />
    </mesh>
  );
}

// Atmosphere glow
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[1.015, 64, 64]} />
      <meshPhongMaterial
        color={0x4fc3f7}
        transparent
        opacity={0.08}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  "Space Stations": "#ff4444",
  "Brightest": "#4fc3f7",
  "Active": "#66bb6a",
  "Starlink": "#ffd54f",
};

// Single satellite dot
function SatelliteDot({
  position,
  sat,
  isSelected,
  onClick,
}: {
  position: [number, number, number];
  sat: SatellitePosition;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = CATEGORY_COLORS[sat.category] || "#4fc3f7";

  useFrame((state) => {
    if (meshRef.current && isSelected) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} onClick={onClick}>
        <sphereGeometry args={[sat.category === "Space Stations" ? 0.015 : 0.006, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[sat.category === "Space Stations" ? 0.025 : 0.01, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
      {/* Label for selected */}
      {isSelected && (
        <Html distanceFactor={3} style={{ pointerEvents: "none" }}>
          <div
            style={{
              background: "rgba(10, 10, 15, 0.9)",
              border: "1px solid rgba(79, 195, 247, 0.4)",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#e0e0e8",
              fontSize: "12px",
              whiteSpace: "nowrap",
              backdropFilter: "blur(8px)",
              minWidth: "180px",
            }}
          >
            <div style={{ color, fontWeight: 700, marginBottom: 4 }}>{sat.name}</div>
            {sat.description && (
              <div style={{ fontSize: 11, color: "#a0a0b0", marginBottom: 4 }}>{sat.description}</div>
            )}
            <div style={{ fontSize: 10, color: "#6b6b80" }}>
              Alt: {sat.alt.toFixed(0)} km
              {sat.velocity && ` · ${(sat.velocity * 3600).toFixed(0)} km/h`}
            </div>
            <div style={{ fontSize: 10, color: "#6b6b80" }}>
              {sat.lat.toFixed(2)}°, {sat.lng.toFixed(2)}°
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Observer marker
function ObserverMarker({ lat, lng }: { lat: number; lng: number }) {
  const pos = latLngToVector3(lat, lng, 0);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={pos}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshBasicMaterial color="#ff9800" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color="#ff9800" transparent opacity={0.15} />
      </mesh>
      <Html distanceFactor={3} style={{ pointerEvents: "none" }}>
        <div style={{ color: "#ff9800", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
          📍 You
        </div>
      </Html>
    </group>
  );
}

// All satellites
function Satellites({
  satellites,
  selectedId,
  onSelect,
}: {
  satellites: SatellitePosition[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <>
      {satellites.map((sat) => {
        const pos = latLngToVector3(sat.lat, sat.lng, sat.alt);
        return (
          <SatelliteDot
            key={sat.id}
            position={pos}
            sat={sat}
            isSelected={selectedId === sat.id}
            onClick={() => onSelect(selectedId === sat.id ? null : sat.id)}
          />
        );
      })}
    </>
  );
}

// Scene
function Scene({
  satellites,
  selectedId,
  onSelect,
  observerLat,
  observerLng,
}: {
  satellites: SatellitePosition[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  observerLat: number | null;
  observerLng: number | null;
}) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} />
      <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />
      <Earth />
      <Atmosphere />
      <Satellites satellites={satellites} selectedId={selectedId} onSelect={onSelect} />
      {observerLat !== null && observerLng !== null && (
        <ObserverMarker lat={observerLat} lng={observerLng} />
      )}
      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={8}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />
    </>
  );
}

export default function Globe({
  satellites,
  selectedId,
  onSelect,
  observerLat,
  observerLng,
}: {
  satellites: SatellitePosition[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  observerLat: number | null;
  observerLng: number | null;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 45 }}
      style={{ background: "#0a0a0f" }}
      gl={{ antialias: true, alpha: false }}
    >
      <Scene
        satellites={satellites}
        selectedId={selectedId}
        onSelect={onSelect}
        observerLat={observerLat}
        observerLng={observerLng}
      />
    </Canvas>
  );
}
