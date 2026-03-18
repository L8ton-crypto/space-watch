"use client";

import { useState, useCallback } from "react";

// Format offset to human-readable
function formatOffset(offsetMs: number): string {
  if (offsetMs === 0) return "NOW";

  const sign = offsetMs > 0 ? "+" : "-";
  const abs = Math.abs(offsetMs);
  const mins = Math.floor(abs / 60000);
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;

  if (hours > 0) {
    return `${sign}${hours}h ${remainMins}m`;
  }
  return `${sign}${mins}m`;
}

// Format time to HH:MM
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TimeScrubber({
  offsetMs,
  onOffsetChange,
  isMobile,
}: {
  offsetMs: number;
  onOffsetChange: (ms: number) => void;
  isMobile: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  // Range: -6 hours to +6 hours
  const maxMs = 6 * 60 * 60 * 1000;
  const simTime = new Date(Date.now() + offsetMs);

  const handleReset = useCallback(() => {
    onOffsetChange(0);
  }, [onOffsetChange]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: isMobile ? 8 : 16,
        left: isMobile ? 8 : "50%",
        right: isMobile ? 8 : "auto",
        transform: isMobile ? "none" : "translateX(-50%)",
        width: isMobile ? "auto" : "min(500px, 60vw)",
        background: "rgba(10, 10, 15, 0.9)",
        backdropFilter: "blur(16px)",
        borderRadius: 14,
        border: `1px solid ${offsetMs !== 0 ? "rgba(79, 195, 247, 0.3)" : "rgba(30, 30, 46, 0.6)"}`,
        padding: "10px 16px",
        zIndex: 20,
        transition: "border-color 0.3s",
      }}
    >
      {/* Time display */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#6b6b80" }}>⏱️</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: offsetMs === 0 ? "#4caf50" : "#4fc3f7",
              fontFamily: "monospace",
            }}
          >
            {formatTime(simTime)}
          </span>
          <span
            style={{
              fontSize: 11,
              color: offsetMs === 0 ? "#4caf50" : "#ff9800",
              fontWeight: 600,
              background: offsetMs === 0 ? "rgba(76, 175, 80, 0.15)" : "rgba(255, 152, 0, 0.15)",
              padding: "1px 8px",
              borderRadius: 10,
            }}
          >
            {formatOffset(offsetMs)}
          </span>
        </div>
        {offsetMs !== 0 && (
          <button
            onClick={handleReset}
            style={{
              background: "rgba(76, 175, 80, 0.15)",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              borderRadius: 6,
              padding: "3px 10px",
              color: "#4caf50",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            LIVE
          </button>
        )}
      </div>

      {/* Slider */}
      <div style={{ position: "relative" }}>
        <input
          type="range"
          min={-maxMs}
          max={maxMs}
          value={offsetMs}
          onChange={(e) => onOffsetChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          style={{
            width: "100%",
            height: 4,
            appearance: "none",
            WebkitAppearance: "none",
            background: `linear-gradient(to right, 
              rgba(79, 195, 247, 0.3) 0%, 
              rgba(79, 195, 247, 0.6) ${((offsetMs + maxMs) / (2 * maxMs)) * 100}%, 
              rgba(30, 30, 46, 0.6) ${((offsetMs + maxMs) / (2 * maxMs)) * 100}%, 
              rgba(30, 30, 46, 0.6) 100%)`,
            borderRadius: 2,
            outline: "none",
            cursor: "pointer",
          }}
        />
        {/* Time labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
            fontSize: 9,
            color: "#4a4a5a",
          }}
        >
          <span>-6h</span>
          <span>-3h</span>
          <span style={{ color: offsetMs === 0 ? "#4caf50" : "#4a4a5a" }}>now</span>
          <span>+3h</span>
          <span>+6h</span>
        </div>
      </div>
    </div>
  );
}
