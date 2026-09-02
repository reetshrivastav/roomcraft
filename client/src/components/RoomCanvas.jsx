import { useState, useMemo, useRef, useCallback } from "react";
import { Sun, Footprints, ShieldCheck, RotateCw, Move, Trash2 } from "lucide-react";

const CATEGORY_STYLES = {
  bed: { bg: "rgba(180, 123, 72, 0.15)", border: "#b47b48", text: "#5c3818", icon: "🛏️" },
  storage: { bg: "rgba(100, 116, 139, 0.15)", border: "#64748b", text: "#334155", icon: "🚪" },
  work: { bg: "rgba(217, 119, 6, 0.15)", border: "#d97706", text: "#78350f", icon: "💻" },
  seating: { bg: "rgba(5, 150, 105, 0.15)", border: "#059669", text: "#064e3b", icon: "🛋️" },
  table: { bg: "rgba(225, 29, 72, 0.15)", border: "#e11d48", text: "#881337", icon: "☕" },
  entertainment: { bg: "rgba(2, 132, 199, 0.15)", border: "#0284c7", text: "#0c4a6e", icon: "📺" },
  default: { bg: "rgba(124, 58, 237, 0.15)", border: "#7c3aed", text: "#4c1d95", icon: "📦" }
};

const ROTATIONS = [0, 90, 180, 270];

