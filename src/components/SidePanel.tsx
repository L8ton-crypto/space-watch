"use client";

import { SatellitePosition } from "@/lib/satellites";
import { enableAudio, disableAudio, isAudioOn } from "@/lib/audio";
import { useState, useEffect } from "react";

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
  const icon = CATEGORY_ICONS[sat.category] || "🛰️";

  return (
    <button
      onClick={onClick}
      className="sat-card"
      style={{
        width: "100%",
        textAlign: "left" as const,
        padding: "10px 12px",
        borderRadius: "10px",
        border: isSelected ? `1px solid ${color}60` : "1px solid transparent",
        background: isSelected
          ? `linear-gradient(135deg, ${color}15, ${color}05)`
          : "rgba(18, 18, 26, 0.5)",
        marginBottom: "6px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "block",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
        <span style={{ color: "#e0e0e8", fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sat.name}
        </span>
        {isNearby && (
          <span
            style={{
              fontSize: 8,
              background: "rgba(255, 152, 0, 0.2)",
              color: "#ff9800",
              padding: "2px 6px",
              borderRadius: 4,
              fontWeight: 700,
              flexShrink: 0,
              letterSpacing: "0.5px",
            }}
          >
            OVERHEAD
          </span>
        )}
      </div>
      {sat.description && (
        <div style={{ fontSize: 11, color: "#6b6b80", marginTop: 4, lineHeight: 1.4, paddingLeft: 22 }}>
          {sat.description}
        </div>
      )}
      <div style={{ fontSize: 10, color: "#4a4a5a", marginTop: 4, paddingLeft: 22, display: "flex", gap: 8 }}>
        <span>🔺 {sat.alt.toFixed(0)} km</span>
        {sat.velocity && <span>💨 {(sat.velocity * 3600).toFixed(0)} km/h</span>}
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
  audioEnabled,
  onToggleAudio,
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
  audioEnabled: boolean;
  onToggleAudio: () => void;
}) {
  const [filter, setFilter] = useState("");
  const [showNearby, setShowNearby] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const filtered = filter
    ? satellites.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()))
    : satellites;

  const displayList = showNearby && nearbySatellites.length > 0 ? nearbySatellites : filtered;

  // Mobile bottom drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile header bar */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            padding: "12px 16px",
            background: "rgba(10, 10, 15, 0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(30, 30, 46, 0.6)",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🛰️</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e8" }}>SpaceWatch</span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={onToggleAudio}
              style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", opacity: audioEnabled ? 1 : 0.4 }}
            >
              {audioEnabled ? "🔊" : "🔇"}
            </button>
            <div style={{ fontSize: 12, color: "#4fc3f7", fontWeight: 600 }}>
              {isLoading ? "..." : totalCount} tracked
            </div>
          </div>
        </div>

        {/* Bottom drawer handle */}
        <div
          onClick={() => setDrawerOpen(!drawerOpen)}
          style={{
            position: "fixed",
            bottom: drawerOpen ? "50vh" : 0,
            left: 0,
            right: 0,
            padding: "12px 16px",
            background: "rgba(10, 10, 15, 0.92)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(79, 195, 247, 0.2)",
            zIndex: 20,
            cursor: "pointer",
            transition: "bottom 0.3s ease",
          }}
        >
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#333", margin: "0 auto 8px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#4fc3f7" }}>{totalCount}</div>
                <div style={{ fontSize: 8, color: "#6b6b80", textTransform: "uppercase" }}>Tracking</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#ff9800" }}>{nearbySatellites.length}</div>
                <div style={{ fontSize: 8, color: "#6b6b80", textTransform: "uppercase" }}>Overhead</div>
              </div>
            </div>
            <span style={{ fontSize: 10, color: "#6b6b80" }}>
              {drawerOpen ? "▼ Close" : "▲ View satellites"}
            </span>
          </div>
        </div>

        {/* Drawer content */}
        {drawerOpen && (
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: "50vh",
              background: "rgba(10, 10, 15, 0.95)",
              backdropFilter: "blur(20px)",
              zIndex: 19,
              overflowY: "auto",
              padding: "60px 16px 16px",
            }}
          >
            {/* Tabs */}
            {observerLat !== null && (
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button
                  onClick={() => setShowNearby(true)}
                  style={{
                    padding: "6px 14px",
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
                    padding: "6px 14px",
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

            {!showNearby && (
              <input
                type="text"
                placeholder="Search satellites..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(30, 30, 46, 0.8)",
                  background: "rgba(18, 18, 26, 0.8)",
                  color: "#e0e0e8",
                  fontSize: 13,
                  outline: "none",
                  marginBottom: 10,
                }}
              />
            )}

            {displayList.map((sat) => (
              <SatelliteCard
                key={sat.id}
                sat={sat}
                isSelected={selectedId === sat.id}
                isNearby={nearbySatellites.some((n) => n.id === sat.id)}
                onClick={() => {
                  onSelect(selectedId === sat.id ? null : sat.id);
                  setDrawerOpen(false);
                }}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  // Desktop side panel
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "360px",
        height: "100vh",
        background: "rgba(10, 10, 15, 0.88)",
        backdropFilter: "blur(20px)",
        borderLeft: "1px solid rgba(30, 30, 46, 0.5)",
        display: "flex",
        flexDirection: "column",
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>🛰️</span>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#e0e0e8", margin: 0 }}>SpaceWatch</h1>
          </div>
          <button
            onClick={onToggleAudio}
            style={{
              background: audioEnabled ? "rgba(79, 195, 247, 0.15)" : "rgba(30, 30, 46, 0.6)",
              border: "none",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.2s",
            }}
            title={audioEnabled ? "Mute sonification" : "Enable sonification"}
          >
            {audioEnabled ? "🔊" : "🔇"}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div
            style={{
              background: "linear-gradient(135deg, rgba(79, 195, 247, 0.12), rgba(79, 195, 247, 0.04))",
              borderRadius: 8,
              padding: "8px 12px",
              flex: 1,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "#4fc3f7" }}>
              {isLoading ? "..." : totalCount}
            </div>
            <div style={{ fontSize: 9, color: "#6b6b80", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Tracking
            </div>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, rgba(255, 152, 0, 0.12), rgba(255, 152, 0, 0.04))",
              borderRadius: 8,
              padding: "8px 12px",
              flex: 1,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "#ff9800" }}>
              {nearbySatellites.length}
            </div>
            <div style={{ fontSize: 9, color: "#6b6b80", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Overhead
            </div>
          </div>
        </div>

        {/* Location */}
        {observerLat === null ? (
          <button
            onClick={onRequestLocation}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: "1px solid rgba(255, 152, 0, 0.3)",
              background: "rgba(255, 152, 0, 0.08)",
              color: "#ff9800",
              fontSize: 12,
              cursor: "pointer",
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            📍 Enable location to see what's above you
          </button>
        ) : (
          <div style={{ fontSize: 10, color: "#6b6b80", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <span>📍</span>
            {Math.abs(observerLat).toFixed(2)}°{observerLat >= 0 ? "N" : "S"},{" "}
            {Math.abs(observerLng ?? 0).toFixed(2)}°{(observerLng ?? 0) >= 0 ? "E" : "W"}
          </div>
        )}

        {/* Tabs */}
        {observerLat !== null && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button
              onClick={() => setShowNearby(true)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "none",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                background: showNearby ? "rgba(255, 152, 0, 0.2)" : "rgba(30, 30, 46, 0.6)",
                color: showNearby ? "#ff9800" : "#6b6b80",
                transition: "all 0.2s",
              }}
            >
              Above Me ({nearbySatellites.length})
            </button>
            <button
              onClick={() => setShowNearby(false)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "none",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                background: !showNearby ? "rgba(79, 195, 247, 0.2)" : "rgba(30, 30, 46, 0.6)",
                color: !showNearby ? "#4fc3f7" : "#6b6b80",
                transition: "all 0.2s",
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
              padding: "9px 12px",
              borderRadius: 8,
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
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#6b6b80" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }} className="glow-pulse">🛰️</div>
            <div style={{ fontSize: 13 }}>Scanning the skies...</div>
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
          borderTop: "1px solid rgba(30, 30, 46, 0.4)",
          fontSize: 10,
          color: "#3a3a4a",
          textAlign: "center",
        }}
      >
        Data from CelesTrak · Updated every 30s · Built by Arc Forge ⚡
      </div>
    </div>
  );
}
