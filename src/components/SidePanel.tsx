"use client";

import { SatellitePosition } from "@/lib/satellites";
import { useState } from "react";

const CATEGORY_COLORS: Record<string, string> = {
  "Space Stations": "#ff4444",
  "Brightest": "#4fc3f7",
  "Active": "#66bb6a",
  "Starlink": "#ffd54f",
};

function SatelliteCard({
  sat,
  isSelected,
  isNearby,
  onClick,
}: {
  sat: SatellitePosition;
  isSelected: boolean;
  isNearby: boolean;
  onClick: () => void;
}) {
  const color = CATEGORY_COLORS[sat.category] || "#4fc3f7";

  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-200"
      style={{
        padding: "10px 12px",
        borderRadius: "8px",
        border: isSelected ? `1px solid ${color}` : "1px solid transparent",
        background: isSelected ? "rgba(79, 195, 247, 0.08)" : "rgba(18, 18, 26, 0.6)",
        marginBottom: "6px",
        cursor: "pointer",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 6px ${color}`,
            flexShrink: 0,
          }}
        />
        <span style={{ color: "#e0e0e8", fontSize: 13, fontWeight: 600 }}>
          {sat.name}
        </span>
        {isNearby && (
          <span
            style={{
              fontSize: 9,
              background: "rgba(255, 152, 0, 0.2)",
              color: "#ff9800",
              padding: "1px 6px",
              borderRadius: 4,
              marginLeft: "auto",
              fontWeight: 600,
            }}
          >
            OVERHEAD
          </span>
        )}
      </div>
      {sat.description && (
        <div style={{ fontSize: 11, color: "#6b6b80", marginTop: 4, lineHeight: 1.4 }}>
          {sat.description}
        </div>
      )}
      <div style={{ fontSize: 10, color: "#4a4a5a", marginTop: 4 }}>
        {sat.alt.toFixed(0)} km · {sat.lat.toFixed(1)}° {sat.lat >= 0 ? "N" : "S"},{" "}
        {sat.lng.toFixed(1)}° {sat.lng >= 0 ? "E" : "W"}
        {sat.velocity && ` · ${(sat.velocity * 3600).toFixed(0)} km/h`}
      </div>
    </button>
  );
}

export default function SidePanel({
  satellites,
  nearbySatellites,
  selectedId,
  onSelect,
  totalCount,
  isLoading,
  observerLat,
  observerLng,
  onRequestLocation,
}: {
  satellites: SatellitePosition[];
  nearbySatellites: SatellitePosition[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  totalCount: number;
  isLoading: boolean;
  observerLat: number | null;
  observerLng: number | null;
  onRequestLocation: () => void;
}) {
  const [filter, setFilter] = useState("");
  const [showNearby, setShowNearby] = useState(true);

  const filtered = filter
    ? satellites.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()))
    : satellites;

  const displayList = showNearby && nearbySatellites.length > 0 ? nearbySatellites : filtered;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "340px",
        height: "100vh",
        background: "rgba(10, 10, 15, 0.85)",
        backdropFilter: "blur(20px)",
        borderLeft: "1px solid rgba(30, 30, 46, 0.6)",
        display: "flex",
        flexDirection: "column",
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 16px 12px" }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🛰️</span>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#e0e0e8" }}>SpaceWatch</h1>
        </div>

        {/* Stats */}
        <div className="flex gap-3" style={{ marginBottom: 12 }}>
          <div
            style={{
              background: "rgba(79, 195, 247, 0.1)",
              borderRadius: 6,
              padding: "6px 10px",
              flex: 1,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: "#4fc3f7" }}>
              {isLoading ? "..." : totalCount}
            </div>
            <div style={{ fontSize: 9, color: "#6b6b80", textTransform: "uppercase" }}>Tracking</div>
          </div>
          <div
            style={{
              background: "rgba(255, 152, 0, 0.1)",
              borderRadius: 6,
              padding: "6px 10px",
              flex: 1,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ff9800" }}>
              {nearbySatellites.length}
            </div>
            <div style={{ fontSize: 9, color: "#6b6b80", textTransform: "uppercase" }}>Overhead</div>
          </div>
        </div>

        {/* Location */}
        {observerLat === null ? (
          <button
            onClick={onRequestLocation}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: 6,
              border: "1px solid rgba(255, 152, 0, 0.3)",
              background: "rgba(255, 152, 0, 0.1)",
              color: "#ff9800",
              fontSize: 12,
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            📍 Enable location to see what's above you
          </button>
        ) : (
          <div style={{ fontSize: 10, color: "#6b6b80", marginBottom: 12 }}>
            📍 {observerLat.toFixed(2)}°N, {observerLng?.toFixed(2)}°W
          </div>
        )}

        {/* Tabs */}
        {observerLat !== null && (
          <div className="flex gap-2" style={{ marginBottom: 10 }}>
            <button
              onClick={() => setShowNearby(true)}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                border: "none",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                background: showNearby ? "rgba(255, 152, 0, 0.2)" : "rgba(30, 30, 46, 0.6)",
                color: showNearby ? "#ff9800" : "#6b6b80",
              }}
            >
              Above Me ({nearbySatellites.length})
            </button>
            <button
              onClick={() => setShowNearby(false)}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                border: "none",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                background: !showNearby ? "rgba(79, 195, 247, 0.2)" : "rgba(30, 30, 46, 0.6)",
                color: !showNearby ? "#4fc3f7" : "#6b6b80",
              }}
            >
              All ({totalCount})
            </button>
          </div>
        )}

        {/* Search */}
        {!showNearby && (
          <input
            type="text"
            placeholder="Search satellites..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid rgba(30, 30, 46, 0.8)",
              background: "rgba(18, 18, 26, 0.8)",
              color: "#e0e0e8",
              fontSize: 12,
              outline: "none",
            }}
          />
        )}
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 16px 16px",
        }}
      >
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#6b6b80" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🛰️</div>
            <div>Scanning the skies...</div>
          </div>
        ) : displayList.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#6b6b80", fontSize: 12 }}>
            {filter ? "No matches found" : "No satellites overhead right now"}
          </div>
        ) : (
          displayList.map((sat) => (
            <SatelliteCard
              key={sat.id}
              sat={sat}
              isSelected={selectedId === sat.id}
              isNearby={nearbySatellites.some((n) => n.id === sat.id)}
              onClick={() => onSelect(selectedId === sat.id ? null : sat.id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid rgba(30, 30, 46, 0.6)",
          fontSize: 10,
          color: "#4a4a5a",
          textAlign: "center",
        }}
      >
        Data from CelesTrak · Updated every 30s · Built by Arc Forge
      </div>
    </div>
  );
}