function RoomCanvas({
  roomWidth = 500,
  roomHeight = 400,
  layout = [],
  furnitureCatalog = [],
  doors = [],
  windows = [],
  interactive = true,
  editable = false,
  customDimensions = {},
  onLayoutChange = null
}) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showLightBeams, setShowLightBeams] = useState(true);
  const [showTrafficPaths, setShowTrafficPaths] = useState(true);
  const [showClearanceHalos, setShowClearanceHalos] = useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const dragStart = useRef(null);
  const containerRef = useRef(null);

  const CANVAS_MAX_W = 760;
  const CANVAS_MAX_H = 520;

  const scale = useMemo(() => {
    const scaleX = (CANVAS_MAX_W - 80) / roomWidth;
    const scaleY = (CANVAS_MAX_H - 80) / roomHeight;
    return Math.min(scaleX, scaleY, 1.0);
  }, [roomWidth, roomHeight]);

  const canvasWidth = roomWidth * scale;
  const canvasHeight = roomHeight * scale;

  const catalogMap = useMemo(() => {
    return new Map(furnitureCatalog.map((f) => [f.id, f]));
  }, [furnitureCatalog]);

  const getItemDimensions = useCallback((furnitureId) => {
    const furniture = catalogMap.get(furnitureId);
    const custom = customDimensions[furnitureId];
    const width = custom?.width || furniture?.width || 50;
    const depth = custom?.depth || furniture?.depth || 50;
    return { width, depth };
  }, [catalogMap, customDimensions]);

  // Drag handlers
  const handleMouseDown = useCallback((e, index) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    setDragIndex(index);
    setSelectedIndex(index);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        itemX: layout[index].x,
        itemY: layout[index].y
      };
    }
  }, [editable, layout]);

  const handleTouchStart = (e, index) => {
    if (!editable || !e.touches || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setSelectedIndex(index);
    setDragIndex(index);
    dragStart.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      itemX: layout[index].x,
      itemY: layout[index].y
    };
  };

  const handleMouseMove = useCallback((e) => {
    if (dragIndex === null || !dragStart.current || !editable || !onLayoutChange) return;

    const dx = (e.clientX - dragStart.current.mouseX) / scale;
    const dy = (e.clientY - dragStart.current.mouseY) / scale;

    const item = layout[dragIndex];
    const { width: baseW, depth: baseD } = getItemDimensions(item.furnitureId);

    const isRotated = item.rotation === 90 || item.rotation === 270;
    const w = isRotated ? baseD : baseW;
    const h = isRotated ? baseW : baseD;

    const newX = Math.round(Math.max(0, Math.min(roomWidth - w, dragStart.current.itemX + dx)));
    const newY = Math.round(Math.max(0, Math.min(roomHeight - h, dragStart.current.itemY + dy)));

    const newLayout = [...layout];
    newLayout[dragIndex] = { ...newLayout[dragIndex], x: newX, y: newY };
    onLayoutChange(newLayout);
  }, [dragIndex, editable, layout, onLayoutChange, scale, getItemDimensions, roomWidth, roomHeight]);

  const handleTouchMove = useCallback((e) => {
    if (dragIndex === null || !dragStart.current || !editable || !onLayoutChange || !e.touches || e.touches.length !== 1) return;
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    const dx = (touch.clientX - dragStart.current.mouseX) / scale;
    const dy = (touch.clientY - dragStart.current.mouseY) / scale;

    const item = layout[dragIndex];
    const { width: baseW, depth: baseD } = getItemDimensions(item.furnitureId);

    const isRotated = item.rotation === 90 || item.rotation === 270;
    const w = isRotated ? baseD : baseW;
    const h = isRotated ? baseW : baseD;

    const newX = Math.round(Math.max(0, Math.min(roomWidth - w, dragStart.current.itemX + dx)));
    const newY = Math.round(Math.max(0, Math.min(roomHeight - h, dragStart.current.itemY + dy)));

    const newLayout = [...layout];
    newLayout[dragIndex] = { ...newLayout[dragIndex], x: newX, y: newY };
    onLayoutChange(newLayout);
  }, [dragIndex, editable, layout, onLayoutChange, scale, getItemDimensions, roomWidth, roomHeight]);

  const handleMouseUp = useCallback(() => {
    setDragIndex(null);
    dragStart.current = null;
  }, []);

  const handleRotateSelected = useCallback(() => {
    if (selectedIndex === null || !editable || !onLayoutChange) return;
    const item = layout[selectedIndex];
    const currentRotIdx = ROTATIONS.indexOf(item.rotation || 0);
    const nextRot = ROTATIONS[(currentRotIdx + 1) % 4];

    const newLayout = [...layout];
    newLayout[selectedIndex] = { ...newLayout[selectedIndex], rotation: nextRot };
    onLayoutChange(newLayout);
  }, [selectedIndex, editable, layout, onLayoutChange]);

  const getOpeningGeometry = (opening, type = "door") => {
    const openingLength = 80 * scale;
    const wallThick = 12;

    switch (opening.wall) {
      case "top": return { x: opening.x * scale, y: 0, w: openingLength, h: wallThick, wall: "top" };
      case "bottom": return { x: opening.x * scale, y: canvasHeight - wallThick, w: openingLength, h: wallThick, wall: "bottom" };
      case "left": return { x: 0, y: opening.y * scale, w: wallThick, h: openingLength, wall: "left" };
      case "right": return { x: canvasWidth - wallThick, y: opening.y * scale, w: wallThick, h: openingLength, wall: "right" };
      default: return { x: 0, y: 0, w: 0, h: 0, wall: "top" };
    }
  };

  const getDisplayName = useCallback((item, index) => {
    const furniture = catalogMap.get(item.furnitureId);
    if (!furniture) return "Item";
    const sameItems = layout.filter(g => g.furnitureId === item.furnitureId);
    if (sameItems.length <= 1) return furniture.name;
    const itemIndex = sameItems.indexOf(item);
    return `${furniture.name} ${itemIndex + 1}`;
  }, [catalogMap, layout]);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", width: "100%", maxWidth: "100%" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      onTouchCancel={handleMouseUp}
    >
      {/* Canvas Top Control Bar */}
      {interactive && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: Math.max(canvasWidth + 40, 500),
          background: "var(--bg-card)",
          padding: "8px 16px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          fontSize: "12px",
          flexWrap: "wrap",
          gap: "8px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
              2D CAD Blueprint: {roomWidth} × {roomHeight} cm
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              Scale: {(scale * 100).toFixed(0)}%
            </span>
            {editable && (
              <span style={{ color: "#059669", fontWeight: 700, fontSize: "11px" }}>
                <Move size={12} style={{ verticalAlign: "middle" }} /> Drag to Reposition
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {editable && selectedIndex !== null && (
              <button
                onClick={handleRotateSelected}
                style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  padding: "4px 8px", borderRadius: "var(--radius-sm)",
                  background: "rgba(180, 123, 72, 0.12)", color: "#b47b48",
                  border: "1px solid rgba(180, 123, 72, 0.3)",
                  fontSize: "11px", fontWeight: 600
                }}
              >
                <RotateCw size={12} />
                <span>Rotate Selected</span>
              </button>
            )}

            <button
              onClick={() => setShowLightBeams(!showLightBeams)}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "4px 8px", borderRadius: "var(--radius-sm)",
                background: showLightBeams ? "rgba(2, 132, 199, 0.12)" : "transparent",
                color: showLightBeams ? "#0284c7" : "var(--text-muted)",
                border: "1px solid " + (showLightBeams ? "rgba(2, 132, 199, 0.3)" : "var(--border-subtle)"),
                fontSize: "11px", fontWeight: 600
              }}
            >
              <Sun size={13} />
              <span>Light Rays</span>
            </button>

            <button
              onClick={() => setShowTrafficPaths(!showTrafficPaths)}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "4px 8px", borderRadius: "var(--radius-sm)",
                background: showTrafficPaths ? "rgba(180, 123, 72, 0.12)" : "transparent",
                color: showTrafficPaths ? "#b47b48" : "var(--text-muted)",
                border: "1px solid " + (showTrafficPaths ? "rgba(180, 123, 72, 0.3)" : "var(--border-subtle)"),
                fontSize: "11px", fontWeight: 600
              }}
            >
              <Footprints size={13} />
              <span>Traffic Flow</span>
            </button>

            <button
              onClick={() => setShowClearanceHalos(!showClearanceHalos)}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "4px 8px", borderRadius: "var(--radius-sm)",
                background: showClearanceHalos ? "rgba(5, 150, 105, 0.12)" : "transparent",
                color: showClearanceHalos ? "#059669" : "var(--text-muted)",
                border: "1px solid " + (showClearanceHalos ? "rgba(5, 150, 105, 0.3)" : "var(--border-subtle)"),
                fontSize: "11px", fontWeight: 600
              }}
            >
              <ShieldCheck size={13} />
              <span>Clearance</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Blueprint Room Canvas Scroll Container */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: canvasWidth + 40,
          maxHeight: "620px",
          padding: "20px",
          background: "#f4f0e6",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-medium)",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "auto",
          cursor: dragIndex !== null ? "grabbing" : "default"
        }}
      >
        {/* Architectural Room Boundary */}
        <div
          style={{
            width: canvasWidth,
            height: canvasHeight,
            minWidth: canvasWidth,
            minHeight: canvasHeight,
            position: "relative",
            background: "#ffffff",
            border: "4px solid #332a24",
            borderRadius: "3px",
            boxShadow: "0 4px 12px rgba(50, 35, 20, 0.08)"
          }}
        >
          {/* 50cm Grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                linear-gradient(to right, rgba(70, 52, 38, 0.06) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(70, 52, 38, 0.06) 1px, transparent 1px)
              `,
              backgroundSize: `${50 * scale}px ${50 * scale}px`,
              pointerEvents: "none"
            }}
          />

          {/* Traffic Flow Paths */}
          {showTrafficPaths && (
            <svg
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                pointerEvents: "none", zIndex: 4
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
                    <line x1={doorCenterX} y1={doorCenterY} x2={roomCenterX} y2={roomCenterY}
                      stroke="#b47b48" strokeWidth="2" strokeDasharray="6 4" opacity="0.65" />
                    <circle cx={doorCenterX} cy={doorCenterY} r={70 * scale}
                      fill="rgba(180, 123, 72, 0.06)" stroke="#b47b48" strokeWidth="1" strokeDasharray="3 3" />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Window Sunlight Rays */}
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
              <div key={`sunlight-${idx}`} style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(circle at center, rgba(2, 132, 199, 0.18) 0%, rgba(2, 132, 199, 0.02) 100%)",
                clipPath, pointerEvents: "none", zIndex: 3
              }} />
            );
          })}

          {/* Doors */}
          {doors.map((door, index) => {
            const geom = getOpeningGeometry(door, "door");
            return (
              <div key={`door-${index}`} style={{
                position: "absolute", left: geom.x, top: geom.y, width: geom.w, height: geom.h,
                backgroundColor: "#b47b48", border: "1px solid #784c28", borderRadius: "2px",
                zIndex: 10, boxShadow: "0 1px 4px rgba(120, 76, 40, 0.3)"
              }} title={`Door on ${door.wall} wall (${door.x}cm, ${door.y}cm)`} />
            );
          })}

          {/* Windows with Blue Glass & Glare Reflection */}
          {windows.map((win, index) => {
            const geom = getOpeningGeometry(win, "window");
            return (
              <div key={`window-${index}`} style={{
                position: "absolute", left: geom.x, top: geom.y, width: geom.w, height: geom.h,
                background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #7dd3fc 100%)",
                border: "1.5px solid #0369a1", borderRadius: "2px",
                zIndex: 10, boxShadow: "0 0 10px rgba(56, 189, 248, 0.6)",
                overflow: "hidden"
              }} title={`Window on ${win.wall} wall`}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(120deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.3) 30%, transparent 35%, rgba(255,255,255,0.5) 55%, transparent 60%)",
                  pointerEvents: "none"
                }} />
              </div>
            );
          })}

          {/* 2D Architectural Area Rugs */}
          {(() => {
            const bed = layout.find(i => {
              const f = catalogMap.get(i.furnitureId);
              return f?.category === "bed";
            });
            const sofa = layout.find(i => i.furnitureId === "sofa");
            const rugs = [];

            if (bed) {
              const { width: bw, depth: bd } = getItemDimensions(bed.furnitureId);
              const isRot = bed.rotation === 90 || bed.rotation === 270;
              const w = isRot ? bd : bw;
              const h = isRot ? bw : bd;
              const rw = (w + 70) * scale;
              const rh = (h + 50) * scale;
              const rx = (bed.x - 35) * scale;
              const ry = (bed.y - 25) * scale;
              rugs.push(
                <div
                  key="bed-rug"
                  style={{
                    position: "absolute",
                    left: rx,
                    top: ry,
                    width: rw,
                    height: rh,
                    border: "1.5px dashed rgba(180, 123, 72, 0.45)",
                    backgroundColor: "rgba(180, 123, 72, 0.05)",
                    borderRadius: "8px",
                    zIndex: 4,
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                    padding: "4px"
                  }}
                >
                  <span style={{ fontSize: "9px", color: "rgba(180, 123, 72, 0.65)", fontWeight: 700, letterSpacing: "0.5px" }}>
                    BEDROOM RUG
                  </span>
                </div>
              );
            }

            if (sofa) {
              const { width: sw, depth: sd } = getItemDimensions(sofa.furnitureId);
              const isRot = sofa.rotation === 90 || sofa.rotation === 270;
              const w = isRot ? sd : sw;
              const h = isRot ? sw : sd;
              const rw = Math.max(w + 40, 180) * scale;
              const rh = 150 * scale;
              let rx = (sofa.x - 20) * scale;
              let ry = (sofa.y - 20) * scale;
              if (sofa.rotation === 0) ry += 40 * scale;
              else if (sofa.rotation === 180) ry -= 40 * scale;
              else if (sofa.rotation === 90) rx += 40 * scale;
              else if (sofa.rotation === 270) rx -= 40 * scale;

              rugs.push(
                <div
                  key="sofa-rug"
                  style={{
                    position: "absolute",
                    left: rx,
                    top: ry,
                    width: rw,
                    height: rh,
                    border: "1.5px dashed rgba(180, 123, 72, 0.45)",
                    backgroundColor: "rgba(180, 123, 72, 0.05)",
                    borderRadius: "8px",
                    zIndex: 4,
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                    padding: "4px"
                  }}
                >
                  <span style={{ fontSize: "9px", color: "rgba(180, 123, 72, 0.65)", fontWeight: 700, letterSpacing: "0.5px" }}>
                    LOUNGE RUG
                  </span>
                </div>
              );
            }

            return rugs;
          })()}

          {/* Furniture Elements */}
          {layout.map((item, index) => {
            const furniture = catalogMap.get(item.furnitureId);
            if (!furniture) return null;

            const { width: baseW, depth: baseD } = getItemDimensions(item.furnitureId);
            const isRotated = item.rotation === 90 || item.rotation === 270;
            const w = (isRotated ? baseD : baseW) * scale;
            const h = (isRotated ? baseW : baseD) * scale;
            const posX = item.x * scale;
            const posY = item.y * scale;

            const categoryStyle = CATEGORY_STYLES[furniture.category] || CATEGORY_STYLES.default;
            const isHovered = hoveredItem === index;
            const isSelected = selectedIndex === index;
            const isDragging = dragIndex === index;

            return (
              <div
                key={`${item.furnitureId}-${index}`}
                onMouseEnter={() => { if (dragIndex === null) setHoveredItem(index); }}
                onMouseLeave={() => setHoveredItem(null)}
                onMouseDown={(e) => handleMouseDown(e, index)}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onClick={(e) => { if (editable) { e.stopPropagation(); setSelectedIndex(index); } }}
                style={{
                  position: "absolute",
                  touchAction: "none",
                  left: posX,
                  top: posY,
                  width: w,
                  height: h,
                  backgroundColor: isDragging
                    ? "rgba(180, 123, 72, 0.35)"
                    : isSelected
                    ? "rgba(5, 150, 105, 0.2)"
                    : isHovered
                    ? "rgba(180, 123, 72, 0.25)"
                    : categoryStyle.bg,
                  border: `2px solid ${isSelected ? "#059669" : isDragging ? "#b47b48" : isHovered ? "#b47b48" : categoryStyle.border}`,
                  borderRadius: "5px",
                  boxShadow: isDragging
                    ? "0 8px 24px rgba(0, 0, 0, 0.25)"
                    : isSelected
                    ? "0 0 0 3px rgba(5, 150, 105, 0.3)"
                    : isHovered
                    ? `0 0 12px ${categoryStyle.border}`
                    : "0 2px 5px rgba(50, 35, 20, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  color: categoryStyle.text,
                  fontSize: Math.max(10, Math.min(13, w / 8)),
                  cursor: editable ? (isDragging ? "grabbing" : "grab") : "pointer",
                  transition: isDragging ? "none" : "transform 0.15s ease, box-shadow 0.15s ease",
                  transform: isDragging ? "scale(1.05)" : isHovered ? "scale(1.02)" : "scale(1)",
                  zIndex: isDragging ? 100 : isSelected ? 30 : isHovered ? 20 : 6,
                  overflow: "hidden",
                  userSelect: "none"
                }}
              >
                {/* Backrest Indicator Strip for directional awareness */}
                <div style={{
                  position: "absolute",
                  ...(item.rotation === 0 ? { top: 0, left: 0, right: 0, height: "4px" } :
                     item.rotation === 180 ? { bottom: 0, left: 0, right: 0, height: "4px" } :
                     item.rotation === 90 ? { top: 0, bottom: 0, left: 0, width: "4px" } :
                     { top: 0, bottom: 0, right: 0, width: "4px" }),
                  background: categoryStyle.border,
                  opacity: 0.8
                }} title={`Back facing ${item.rotation}°`} />

                {showClearanceHalos && (
                  <div style={{
                    position: "absolute",
                    inset: `-${25 * scale}px`,
                    border: "1px dashed rgba(5, 150, 105, 0.4)",
                    borderRadius: "6px",
                    pointerEvents: "none"
                  }} />
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 700 }}>
                  <span style={{ fontSize: "13px" }}>{categoryStyle.icon}</span>
                  <span style={{
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: w - 12
                  }}>
                    {getDisplayName(item, index)}
                  </span>
                </div>

                {w > 60 && h > 35 && (
                  <div style={{
                    fontSize: "9px", color: "var(--text-muted)", fontFamily: "var(--font-mono)",
                    marginTop: "2px", fontWeight: 600
                  }}>
                    {baseW}×{baseD} cm ({item.rotation}°)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Item Control Bar (Essential for Mobile & Touch) */}
      {selectedIndex !== null && layout[selectedIndex] && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px",
          width: "100%", maxWidth: canvasWidth + 40, padding: "10px 16px",
          background: "#ffffff", borderRadius: "var(--radius-md)", border: "1.5px solid var(--primary)",
          boxShadow: "0 4px 16px rgba(180, 123, 72, 0.2)", fontSize: "13px"
        }}>
          {(() => {
            const item = layout[selectedIndex];
            const furniture = catalogMap.get(item.furnitureId);
            if (!furniture) return null;
            const { width: baseW, depth: baseD } = getItemDimensions(item.furnitureId);
            return (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 700, color: "var(--primary)" }}>✓ {furniture.name}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>({item.x}, {item.y} cm)</span>
                  <span style={{ background: "rgba(180, 123, 72, 0.12)", color: "var(--primary)", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700 }}>
                    {item.rotation}°
                  </span>
                </div>
                {editable && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={handleRotateSelected}
                      className="btn-primary"
                      style={{ padding: "6px 14px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                      title="Rotate 90 degrees"
                    >
                      <RotateCw size={14} />
                      <span>Rotate 90°</span>
                    </button>
                    <button
                      onClick={() => {
                        const updated = layout.filter((_, i) => i !== selectedIndex);
                        setSelectedIndex(null);
                        onLayoutChange(updated);
                      }}
                      style={{
                        padding: "6px 12px", fontSize: "12px", background: "rgba(225, 29, 72, 0.1)",
                        color: "#be123c", border: "1px solid rgba(225, 29, 72, 0.25)",
                        borderRadius: "var(--radius-sm)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px"
                      }}
                      title="Remove item from layout"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Item Inspector HUD */}
      {hoveredItem !== null && layout[hoveredItem] && (
        <div style={{
          display: "flex", alignItems: "center", gap: "16px",
          padding: "8px 18px", background: "var(--bg-card)",
          borderRadius: "var(--radius-full)", border: "1px solid var(--border-medium)",
          boxShadow: "var(--shadow-md)", fontSize: "13px", animation: "fadeIn 0.2s ease"
        }}>
          {(() => {
            const item = layout[hoveredItem];
            const furniture = catalogMap.get(item.furnitureId);
            if (!furniture) return null;
            const { width: baseW, depth: baseD } = getItemDimensions(item.furnitureId);
            return (
              <>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{furniture.name}</span>
                <span style={{ color: "var(--text-muted)" }}>|</span>
                <span style={{ color: "var(--text-secondary)" }}>Position: ({item.x}cm, {item.y}cm)</span>
                <span style={{ color: "var(--text-muted)" }}>|</span>
                <span style={{ color: "var(--text-secondary)" }}>Size: {baseW} × {baseD} cm</span>
                <span style={{ color: "var(--text-muted)" }}>|</span>
                <span style={{ color: "var(--primary)", fontWeight: 700 }}>Rotation: {item.rotation}°</span>
                {editable && <span style={{ color: "#059669", fontWeight: 600 }}>• Drag to Move</span>}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default RoomCanvas;