import { useState, useMemo } from "react";
import { Maximize2, Eye, Sun, Footprints, ShieldCheck } from "lucide-react";

const CATEGORY_STYLES = {
  bed: { bg: "rgba(99, 102, 241, 0.22)", border: "#818cf8", text: "#e0e7ff", icon: "🛏️" },
  storage: { bg: "rgba(148, 163, 184, 0.22)", border: "#94a3b8", text: "#f1f5f9", icon: "🚪" },
  work: { bg: "rgba(245, 158, 11, 0.22)", border: "#fbbf24", text: "#fef3c7", icon: "💻" },
  seating: { bg: "rgba(16, 185, 129, 0.22)", border: "#34d399", text: "#d1fae5", icon: "🛋️" },
  table: { bg: "rgba(244, 63, 94, 0.22)", border: "#fb7185", text: "#ffe4e6", icon: "☕" },
  entertainment: { bg: "rgba(6, 182, 212, 0.22)", border: "#22d3ee", text: "#cffafe", icon: "📺" },
  default: { bg: "rgba(139, 92, 246, 0.22)", border: "#a78bfa", text: "#ede9fe", icon: "📦" }
};

function RoomCanvas({
  roomWidth = 500,
  roomHeight = 400,
  layout = [],
  furnitureCatalog = [],
  doors = [],
  windows = [],
  interactive = true
}) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showLightBeams, setShowLightBeams] = useState(true);
  const [showTrafficPaths, setShowTrafficPaths] = useState(true);
  const [showClearanceHalos, setShowClearanceHalos] = useState(false);

  // Maximum canvas viewport size
  const CANVAS_MAX_W = 760;
  const CANVAS_MAX_H = 520;

  const scale = useMemo(() => {
    const scaleX = (CANVAS_MAX_W - 80) / roomWidth;
    const scaleY = (CANVAS_MAX_H - 80) / roomHeight;
    return Math.min(scaleX, scaleY, 1.25);
  }, [roomWidth, roomHeight]);

  const canvasWidth = roomWidth * scale;
  const canvasHeight = roomHeight * scale;

  const catalogMap = useMemo(() => {
    return new Map(furnitureCatalog.map((f) => [f.id, f]));
  }, [furnitureCatalog]);

  const getOpeningGeometry = (opening, type = "door") => {
    const openingLength = 80 * scale; // Standard 80cm opening
    const wallThick = 12;

    switch (opening.wall) {
      case "top":
        return {
          x: opening.x * scale,
          y: 0,
          w: openingLength,
          h: wallThick,
          wall: "top"
        };
      case "bottom":
        return {
          x: opening.x * scale,
          y: canvasHeight - wallThick,
          w: openingLength,
          h: wallThick,
          wall: "bottom"
        };
      case "left":
        return {
          x: 0,
          y: opening.y * scale,
          w: wallThick,
          h: openingLength,
          wall: "left"
        };
      case "right":
        return {
          x: canvasWidth - wallThick,
          y: opening.y * scale,
          w: wallThick,
          h: openingLength,
          wall: "right"
        };
      default:
        return { x: 0, y: 0, w: 0, h: 0, wall: "top" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
      {/* Canvas Top Control Bar */}
      {interactive && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: canvasWidth + 40,
          background: "rgba(17, 24, 39, 0.7)",
          padding: "8px 16px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          fontSize: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
              Blueprint: {roomWidth} × {roomHeight} cm
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              Scale: {(scale * 100).toFixed(0)}%
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setShowLightBeams(!showLightBeams)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                background: showLightBeams ? "rgba(6, 182, 212, 0.2)" : "transparent",
                color: showLightBeams ? "#22d3ee" : "var(--text-muted)",
                border: "1px solid " + (showLightBeams ? "rgba(6, 182, 212, 0.4)" : "var(--border-subtle)"),
                fontSize: "11px",
                fontWeight: 500
              }}
              title="Toggle Window Sunlight Rays"
            >
              <Sun size={13} />
              <span>Light Rays</span>
            </button>

            <button
              onClick={() => setShowTrafficPaths(!showTrafficPaths)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                background: showTrafficPaths ? "rgba(99, 102, 241, 0.2)" : "transparent",
                color: showTrafficPaths ? "#a5b4fc" : "var(--text-muted)",
                border: "1px solid " + (showTrafficPaths ? "rgba(99, 102, 241, 0.4)" : "var(--border-subtle)"),
                fontSize: "11px",
                fontWeight: 500
              }}
              title="Toggle Door Access Corridors"
            >
              <Footprints size={13} />
              <span>Traffic Flow</span>
            </button>

            <button
              onClick={() => setShowClearanceHalos(!showClearanceHalos)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                background: showClearanceHalos ? "rgba(16, 185, 129, 0.2)" : "transparent",
                color: showClearanceHalos ? "#34d399" : "var(--text-muted)",
                border: "1px solid " + (showClearanceHalos ? "rgba(16, 185, 129, 0.4)" : "var(--border-subtle)"),
                fontSize: "11px",
                fontWeight: 500
              }}
              title="Toggle Furniture Spacing Halos"
            >
              <ShieldCheck size={13} />
              <span>Clearance</span>
            </button>
          </div>
        </div>
      )}

      {/* Main 2D Blueprint Room Canvas */}
      <div
        style={{
          width: canvasWidth + 40,
          height: canvasHeight + 40,
          padding: "20px",
          background: "radial-gradient(circle at center, #0e1526 0%, #080c14 100%)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Architectural Room Boundary */}
        <div
          style={{
            width: canvasWidth,
            height: canvasHeight,
            position: "relative",
            background: "linear-gradient(135deg, #0c1220 0%, #090d16 100%)",
            border: "4px solid #475569",
            borderRadius: "4px",
            boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)"
          }}
        >
          {/* Subtle 50cm Blueprint Grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                linear-gradient(to right, rgba(99, 102, 241, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(99, 102, 241, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: `${50 * scale}px ${50 * scale}px`,
              pointerEvents: "none"
            }}
          />

          {/* Traffic Flow Path Overlays */}
          {showTrafficPaths && (
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 4
              }}
            >
              {doors.map((door, idx) => {
                const geom = getOpeningGeometry(door, "door");
                const doorCenterX = geom.x + geom.w / 2;
                const doorCenterY = geom.y + geom.h / 2;
                const roomCenterX = canvasWidth / 2;
                const roomCenterY = canvasHeight / 2;

                return (
                  <g key={`traffic-${idx}`}>
                    <line
                      x1={doorCenterX}
                      y1={doorCenterY}
                      x2={roomCenterX}
                      y2={roomCenterY}
                      stroke="#818cf8"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      opacity="0.65"
                    />
                    <circle
                      cx={doorCenterX}
                      cy={doorCenterY}
                      r={70 * scale}
                      fill="rgba(99, 102, 241, 0.08)"
                      stroke="#6366f1"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Sunlight Rays Through Windows */}
          {showLightBeams && windows.map((win, idx) => {
            const geom = getOpeningGeometry(win, "window");
            let clipPath = "";

            if (geom.wall === "top") {
              clipPath = `polygon(${geom.x}px 0px, ${geom.x + geom.w}px 0px, ${Math.min(canvasWidth, geom.x + geom.w + 140 * scale)}px ${Math.min(canvasHeight, 200 * scale)}px, ${Math.max(0, geom.x - 80 * scale)}px ${Math.min(canvasHeight, 200 * scale)}px)`;
            } else if (geom.wall === "bottom") {
              clipPath = `polygon(${geom.x}px ${canvasHeight}px, ${geom.x + geom.w}px ${canvasHeight}px, ${Math.min(canvasWidth, geom.x + geom.w + 140 * scale)}px ${Math.max(0, canvasHeight - 200 * scale)}px, ${Math.max(0, geom.x - 80 * scale)}px ${Math.max(0, canvasHeight - 200 * scale)}px)`;
            } else if (geom.wall === "left") {
              clipPath = `polygon(0px ${geom.y}px, 0px ${geom.y + geom.h}px, ${Math.min(canvasWidth, 200 * scale)}px ${Math.min(canvasHeight, geom.y + geom.h + 140 * scale)}px, ${Math.min(canvasWidth, 200 * scale)}px ${Math.max(0, geom.y - 80 * scale)}px)`;
            } else {
              clipPath = `polygon(${canvasWidth}px ${geom.y}px, ${canvasWidth}px ${geom.y + geom.h}px, ${Math.max(0, canvasWidth - 200 * scale)}px ${Math.min(canvasHeight, geom.y + geom.h + 140 * scale)}px, ${Math.max(0, canvasWidth - 200 * scale)}px ${Math.max(0, geom.y - 80 * scale)}px)`;
            }

            return (
              <div
                key={`sunlight-${idx}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(circle at center, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.01) 100%)",
                  clipPath,
                  pointerEvents: "none",
                  zIndex: 3
                }}
              />
            );
          })}

          {/* Architectural Doors */}
          {doors.map((door, index) => {
            const geom = getOpeningGeometry(door, "door");
            const swingRadius = 50 * scale;

            return (
              <div key={`door-${index}`}>
                {/* Door Frame Cutout */}
                <div
                  style={{
                    position: "absolute",
                    left: geom.x,
                    top: geom.y,
                    width: geom.w,
                    height: geom.h,
                    backgroundColor: "#92400e",
                    border: "1px solid #d97706",
                    borderRadius: "2px",
                    zIndex: 10,
                    boxShadow: "0 0 8px rgba(217, 119, 6, 0.4)"
                  }}
                  title={`Door on ${door.wall} wall (x: ${door.x}cm, y: ${door.y}cm)`}
                />
              </div>
            );
          })}

          {/* Architectural Windows */}
          {windows.map((window, index) => {
            const geom = getOpeningGeometry(window, "window");

            return (
              <div
                key={`window-${index}`}
                style={{
                  position: "absolute",
                  left: geom.x,
                  top: geom.y,
                  width: geom.w,
                  height: geom.h,
                  backgroundColor: "#0284c7",
                  border: "1.5px solid #38bdf8",
                  borderRadius: "2px",
                  zIndex: 10,
                  boxShadow: "0 0 12px rgba(56, 189, 248, 0.6)"
                }}
                title={`Window on ${window.wall} wall (x: ${window.x}cm, y: ${window.y}cm)`}
              >
                {/* Double pane line */}
                <div
                  style={{
                    position: "absolute",
                    inset: "2px",
                    background: "rgba(255, 255, 255, 0.4)",
                    borderRadius: "1px"
                  }}
                />
              </div>
            );
          })}

          {/* Furniture Elements */}
          {layout.map((item, index) => {
            const furniture = catalogMap.get(item.furnitureId);
            if (!furniture) return null;

            const isRotated = item.rotation === 90 || item.rotation === 270;
            const w = (isRotated ? furniture.depth : furniture.width) * scale;
            const h = (isRotated ? furniture.width : furniture.depth) * scale;
            const posX = item.x * scale;
            const posY = item.y * scale;

            const categoryStyle = CATEGORY_STYLES[furniture.category] || CATEGORY_STYLES.default;
            const isHovered = hoveredItem?.furnitureId === item.furnitureId;

            return (
              <div
                key={`${item.furnitureId}-${index}`}
                onMouseEnter={() => setHoveredItem({ ...item, ...furniture, w, h })}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  position: "absolute",
                  left: posX,
                  top: posY,
                  width: w,
                  height: h,
                  backgroundColor: isHovered ? "rgba(99, 102, 241, 0.35)" : categoryStyle.bg,
                  border: `2px solid ${isHovered ? "#ffffff" : categoryStyle.border}`,
                  borderRadius: "6px",
                  boxShadow: isHovered
                    ? `0 0 20px ${categoryStyle.border}, 0 8px 16px rgba(0, 0, 0, 0.6)`
                    : "0 4px 10px rgba(0, 0, 0, 0.4)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  color: categoryStyle.text,
                  fontSize: Math.max(10, Math.min(13, w / 8)),
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                  transform: isHovered ? "scale(1.02)" : "scale(1)",
                  zIndex: isHovered ? 20 : 6,
                  overflow: "hidden"
                }}
              >
                {/* Clearance Halo when toggled */}
                {showClearanceHalos && (
                  <div
                    style={{
                      position: "absolute",
                      inset: `-${25 * scale}px`,
                      border: "1px dashed rgba(16, 185, 129, 0.4)",
                      borderRadius: "8px",
                      pointerEvents: "none"
                    }}
                  />
                )}

                {/* Furniture Icon + Name */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                  <span style={{ fontSize: "14px" }}>{categoryStyle.icon}</span>
                  <span style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: w - 12
                  }}>
                    {furniture.name}
                  </span>
                </div>

                {/* Dimensions + Rotation Label */}
                {w > 60 && h > 40 && (
                  <div style={{
                    fontSize: "9px",
                    color: "rgba(255, 255, 255, 0.75)",
                    fontFamily: "var(--font-mono)",
                    marginTop: "2px"
                  }}>
                    {furniture.width}×{furniture.depth} cm ({item.rotation}°)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Inspector / Hover HUD */}
      {hoveredItem && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "8px 18px",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--border-medium)",
          boxShadow: "var(--shadow-md)",
          fontSize: "13px",
          animation: "fadeIn 0.2s ease"
        }}>
          <span style={{ fontWeight: 600, color: "#ffffff" }}>
            {hoveredItem.name}
          </span>
          <span style={{ color: "var(--text-muted)" }}>|</span>
          <span style={{ color: "var(--text-secondary)" }}>
            Position: ({hoveredItem.x}cm, {hoveredItem.y}cm)
          </span>
          <span style={{ color: "var(--text-muted)" }}>|</span>
          <span style={{ color: "var(--text-secondary)" }}>
            Size: {hoveredItem.width} × {hoveredItem.depth} cm
          </span>
          <span style={{ color: "var(--text-muted)" }}>|</span>
          <span style={{ color: "#a5b4fc", fontWeight: 600 }}>
            Rotation: {hoveredItem.rotation}°
          </span>
        </div>
      )}
    </div>
  );
}

export default RoomCanvas;