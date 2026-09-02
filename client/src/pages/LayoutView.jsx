import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  Sparkles, CheckCircle2, Layers, Compass, ArrowLeft,
  RotateCw, Share2, Box, Eye, Check, AlertCircle, Plus,
  Trash2, X, Sliders, Move, Edit3, ChevronRight, PanelLeftOpen, PanelLeftClose, AlertTriangle
} from "lucide-react";
import Navbar from "../components/Navbar";
import RoomCanvas from "../components/RoomCanvas";
import Room3DView from "../components/Room3DView";
import ScoreBreakdown from "../components/ScoreBreakdown";
import StyleModal from "../components/StyleModal";
import stylePresets from "../data/stylePresets.json";
import furnitureCatalog from "../furnitureCatalog.json";
import { getRoom, confirmLayout } from "../services/room";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "bed", label: "Beds" },
  { id: "storage", label: "Storage" },
  { id: "work", label: "Work" },
  { id: "seating", label: "Seating" },
  { id: "table", label: "Tables" },
  { id: "entertainment", label: "Media" }
];

function LayoutView() {
  const location = useLocation();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [generatedLayouts, setGeneratedLayouts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [viewMode, setViewMode] = useState("2d"); // "2d" | "3d"
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Floating sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("current"); // "current" | "catalog"
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [customDimensions, setCustomDimensions] = useState({});
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [activeStyle, setActiveStyle] = useState(stylePresets[0]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const params = new URLSearchParams(location.search);
  const roomId = params.get("roomId");

  const catalogMap = useMemo(() => {
    return new Map(furnitureCatalog.map((f) => [f.id, f]));
  }, []);

  useEffect(() => {
    const initData = async () => {
      if (!roomId) {
        setError("No room ID provided.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        let roomData = null;
        const storedRoom = sessionStorage.getItem("roomcraft-current-room");
        if (storedRoom) {
          try {
            const parsed = JSON.parse(storedRoom);
            if (parsed._id === roomId) {
              roomData = parsed;
            }
          } catch (e) {
            console.error("Session parse failed", e);
          }
        }

        if (!roomData) {
          const fetched = await getRoom(roomId);
          roomData = fetched.room;
        }

        if (!roomData) {
          throw new Error("Failed to load room metadata.");
        }

        setRoom(roomData);
        if (roomData.customDimensions) {
          setCustomDimensions(roomData.customDimensions);
        }

        // Fetch layouts
        const { getRoomLayouts } = await import("../services/room");
        const layoutsData = await getRoomLayouts(roomId);

        if (layoutsData?.layouts && layoutsData.layouts.length > 0) {
          setGeneratedLayouts(layoutsData.layouts);
          if (roomData.selectedLayoutId) {
            const matchIdx = layoutsData.layouts.findIndex(l => l._id === roomData.selectedLayoutId);
            if (matchIdx !== -1) setSelectedIndex(matchIdx);
          }
        } else {
          // Generate if none exist
          const { generateLayouts } = await import("../services/room");
          const genData = await generateLayouts(roomId);
          setGeneratedLayouts(genData.layouts || []);
        }
      } catch (err) {
        console.error("LayoutView init error:", err);
        setError(err.message || "Failed to load room layouts.");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [roomId]);

  const selectedLayout = generatedLayouts[selectedIndex] || generatedLayouts[0];
  const isConfirmed = selectedLayout && room?.selectedLayoutId === selectedLayout._id;

  // Collision detection for currently selected layout
  const collisionCount = useMemo(() => {
    if (!selectedLayout?.layout) return 0;
    const items = selectedLayout.layout;
    let count = 0;

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const itemA = items[i];
        const itemB = items[j];

        const isChairTable =
          (itemA.furnitureId === "dining-chair" && itemB.furnitureId === "dining-table") ||
          (itemA.furnitureId === "dining-table" && itemB.furnitureId === "dining-chair") ||
          (itemA.furnitureId === "office-chair" && itemB.furnitureId === "desk") ||
          (itemA.furnitureId === "desk" && itemB.furnitureId === "office-chair");

        const furnA = catalogMap.get(itemA.furnitureId);
        const furnB = catalogMap.get(itemB.furnitureId);
        const cA = customDimensions[itemA.furnitureId];
        const cB = customDimensions[itemB.furnitureId];

        const baseWA = cA?.width || furnA?.width || 50;
        const baseDA = cA?.depth || furnA?.depth || 50;
        const rotA = itemA.rotation === 90 || itemA.rotation === 270;
        const wA = rotA ? baseDA : baseWA;
        const hA = rotA ? baseWA : baseDA;

        const baseWB = cB?.width || furnB?.width || 50;
        const baseDB = cB?.depth || furnB?.depth || 50;
        const rotB = itemB.rotation === 90 || itemB.rotation === 270;
        const wB = rotB ? baseDB : baseWB;
        const hB = rotB ? baseWB : baseDB;

        // Allow 20cm tuck for chairs under tables/desks
        const tuck = isChairTable ? 20 : 0;

        const overlapX = itemA.x + tuck < itemB.x + wB && itemA.x + wA - tuck > itemB.x;
        const overlapY = itemA.y + tuck < itemB.y + hB && itemA.y + hA - tuck > itemB.y;

        if (overlapX && overlapY) count++;
      }
    }
    return count;
  }, [selectedLayout, customDimensions, catalogMap]);

  const handleConfirm = async () => {
    if (!selectedLayout || !room) return;
    if (collisionCount > 0) {
      setError(`Cannot confirm layout: ${collisionCount} overlapping items detected. Please reposition items before confirming.`);
      return;
    }

    try {
      setIsConfirming(true);
      setError("");

      await confirmLayout(room._id, selectedLayout._id);

      setRoom(prev => ({ ...prev, selectedLayoutId: selectedLayout._id }));
      setSuccess("Arrangement successfully confirmed!");

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error("Confirmation error:", err);
      setError(err.message || "Failed to confirm layout.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleLayoutChange = (newLayout) => {
    const updated = [...generatedLayouts];
    updated[selectedIndex] = {
      ...updated[selectedIndex],
      layout: newLayout
    };
    setGeneratedLayouts(updated);
  };

  // Add item to active layout
  const handleAddItem = (furnitureId) => {
    if (!selectedLayout || !room) return;
    const furniture = catalogMap.get(furnitureId);
    if (!furniture) return;

    const custom = customDimensions[furnitureId];
    const w = custom?.width || furniture.width;
    const d = custom?.depth || furniture.depth;

    // Find a free spot in the room
    const currentItems = selectedLayout.layout;
    let placedX = Math.round(room.width / 2 - w / 2);
    let placedY = Math.round(room.height / 2 - d / 2);

    for (let offset = 0; offset < 200; offset += 30) {
      const testX = Math.max(15, Math.min(room.width - w - 15, placedX + offset));
      const testY = Math.max(15, Math.min(room.height - d - 15, placedY + offset));
      const collision = currentItems.some(item => {
        const itemFurn = catalogMap.get(item.furnitureId);
        const iw = itemFurn?.width || 50;
        const id = itemFurn?.depth || 50;
        return (
          testX < item.x + iw &&
          testX + w > item.x &&
          testY < item.y + id &&
          testY + d > item.y
        );
      });
      if (!collision) {
        placedX = testX;
        placedY = testY;
        break;
      }
    }

    const newItem = {
      furnitureId,
      x: placedX,
      y: placedY,
      rotation: 0
    };

    handleLayoutChange([...currentItems, newItem]);
  };

  // Remove item from active layout
  const handleRemoveItem = (index) => {
    if (!selectedLayout) return;
    const updated = selectedLayout.layout.filter((_, idx) => idx !== index);
    handleLayoutChange(updated);
  };

  // Rotate item in active layout
  const handleRotateItem = (index) => {
    if (!selectedLayout) return;
    const item = selectedLayout.layout[index];
    const nextRot = (item.rotation + 90) % 360;
    const updated = [...selectedLayout.layout];
    updated[index] = { ...item, rotation: nextRot };
    handleLayoutChange(updated);
  };

  // Update item custom dimensions
  const handleUpdateDimension = (furnitureId, field, value) => {
    setCustomDimensions(prev => ({
      ...prev,
      [furnitureId]: {
        ...(prev[furnitureId] || {}),
        [field]: Number(value)
      }
    }));
  };

  // 2D Mini Preview Box
  const MiniPreview = ({ id, width, depth }) => {
    const maxDim = Math.max(width, depth);
    const scale = 24 / maxDim;
    return (
      <div style={{
        width: Math.round(width * scale),
        height: Math.round(depth * scale),
        background: "rgba(180, 123, 72, 0.25)",
        border: "1.5px solid #b47b48",
        borderRadius: "2px",
        minWidth: "6px",
        minHeight: "6px"
      }} />
    );
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <Sparkles size={36} color="#b47b48" className="pulse-glow" />
          <h2 style={{ fontSize: "20px" }}>Synthesizing Distinct Spatial Archetypes...</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Extracting non-dominated Pareto front candidates with zero collisions
          </p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <AlertCircle size={40} color="#e11d48" />
          <h2 style={{ fontSize: "22px" }}>Room Unavailable</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "450px", textAlign: "center" }}>
            {error}
          </p>
          <Link to="/room-setup" className="btn-primary" style={{ marginTop: "12px" }}>
            <ArrowLeft size={16} />
            <span>Return to Room Setup</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", position: "relative" }}>
      <Navbar />

      {/* Floating Left Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: "fixed",
          left: sidebarOpen ? "360px" : "16px",
          top: "165px",
          zIndex: 100,
          background: "#ffffff",
          border: "1.5px solid var(--primary)",
          borderRadius: "var(--radius-full)",
          padding: "10px 14px",
          boxShadow: "0 6px 20px rgba(180, 123, 72, 0.25)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s ease",
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--primary)"
        }}
        title="Add / Remove / Edit Furniture Items"
      >
        {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        <span>{sidebarOpen ? "Close Editor" : "Furniture Editor"}</span>
        <span style={{
          background: "var(--primary)",
          color: "#fff",
          borderRadius: "var(--radius-full)",
          padding: "2px 7px",
          fontSize: "11px"
        }}>
          {selectedLayout?.layout?.length || 0}
        </span>
      </button>

      {/* Floating Left Sidebar Panel (Coohom Style) */}
      <div style={{
        position: "fixed",
        top: "70px",
        left: sidebarOpen ? 0 : "-380px",
        width: "360px",
        height: "calc(100vh - 70px)",
        background: "rgba(255, 255, 255, 0.97)",
        backdropFilter: "blur(12px)",
        borderRight: "1px solid var(--border-medium)",
        boxShadow: "4px 0 24px rgba(50, 35, 20, 0.12)",
        zIndex: 90,
        transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Sidebar Header & Tabs */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", background: "#fbf9f5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Layers size={18} color="#b47b48" />
              <span>Furniture Studio</span>
            </h3>
            <button onClick={() => setSidebarOpen(false)} style={{ background: "transparent", color: "var(--text-muted)" }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <button
              onClick={() => setSidebarTab("current")}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: 700,
                background: sidebarTab === "current" ? "var(--primary)" : "var(--bg-input)",
                color: sidebarTab === "current" ? "#fff" : "var(--text-secondary)",
                border: "none"
              }}
            >
              In Layout ({selectedLayout?.layout?.length || 0})
            </button>
            <button
              onClick={() => setSidebarTab("catalog")}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: 700,
                background: sidebarTab === "catalog" ? "var(--primary)" : "var(--bg-input)",
                color: sidebarTab === "catalog" ? "#fff" : "var(--text-secondary)",
                border: "none"
              }}
            >
              + Add Catalog
            </button>
          </div>
        </div>

        {/* Tab 1: Current Items in Layout */}
        {sidebarTab === "current" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Active Items in Layout #{selectedIndex + 1}
            </span>

            {selectedLayout?.layout?.map((item, idx) => {
              const furn = catalogMap.get(item.furnitureId);
              if (!furn) return null;
              const custom = customDimensions[item.furnitureId];
              const displayW = custom?.width || furn.width;
              const displayD = custom?.depth || furn.depth;
              const isEditing = editingItemIndex === idx;

              return (
                <div
                  key={`${item.furnitureId}-${idx}`}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <MiniPreview id={item.furnitureId} width={displayW} depth={displayD} />
                      <div>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {(() => {
                            const sameItems = selectedLayout?.layout?.filter(g => g.furnitureId === item.furnitureId) || [];
                            if (sameItems.length <= 1) return furn.name;
                            const itemIndex = sameItems.indexOf(item);
                            return `${furn.name} ${itemIndex + 1}`;
                          })()}
                        </span>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          ({item.x}, {item.y}) cm • {displayW}×{displayD} cm • {item.rotation}°
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <button
                        onClick={() => setEditingItemIndex(isEditing ? null : idx)}
                        style={{ background: isEditing ? "var(--primary)" : "transparent", color: isEditing ? "#fff" : "var(--text-muted)", padding: "4px", borderRadius: "4px" }}
                        title="Customize Size"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleRotateItem(idx)}
                        style={{ background: "transparent", color: "#b47b48", padding: "4px" }}
                        title="Rotate 90°"
                      >
                        <RotateCw size={14} />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        style={{ background: "transparent", color: "#e11d48", padding: "4px" }}
                        title="Remove from layout"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Inline Dimension Editor with Apply Button */}
                  {isEditing && (
                    <div style={{
                      marginTop: "6px",
                      padding: "10px",
                      background: "#ffffff",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>Width (cm)</span>
                          <input
                            type="number"
                            value={displayW}
                            onChange={(e) => handleUpdateDimension(item.furnitureId, "width", e.target.value)}
                            className="form-input"
                            style={{ padding: "4px 6px", fontSize: "12px", width: "100%" }}
                          />
                        </div>
                        <span style={{ marginTop: "12px", color: "var(--text-muted)" }}>×</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>Depth (cm)</span>
                          <input
                            type="number"
                            value={displayD}
                            onChange={(e) => handleUpdateDimension(item.furnitureId, "depth", e.target.value)}
                            className="form-input"
                            style={{ padding: "4px 6px", fontSize: "12px", width: "100%" }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingItemIndex(null)}
                        className="btn-secondary"
                        style={{ padding: "3px 8px", fontSize: "11px", alignSelf: "flex-end", color: "#059669", fontWeight: 700 }}
                      >
                        <Check size={12} />
                        <span>Apply & Live Update</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Catalog to Add New Furniture */}
        {sidebarTab === "catalog" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "6px" }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCatalogCategory(cat.id)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: catalogCategory === cat.id ? "var(--primary)" : "var(--bg-input)",
                    color: catalogCategory === cat.id ? "#fff" : "var(--text-secondary)",
                    border: "none",
                    whiteSpace: "nowrap"
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search catalog..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="form-input"
              style={{ fontSize: "12px", padding: "6px 10px" }}
            />

            {furnitureCatalog
              .filter(item => (catalogCategory === "all" || item.category === catalogCategory) &&
                item.name.toLowerCase().includes(catalogSearch.toLowerCase()))
              .map(item => {
                const custom = customDimensions[item.id];
                const displayW = custom?.width || item.width;
                const displayD = custom?.depth || item.depth;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "10px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <MiniPreview id={item.id} width={displayW} depth={displayD} />
                      <div>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {item.name}
                        </span>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {displayW} × {displayD} cm
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddItem(item.id)}
                      className="btn-primary"
                      style={{ padding: "4px 10px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Plus size={12} />
                      <span>Add</span>
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <main style={{ maxWidth: "1440px", margin: "0 auto", padding: "28px 24px 80px", width: "100%" }}>
        {/* Top Navigation & Status Bar (Sticky beyond initial scroll) */}
        <div style={{
          position: "sticky",
          top: "68px",
          zIndex: 40,
          background: "rgba(251, 249, 245, 0.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          padding: "14px 22px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(226, 218, 208, 0.85)",
          boxShadow: "0 6px 24px rgba(50, 35, 20, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link to="/room-setup" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                <ArrowLeft size={14} />
                <span>Back to Setup</span>
              </Link>
              <span style={{ color: "var(--border-medium)" }}>/</span>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
                {room?.name || "My Room"} ({room?.roomType?.toUpperCase() || "BEDROOM"}) • {room?.width} × {room?.height} cm
              </span>
            </div>
            <h1 style={{ fontSize: "28px", marginTop: "4px" }}>Generated Layout Options</h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* View Mode Toggle: 2D vs 3D */}
            <div style={{
              display: "flex",
              background: "var(--bg-input)",
              padding: "4px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)"
            }}>
              <button
                type="button"
                onClick={() => setViewMode("2d")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  fontWeight: 700,
                  background: viewMode === "2d" ? "#ffffff" : "transparent",
                  color: viewMode === "2d" ? "var(--primary)" : "var(--text-secondary)",
                  boxShadow: viewMode === "2d" ? "var(--shadow-sm)" : "none"
                }}
              >
                <Eye size={15} />
                <span>2D Blueprint</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("3d")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  fontWeight: 700,
                  background: viewMode === "3d" ? "linear-gradient(135deg, #b47b48 0%, #9c6536 100%)" : "transparent",
                  color: viewMode === "3d" ? "#ffffff" : "var(--text-secondary)",
                  boxShadow: viewMode === "3d" ? "var(--shadow-sm)" : "none"
                }}
              >
                <Box size={15} />
                <span>3D Studio</span>
              </button>
            </div>

            {/* AI Style Presets Trigger Button */}
            <button
              type="button"
              onClick={() => setIsStyleModalOpen(true)}
              className="btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                border: "1px solid #d4b28c",
                background: "#ffffff",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-sm)",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              title="Explore AI Style Recommendations & Material Presets"
            >
              <span>🎨</span>
              <span style={{ color: "var(--text-primary)" }}>{activeStyle?.name || "AI Styles"}</span>
              <span style={{
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "12px",
                background: "rgba(180, 123, 72, 0.12)",
                color: "#b47b48",
                fontWeight: 700
              }}>
                {activeStyle?.badge || "Preset"}
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px",
            background: "rgba(225, 29, 72, 0.1)", border: "1px solid rgba(225, 29, 72, 0.3)",
            borderRadius: "var(--radius-md)", color: "#be123c", fontSize: "14px", marginBottom: "20px"
          }}>
            <AlertCircle size={18} /><span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px",
            background: "rgba(5, 150, 105, 0.1)", border: "1px solid rgba(5, 150, 105, 0.3)",
            borderRadius: "var(--radius-md)", color: "#047857", fontSize: "14px", marginBottom: "20px"
          }}>
            <CheckCircle2 size={18} /><span>{success}</span>
          </div>
        )}

        {/* Layout Selection Grid */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Distinct Layout Archetypes ({generatedLayouts.length} Options)
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Optimized for Spatial Diversity, Storage Orientation & Ergonomics
            </span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "14px"
          }}>
            {generatedLayouts.map((item, index) => {
              const isSelected = index === selectedIndex;
              const isCurrentConfirmed = room?.selectedLayoutId === item._id;

              return (
                <div
                  key={item._id || index}
                  onClick={() => setSelectedIndex(index)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-md)",
                    background: isSelected ? "rgba(180, 123, 72, 0.12)" : "var(--bg-card)",
                    border: `2px solid ${isSelected ? "var(--primary)" : "var(--border-subtle)"}`,
                    boxShadow: isSelected ? "0 4px 14px rgba(180, 123, 72, 0.2)" : "var(--shadow-sm)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
                      Option #{index + 1}
                    </span>
                    {isCurrentConfirmed ? (
                      <span className="badge badge-success">
                        <Check size={11} /> Confirmed
                      </span>
                    ) : (
                      <span className="badge badge-tag" style={{ color: "#059669", borderColor: "rgba(5, 150, 105, 0.2)" }}>
                        Pareto Optimal
                      </span>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px" }}>
                    <div style={{ background: "rgba(180, 123, 72, 0.08)", padding: "4px 8px", borderRadius: "4px" }}>
                      Traffic: {Math.round((item.scores?.trafficFlow || 0) * 100)}%
                    </div>
                    <div style={{ background: "rgba(2, 132, 199, 0.08)", padding: "4px 8px", borderRadius: "4px" }}>
                      Light: {Math.round((item.scores?.lightExposure || 0) * 100)}%
                    </div>
                    <div style={{ background: "rgba(5, 150, 105, 0.08)", padding: "4px 8px", borderRadius: "4px" }}>
                      Clear: {Math.round((item.scores?.clearance || 0) * 100)}%
                    </div>
                    <div style={{ background: "rgba(217, 119, 6, 0.08)", padding: "4px 8px", borderRadius: "4px" }}>
                      Cluster: {Math.round((item.scores?.clustering || 0) * 100)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Presentation Area */}
        {selectedLayout && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "28px", alignItems: "start" }}>
            {/* Center Canvas View (2D or 3D) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {viewMode === "2d" ? (
                <RoomCanvas
                  roomWidth={room.width}
                  roomHeight={room.height}
                  layout={selectedLayout.layout}
                  furnitureCatalog={furnitureCatalog}
                  doors={room.doors}
                  windows={room.windows}
                  interactive={true}
                  editable={true}
                  customDimensions={customDimensions}
                  onLayoutChange={handleLayoutChange}
                />
              ) : (
                <Room3DView
                  roomWidth={room.width}
                  roomHeight={room.height}
                  layout={selectedLayout.layout}
                  furnitureCatalog={furnitureCatalog}
                  doors={room.doors}
                  windows={room.windows}
                  roomType={room.roomType || "bedroom"}
                  northFacing={room.northFacing || "top"}
                  customDimensions={customDimensions}
                  activeStyle={activeStyle}
                  onLayoutChange={handleLayoutChange}
                />
              )}

              {/* Export Buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                  onClick={() => {
                    import("html2canvas").then((mod) => {
                      const html2canvas = mod.default;
                      const canvasEl = document.querySelector("[style*='background: rgb(244, 240, 230)']") ||
                        document.querySelector("[style*='background: #f4f0e6']") ||
                        document.querySelector(".glass-panel");
                      if (canvasEl) {
                        html2canvas(canvasEl, { backgroundColor: "#f4f0e6", scale: 2 }).then((canvas) => {
                          const link = document.createElement("a");
                          link.download = `${room.name.toLowerCase().replace(/\s+/g, "-")}-layout-${selectedIndex + 1}.png`;
                          link.href = canvas.toDataURL("image/png");
                          link.click();
                        });
                      }
                    }).catch(() => {
                      alert("Export failed.");
                    });
                  }}
                  className="btn-secondary"
                  style={{ fontSize: "13px" }}
                >
                  <Share2 size={14} />
                  <span>Export 2D CAD as PNG</span>
                </button>
              </div>
            </div>

            {/* Right Side: Score Breakdown & Confirmation Card */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="glass-panel" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>
                  Option #{selectedIndex + 1} Metrics
                </h3>

                <ScoreBreakdown scores={selectedLayout.scores} />

                {/* Overlap / Collision Warning */}
                {collisionCount > 0 && (
                  <div style={{
                    marginTop: "16px",
                    padding: "12px 14px",
                    background: "rgba(225, 29, 72, 0.08)",
                    border: "1.5px solid rgba(225, 29, 72, 0.35)",
                    borderRadius: "var(--radius-md)",
                    color: "#be123c",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px"
                  }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
                    <div>
                      <strong>Overlap Detected ({collisionCount} items)</strong>
                      <div style={{ marginTop: "2px", color: "var(--text-secondary)" }}>
                        Some furniture items are touching or overlapping. Please drag them apart to clear all paths before confirming.
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm Action Button */}
                <div style={{ marginTop: "20px" }}>
                  <button
                    onClick={handleConfirm}
                    disabled={isConfirming || isConfirmed || collisionCount > 0}
                    className={isConfirmed ? "btn-secondary" : "btn-primary"}
                    style={{
                      width: "100%",
                      padding: "14px",
                      fontSize: "15px",
                      fontWeight: 700,
                      opacity: collisionCount > 0 ? 0.6 : 1,
                      cursor: collisionCount > 0 ? "not-allowed" : "pointer"
                    }}
                  >
                    {isConfirming ? (
                      <span>Saving Confirmation...</span>
                    ) : isConfirmed ? (
                      <>
                        <CheckCircle2 size={18} color="#059669" />
                        <span>Confirmed Arrangement</span>
                      </>
                    ) : collisionCount > 0 ? (
                      <>
                        <AlertTriangle size={18} />
                        <span>Fix Overlaps to Confirm</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Confirm This Layout</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Style Recommendations Modal */}
        <StyleModal
          isOpen={isStyleModalOpen}
          onClose={() => setIsStyleModalOpen(false)}
          activeStyleId={activeStyle?.id}
          onApplyStyle={(style) => setActiveStyle(style)}
        />
      </main>
    </div>
  );
}

export default LayoutView;