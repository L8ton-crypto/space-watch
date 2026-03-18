"use client";

import { SatellitePosition } from "@/lib/satellites";
import { useState, useEffect } from "react";

const CATEGORY_COLORS: Record<string, string> = {
  "Space Stations": "#ff4444",
  Brightest: "#4fc3f7",
  Active: "#66bb6a",
  Starlink: "#ffd54f",
};

function getSatIcon(name: string, category: string): string {
  const upper = name.toUpperCase();
  if (upper === "ISS (ZARYA)") return "🚀";
  if (upper.includes("ISS OBJECT") || upper.includes("ISS DEB")) return "🗑️";
  if (upper.startsWith("ISS") && !upper.includes("ISIS")) return "🚀";
  if (upper.includes("TIANGONG") || upper.includes("CSS (")) return "🏗️";
  if (upper.includes("TIANZHOU")) return "📦";
  if (upper.includes("SHENZHOU")) return "🚀";
  if (upper.includes("SOYUZ")) return "🚀";
  if (upper.includes("PROGRESS")) return "📦";
  if (upper.includes("CREW DRAGON")) return "🚀";
  if (upper.includes("HUBBLE") || upper.includes("HST")) return "🔭";
  if (upper.includes("JWST") || upper.includes("JAMES WEBB")) return "🔭";
  if (upper.includes("XRISM") || upper.includes("HITOMI")) return "🔭";
  if (upper.includes("STARLINK")) return "📶";
  if (upper.includes("ONEWEB")) return "📶";
  if (upper.includes("IRIDIUM")) return "📡";
  if (upper.includes("GPS") || upper.includes("GALILEO") || upper.includes("BEIDOU") || upper.includes("GLONASS")) return "🧭";
  if (upper.includes("NOAA") || upper.includes("GOES") || upper.includes("METEO")) return "🌤️";
  if (upper.includes("R/B")) return "🗑️";
  if (upper.includes("DEB")) return "🗑️";
  const CATEGORY_ICONS: Record<string, string> = {
    "Space Stations": "🛰️",
    Brightest: "🛰️",
    Active: "📡",
    Starlink: "⭐",
  };
  return CATEGORY_ICONS[category] || "🛰️";
}

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
  const icon = getSatIcon(sat.name, sat.category);

  return (
    <button
      onClick={onClick}
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

const ALL_CATEGORIES = [
  { key: "Space Stations", label: "Stations", icon: "🚀", color: "#ff4444" },
  { key: "Brightest", label: "Brightest", icon: "🛰️", color: "#4fc3f7" },
  { key: "Active", label: "Active", icon: "📡", color: "#66bb6a" },
  { key: "Starlink", label: "Starlink", icon: "📶", color: "#ffd54f" },
];

// Shared list content
function PanelContent({
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
  activeCategories,
  onToggleCategory,
  searchQuery,
  onSearchChange,
  onClose,
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
  activeCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onClose?: () => void;
}) {
  const [showNearby, setShowNearby] = useState(true);

  const displayList = showNearby && nearbySatellites.length > 0 ? nearbySatellites : satellites;

  return (
    <>
      {/* Header */}
      <div style={{ padding: "20px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>🛰️</span>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#e0e0e8", margin: 0 }}>SpaceWatch</h1>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={onToggleAudio}
              style={{
                background: audioEnabled ? "rgba(79, 195, 247, 0.15)" : "rgba(30, 30, 46, 0.6)",
                border: "none",
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: 14,
              }}
              title={audioEnabled ? "Mute" : "Enable sound"}
            >
              {audioEnabled ? "🔊" : "🔇"}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: "rgba(30, 30, 46, 0.6)",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#6b6b80",
                }}
              >
                ✕
              </button>
            )}
          </div>
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
            📍 Enable location to see what&apos;s above you
          </button>
        ) : (
          <div style={{ fontSize: 10, color: "#6b6b80", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <span>📍</span>
            {Math.abs(observerLat).toFixed(2)}°{observerLat >= 0 ? "N" : "S"},{" "}
            {Math.abs(observerLng ?? 0).toFixed(2)}°{(observerLng ?? 0) >= 0 ? "E" : "W"}
          </div>
        )}

        {/* Search - always visible */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 32px",
              borderRadius: 8,
              border: "1px solid rgba(30, 30, 46, 0.8)",
              background: "rgba(18, 18, 26, 0.8)",
              color: "#e0e0e8",
              fontSize: 12,
              outline: "none",
            }}
          />
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, opacity: 0.4 }}>
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#6b6b80",
                fontSize: 12,
                cursor: "pointer",
                padding: "2px 4px",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Category filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {ALL_CATEGORIES.map((cat) => {
            const active = activeCategories.has(cat.key);
            return (
              <button
                key={cat.key}
                onClick={() => onToggleCategory(cat.key)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 16,
                  border: `1px solid ${active ? cat.color + "50" : "rgba(30, 30, 46, 0.6)"}`,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: active ? cat.color + "20" : "rgba(30, 30, 46, 0.4)",
                  color: active ? cat.color : "#4a4a5a",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 11 }}>{cat.icon}</span>
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Tabs: Above Me / All */}
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
            {searchQuery ? "No matches found" : "No satellites in this view"}
          </div>
        ) : (
          displayList.map((sat) => (
            <SatelliteCard
              key={sat.id}
              sat={sat}
              isSelected={selectedId === sat.id}
              isNearby={nearbySatellites.some((n) => n.id === sat.id)}
              onClick={() => {
                onSelect(selectedId === sat.id ? null : sat.id);
                if (onClose) onClose();
              }}
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
        Data from CelesTrak · Updated every 5s · Built by Arc Forge ⚡
      </div>
    </>
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
  activeCategories,
  onToggleCategory,
  searchQuery,
  onSearchChange,
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
  activeCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Mobile: hamburger + slide-in side menu
  if (isMobile) {
    return (
      <>
        {/* Top bar with hamburger */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            padding: "10px 14px",
            background: "rgba(10, 10, 15, 0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(30, 30, 46, 0.6)",
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                background: "none",
                border: "none",
                color: "#e0e0e8",
                fontSize: 20,
                cursor: "pointer",
                padding: "4px 6px",
                lineHeight: 1,
              }}
            >
              ☰
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e8" }}>🛰️ SpaceWatch</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={onToggleAudio}
              style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", opacity: audioEnabled ? 1 : 0.4 }}
            >
              {audioEnabled ? "🔊" : "🔇"}
            </button>
            <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
              <span style={{ color: "#4fc3f7", fontWeight: 700 }}>{totalCount}</span>
              <span style={{ color: "#6b6b80" }}>tracked</span>
              {nearbySatellites.length > 0 && (
                <>
                  <span style={{ color: "#ff9800", fontWeight: 700 }}>{nearbySatellites.length}</span>
                  <span style={{ color: "#6b6b80" }}>overhead</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Backdrop */}
        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 49,
            }}
          />
        )}

        {/* Slide-in side menu from left */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "85vw",
            maxWidth: "340px",
            height: "100vh",
            background: "rgba(10, 10, 15, 0.95)",
            backdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(30, 30, 46, 0.6)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s ease",
          }}
        >
          <PanelContent
            satellites={satellites}
            nearbySatellites={nearbySatellites}
            selectedId={selectedId}
            onSelect={onSelect}
            totalCount={totalCount}
            isLoading={isLoading}
            observerLat={observerLat}
            observerLng={observerLng}
            onRequestLocation={onRequestLocation}
            audioEnabled={audioEnabled}
            onToggleAudio={onToggleAudio}
            activeCategories={activeCategories}
            onToggleCategory={onToggleCategory}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onClose={() => setMenuOpen(false)}
          />
        </div>
      </>
    );
  }

  // Desktop: side panel
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
      <PanelContent
        satellites={satellites}
        nearbySatellites={nearbySatellites}
        selectedId={selectedId}
        onSelect={onSelect}
        totalCount={totalCount}
        isLoading={isLoading}
        observerLat={observerLat}
        observerLng={observerLng}
        onRequestLocation={onRequestLocation}
        audioEnabled={audioEnabled}
        onToggleAudio={onToggleAudio}
        activeCategories={activeCategories}
        onToggleCategory={onToggleCategory}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
    </div>
  );
}

