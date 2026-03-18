"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import {
  SatelliteData,
  SatellitePosition,
  fetchTLEData,
  getSatellitePosition,
  isVisibleFrom,
} from "@/lib/satellites";
import SidePanel from "@/components/SidePanel";

// Dynamic import for Globe (needs WebGL)
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
      <div style={{ fontSize: 48 }}>🌍</div>
      <div style={{ fontSize: 14, opacity: 0.6 }}>Loading SpaceWatch...</div>
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

    // Refresh TLE data every 2 hours
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

      // Update nearby
      if (observerLat !== null && observerLng !== null) {
        const nearby = newPositions
          .filter((p) => isVisibleFrom(p, observerLat, observerLng, 1500))
          .sort((a, b) => a.alt - b.alt);
        setNearbySatellites(nearby);
      }
    }

    updatePositions();
    const interval = setInterval(updatePositions, 30000);
    return () => clearInterval(interval);
  }, [satellites, observerLat, observerLng]);

  // Request geolocation
  const requestLocation = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setObserverLat(pos.coords.latitude);
          setObserverLng(pos.coords.longitude);
        },
        (err) => {
          console.warn("Location denied:", err);
          // Default to London
          setObserverLat(50.7236);
          setObserverLng(-3.5275);
        }
      );
    }
  }, []);

  // Auto-request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Globe
        satellites={positions}
        selectedId={selectedId}
        onSelect={setSelectedId}
        observerLat={observerLat}
        observerLng={observerLng}
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
      />
    </main>
  );
}
