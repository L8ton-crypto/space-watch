"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  SatelliteData,
  SatellitePosition,
  fetchTLEData,
  getSatellitePosition,
  isVisibleFrom,
} from "@/lib/satellites";
import { getOrbitTrail, OrbitPoint } from "@/lib/orbits";
import { enableAudio, disableAudio, playPassTone, playAmbient } from "@/lib/audio";
import SidePanel from "@/components/SidePanel";

const CATEGORY_COLORS: Record<string, string> = {
  "Space Stations": "#ff4444",
  Brightest: "#4fc3f7",
  Active: "#66bb6a",
  Starlink: "#ffd54f",
};

const Globe = dynamic(() => import("@/components/Globe"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0f",
        color: "#4fc3f7",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 56 }} className="glow-pulse">🌍</div>
      <div style={{ fontSize: 14, color: "#6b6b80" }}>Loading SpaceWatch...</div>
      <div style={{ fontSize: 11, color: "#4a4a5a" }}>Scanning orbital data</div>
    </div>
  ),
});

export default function Home() {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [positions, setPositions] = useState<SatellitePosition[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [observerLat, setObserverLat] = useState<number | null>(null);
  const [observerLng, setObserverLng] = useState<number | null>(null);
  const [nearbySatellites, setNearbySatellites] = useState<SatellitePosition[]>([]);
  const [orbitTrail, setOrbitTrail] = useState<OrbitPoint[]>([]);
  const [orbitColor, setOrbitColor] = useState("#4fc3f7");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const prevNearbyRef = useRef<Set<string>>(new Set());

  // Fetch TLE data
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchTLEData();
        setSatellites(data);
      } catch (err) {
        console.error("Failed to fetch satellite data:", err);
      }
      setIsLoading(false);
    }
    load();
    const interval = setInterval(load, 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update positions every 30 seconds
  useEffect(() => {
    if (satellites.length === 0) return;

    function updatePositions() {
      const now = new Date();
      const newPositions: SatellitePosition[] = [];

      for (const sat of satellites) {
        const pos = getSatellitePosition(sat, now);
        if (pos) newPositions.push(pos);
      }

      setPositions(newPositions);

      if (observerLat !== null && observerLng !== null) {
        const nearby = newPositions
          .filter((p) => isVisibleFrom(p, observerLat, observerLng, 1500))
          .sort((a, b) => a.alt - b.alt);
        setNearbySatellites(nearby);

        // Sonification: play tone for newly detected overhead satellites
        const currentIds = new Set(nearby.map((s) => s.id));
        for (const sat of nearby) {
          if (!prevNearbyRef.current.has(sat.id)) {
            playPassTone(sat.alt, sat.category);
          }
        }
        prevNearbyRef.current = currentIds;
      }
    }

    updatePositions();
    const interval = setInterval(updatePositions, 5000);
    return () => clearInterval(interval);
  }, [satellites, observerLat, observerLng]);

  // Ambient sound loop
  useEffect(() => {
    if (!audioEnabled) return;
    const interval = setInterval(playAmbient, 8000);
    return () => clearInterval(interval);
  }, [audioEnabled]);

  // Generate orbit trail for selected satellite
  useEffect(() => {
    if (!selectedId) {
      setOrbitTrail([]);
      return;
    }
    const sat = satellites.find((s) => s.id === selectedId);
    if (!sat) {
      setOrbitTrail([]);
      return;
    }
    const trail = getOrbitTrail(sat, new Date(), 180);
    setOrbitTrail(trail);
    setOrbitColor(CATEGORY_COLORS[sat.category] || "#4fc3f7");
  }, [selectedId, satellites]);

  const requestLocation = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setObserverLat(pos.coords.latitude);
          setObserverLng(pos.coords.longitude);
        },
        () => {
          setObserverLat(50.7236);
          setObserverLng(-3.5275);
        }
      );
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const toggleAudio = useCallback(() => {
    if (audioEnabled) {
      disableAudio();
      setAudioEnabled(false);
    } else {
      enableAudio();
      setAudioEnabled(true);
    }
  }, [audioEnabled]);

  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      <Globe
        satellites={positions}
        nearbySatellites={nearbySatellites}
        selectedId={selectedId}
        onSelect={setSelectedId}
        observerLat={observerLat}
        observerLng={observerLng}
        orbitTrail={orbitTrail}
        orbitColor={orbitColor}
      />
      <SidePanel
        satellites={positions}
        nearbySatellites={nearbySatellites}
        selectedId={selectedId}
        onSelect={setSelectedId}
        totalCount={positions.length}
        isLoading={isLoading}
        observerLat={observerLat}
        observerLng={observerLng}
        onRequestLocation={requestLocation}
        audioEnabled={audioEnabled}
        onToggleAudio={toggleAudio}
      />
    </main>
  );
}
