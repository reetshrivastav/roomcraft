import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Plus, Minus, Trash2, Sliders, CheckCircle2,
  Layers, DoorOpen, Sun, Search, AlertCircle, ArrowRight, Utensils,
  Compass, Home, Edit3, ChevronDown, ChevronUp, Check, AlertTriangle
} from "lucide-react";
import Navbar from "../components/Navbar";
import RoomCanvas from "../components/RoomCanvas";
import furnitureCatalog from "../furnitureCatalog.json";
import validateRoom from "../utils/validateRoom";
import { createRoom, generateLayouts } from "../services/room";

const CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "bed", label: "Beds" },
  { id: "storage", label: "Storage" },
  { id: "work", label: "Work & Office" },
  { id: "seating", label: "Seating" },
  { id: "table", label: "Tables" },
  { id: "entertainment", label: "Entertainment" }
];

const ROOM_TYPES = [
  { id: "bedroom", label: "🛏️ Bedroom", desc: "Sleeping, Storage, Relaxation" },
  { id: "living", label: "🛋️ Living Room", desc: "Lounging, Entertainment, Social" },
  { id: "office", label: "💻 Office", desc: "Work, Study, Productivity" },
  { id: "dining", label: "🍽️ Dining Room", desc: "Dining, Gathering, Meals" },
  { id: "studio", label: "🎨 Studio", desc: "Multi-purpose, Open Plan" }
];

function RoomSetup() {
  const navigate = useNavigate();

  const [room, setRoom] = useState({
    name: "My Room",
    roomType: "bedroom",
    width: 500,
    height: 400,
    northFacing: "top",
    doors: [{ x: 250, y: 0, wall: "top" }],
    windows: [{ x: 400, y: 0, wall: "top" }],
    furnitureSelection: ["double-bed", "wardrobe", "nightstand", "desk", "office-chair"]
  });

  const [customDimensions, setCustomDimensions] = useState({});
  const [expandedItem, setExpandedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for preset in sessionStorage
  useEffect(() => {
    const presetRaw = sessionStorage.getItem("roomcraft-preset");
    if (presetRaw) {
      try {
        const preset = JSON.parse(presetRaw);
        const [w, h] = preset.dimensions ? preset.dimensions.split("×").map(s => parseInt(s.trim())) : [500, 400];
        setRoom(prev => ({
          ...prev,
          width: w || prev.width,
          height: h || prev.height,
          furnitureSelection: preset.furniture || prev.furnitureSelection
        }));
        sessionStorage.removeItem("roomcraft-preset");
      } catch (e) {
        console.error("Failed to parse preset", e);
      }
    }
  }, []);

  // ========== SPACE HEALTH INDEX ==========
  const spaceHealth = useMemo(() => {
    const roomArea = room.width * room.height;
    let furnitureArea = 0;
    room.furnitureSelection.forEach(id => {
      const custom = customDimensions[id];
      const item = furnitureCatalog.find(f => f.id === id);
      if (item) {
        const w = custom?.width || item.width;
        const d = custom?.depth || item.depth;
        furnitureArea += w * d;
      }
    });
    const ratio = roomArea > 0 ? furnitureArea / roomArea : 0;
    const percent = Math.round(ratio * 100);

    if (ratio < 0.25) return { level: "spacious", color: "#059669", bg: "rgba(5, 150, 105, 0.1)", icon: "🟢", label: "Spacious", percent, tip: "Plenty of breathing room for comfortable circulation." };
    if (ratio < 0.38) return { level: "comfortable", color: "#d97706", bg: "rgba(217, 119, 6, 0.1)", icon: "🟡", label: "Comfortable", percent, tip: "Balanced layout. Ideal furniture-to-floor density." };
    return { level: "congested", color: "#e11d48", bg: "rgba(225, 29, 72, 0.1)", icon: "🔴", label: "Heavy Congestion Warning", percent, tip: "Selected furniture area is high (>38%). Layout may suffer overlaps or reduced walkways. Consider removing some items or enlarging room dimensions." };
  }, [room.width, room.height, room.furnitureSelection, customDimensions]);

  // Dynamic clamping for doors & windows when room dimension shrinks
  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    const num = value === "" ? "" : Number(value);

    setRoom(prev => {
      const nextW = name === "width" ? (typeof num === "number" && num > 0 ? num : prev.width) : prev.width;
      const nextH = name === "height" ? (typeof num === "number" && num > 0 ? num : prev.height) : prev.height;

      const updatedDoors = prev.doors.map(door => {
        const d = { ...door };
        if (d.wall === "top" || d.wall === "bottom") {
          d.x = Math.max(10, Math.min(nextW - 40, d.x));
          d.y = d.wall === "top" ? 0 : nextH;
        } else {
          d.x = d.wall === "left" ? 0 : nextW;
          d.y = Math.max(10, Math.min(nextH - 40, d.y));
        }
        return d;
      });

      const updatedWindows = prev.windows.map(win => {
        const w = { ...win };
        if (w.wall === "top" || w.wall === "bottom") {
          w.x = Math.max(10, Math.min(nextW - 40, w.x));
          w.y = w.wall === "top" ? 0 : nextH;
        } else {
          w.x = w.wall === "left" ? 0 : nextW;
          w.y = Math.max(10, Math.min(nextH - 40, w.y));
        }
        return w;
      });

      return {
        ...prev,
        [name]: num,
        doors: updatedDoors,
        windows: updatedWindows
      };
    });
  };

  // Multi-door management
  const addDoor = () => {
    setRoom(prev => ({
      ...prev,
      doors: [...prev.doors, { x: Math.round(prev.width / 2), y: 0, wall: "top" }]
    }));
  };

  const removeDoor = (index) => {
    setRoom(prev => ({ ...prev, doors: prev.doors.filter((_, i) => i !== index) }));
  };

  const updateDoor = (index, field, value) => {
    setRoom(prev => {
      const updated = [...prev.doors];
      const door = { ...updated[index], [field]: field === "wall" ? value : Number(value) };
      if (field === "wall") {
        if (value === "top" || value === "bottom") {
          door.x = Math.min(door.x || 100, prev.width - 40);
          door.y = value === "top" ? 0 : prev.height;
        } else {
          door.x = value === "left" ? 0 : prev.width;
          door.y = Math.min(door.y || 100, prev.height - 40);
        }
      }
      updated[index] = door;
      return { ...prev, doors: updated };
    });
  };

  // Multi-window management
  const addWindow = () => {
    setRoom(prev => ({
      ...prev,
      windows: [...prev.windows, { x: Math.round(prev.width / 2), y: 0, wall: "top" }]
    }));
  };

  const removeWindow = (index) => {
    setRoom(prev => ({ ...prev, windows: prev.windows.filter((_, i) => i !== index) }));
  };

  const updateWindow = (index, field, value) => {
    setRoom(prev => {
      const updated = [...prev.windows];
      const win = { ...updated[index], [field]: field === "wall" ? value : Number(value) };
      if (field === "wall") {
        if (value === "top" || value === "bottom") {
          win.x = Math.min(win.x || 100, prev.width - 40);
          win.y = value === "top" ? 0 : prev.height;
        } else {
          win.x = value === "left" ? 0 : prev.width;
          win.y = Math.min(win.y || 100, prev.height - 40);
        }
      }
      updated[index] = win;
      return { ...prev, windows: updated };
    });
  };

  // Quantity Management
  const getItemCount = (id) => room.furnitureSelection.filter(item => item === id).length;

  const setItemCount = (id, count) => {
    const clampedCount = Math.max(0, Math.min(8, count));
    setRoom(prev => {
      const otherItems = prev.furnitureSelection.filter(item => item !== id);
      const newDuplicates = Array(clampedCount).fill(id);
      return { ...prev, furnitureSelection: [...otherItems, ...newDuplicates] };
    });
  };

  const addDiningSet = (chairCount = 4) => {
    setRoom(prev => {
      const withoutDining = prev.furnitureSelection.filter(
        id => id !== "dining-table" && id !== "dining-chair"
      );
      const chairs = Array(chairCount).fill("dining-chair");
      return { ...prev, furnitureSelection: [...withoutDining, "dining-table", ...chairs] };
    });
  };

  // Custom dimensions with complete fallback
  const updateCustomDimension = (itemId, field, value) => {
    const defaultItem = furnitureCatalog.find(f => f.id === itemId);
    const num = Number(value);
    setCustomDimensions(prev => {
      const existing = prev[itemId] || {};
      const baseW = existing.width ?? defaultItem?.width ?? 50;
      const baseD = existing.depth ?? defaultItem?.depth ?? 50;
      return {
        ...prev,
        [itemId]: {
          width: field === "width" ? num : baseW,
          depth: field === "depth" ? num : baseD
        }
      };
    });
  };

  const filteredCatalog = furnitureCatalog.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validation = validateRoom(room);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      setError(typeof firstError === "string" ? firstError : "Please fix room boundaries before continuing.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = { ...room };

      // Sanitize customDimensions so only complete valid dimensions are sent
      const cleanedCustom = {};
      Object.entries(customDimensions).forEach(([k, v]) => {
        if (v && typeof v.width === "number" && typeof v.depth === "number" && v.width > 0 && v.depth > 0) {
          cleanedCustom[k] = { width: v.width, depth: v.depth };
        }
      });
      if (Object.keys(cleanedCustom).length > 0) {
        payload.customDimensions = cleanedCustom;
      }

      const roomResponse = await createRoom(payload);
      const roomId = roomResponse.room?._id;

      if (!roomId) throw new Error("Failed to obtain room ID from backend.");

      await generateLayouts(roomId);
      sessionStorage.setItem("roomcraft-current-room", JSON.stringify(roomResponse.room));
      navigate(`/layout?roomId=${roomId}`);
    } catch (err) {
      console.error("Room setup failed:", err);
      setError(err.message || "Failed to generate layouts.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mini 2D preview rectangle for a furniture item
  const FurnitureMiniPreview = ({ item }) => {
    const custom = customDimensions[item.id];
    const w = custom?.width || item.width;
    const d = custom?.depth || item.depth;
    const maxDim = Math.max(w, d);
    const scale = 28 / maxDim;
    return (
      <div style={{
        width: Math.round(w * scale),
        height: Math.round(d * scale),
        background: "rgba(180, 123, 72, 0.25)",
        border: "1.5px solid #b47b48",
        borderRadius: "2px",
        minWidth: "8px",
        minHeight: "8px"
      }} title={`${w}×${d} cm`} />
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      <Navbar />

      <main className="responsive-main" style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px 80px", width: "100%" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "28px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            BIM Architectural Studio
          </span>
          <h1 style={{ fontSize: "32px", margin: "4px 0 8px" }}>Configure Room & Furniture</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            Set dimensions, room type, doors, windows, compass direction, and furniture with custom sizes.
          </p>
        </div>

        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "12px 16px", background: "rgba(225, 29, 72, 0.1)",
            border: "1px solid rgba(225, 29, 72, 0.3)", borderRadius: "var(--radius-md)",
            color: "#be123c", fontSize: "14px", marginBottom: "24px"
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="room-setup-grid">
          {/* Left Column: Form Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Room Name & Type Card */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Home size={18} color="#b47b48" />
                <span>1. Room Identity</span>
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="roomName">Room Name</label>
                  <input
                    id="roomName"
                    type="text"
                    value={room.name}
                    onChange={(e) => setRoom(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                    placeholder="e.g. Master Bedroom"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="roomType">Room Type</label>
                  <select
                    id="roomType"
                    value={room.roomType}
                    onChange={(e) => setRoom(prev => ({ ...prev, roomType: e.target.value }))}
                    className="form-input"
                  >
                    {ROOM_TYPES.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{
                padding: "8px 12px", background: "rgba(180, 123, 72, 0.06)",
                borderRadius: "var(--radius-sm)", fontSize: "12px", color: "var(--text-muted)"
              }}>
                {ROOM_TYPES.find(rt => rt.id === room.roomType)?.desc}
              </div>
            </div>

            {/* Dimensions Card */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Sliders size={18} color="#b47b48" />
                <span>2. Room Dimensions (cm)</span>
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="width">Width (X Axis)</label>
                  <input id="width" name="width" type="number" min="200" max="1500"
                    value={room.width} onChange={handleDimensionChange}
                    className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="height">Length / Depth (Y Axis)</label>
                  <input id="height" name="height" type="number" min="200" max="1500"
                    value={room.height} onChange={handleDimensionChange}
                    className="form-input" required />
                </div>
              </div>

              {/* Space Health Index */}
              <div style={{
                marginTop: "16px", padding: "12px 16px",
                background: spaceHealth.bg,
                border: `1.5px solid ${spaceHealth.color}55`,
                borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "center", gap: "12px"
              }}>
                <span style={{ fontSize: "22px" }}>{spaceHealth.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: spaceHealth.color }}>
                      {spaceHealth.label} ({spaceHealth.percent}% Floor Space Used)
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {spaceHealth.tip}
                  </div>
                  <div style={{
                    marginTop: "8px", height: "5px", background: "rgba(0,0,0,0.08)",
                    borderRadius: "3px", overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${Math.min(100, spaceHealth.percent * 2)}%`,
                      height: "100%", background: spaceHealth.color,
                      borderRadius: "3px", transition: "width 0.3s ease"
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Doors & Windows Card */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <DoorOpen size={18} color="#b47b48" />
                  <span>3. Doors & Openings ({room.doors.length})</span>
                </h3>
                <button type="button" onClick={addDoor} className="btn-secondary" style={{ padding: "4px 10px", fontSize: "12px" }}>
                  <Plus size={14} /><span>Add Door</span>
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                {room.doors.map((door, idx) => (
                  <div key={`door-${idx}`} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    background: "var(--bg-input)", padding: "8px 12px", borderRadius: "var(--radius-md)"
                  }}>
                    <select value={door.wall} onChange={(e) => updateDoor(idx, "wall", e.target.value)}
                      className="form-input" style={{ width: "110px", padding: "6px 8px" }}>
                      <option value="top">North Wall</option>
                      <option value="right">East Wall</option>
                      <option value="bottom">South Wall</option>
                      <option value="left">West Wall</option>
                    </select>
                    <input type="number" placeholder="Pos (cm)"
                      value={door.wall === "top" || door.wall === "bottom" ? door.x : door.y}
                      onChange={(e) => updateDoor(idx, door.wall === "top" || door.wall === "bottom" ? "x" : "y", e.target.value)}
                      className="form-input" style={{ width: "100px", padding: "6px 8px" }} />
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", flex: 1 }}>
                      ({door.x}, {door.y}) cm
                    </span>
                    {room.doors.length > 1 && (
                      <button type="button" onClick={() => removeDoor(idx)} style={{ color: "#e11d48", background: "transparent" }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Windows Section */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sun size={18} color="#0284c7" />
                  <span>4. Windows & Sunlight ({room.windows.length})</span>
                </h3>
                <button type="button" onClick={addWindow} className="btn-secondary" style={{ padding: "4px 10px", fontSize: "12px" }}>
                  <Plus size={14} /><span>Add Window</span>
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                {room.windows.map((win, idx) => (
                  <div key={`win-${idx}`} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    background: "var(--bg-input)", padding: "8px 12px", borderRadius: "var(--radius-md)"
                  }}>
                    <select value={win.wall} onChange={(e) => updateWindow(idx, "wall", e.target.value)}
                      className="form-input" style={{ width: "110px", padding: "6px 8px" }}>
                      <option value="top">North Wall</option>
                      <option value="right">East Wall</option>
                      <option value="bottom">South Wall</option>
                      <option value="left">West Wall</option>
                    </select>
                    <input type="number" placeholder="Pos (cm)"
                      value={win.wall === "top" || win.wall === "bottom" ? win.x : win.y}
                      onChange={(e) => updateWindow(idx, win.wall === "top" || win.wall === "bottom" ? "x" : "y", e.target.value)}
                      className="form-input" style={{ width: "100px", padding: "6px 8px" }} />
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", flex: 1 }}>
                      ({win.x}, {win.y}) cm
                    </span>
                    {room.windows.length > 0 && (
                      <button type="button" onClick={() => removeWindow(idx)} style={{ color: "#e11d48", background: "transparent" }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* North Facing Compass Selector */}
              <div style={{
                padding: "12px 16px", background: "rgba(2, 132, 199, 0.06)",
                borderRadius: "var(--radius-md)", border: "1px dashed rgba(2, 132, 199, 0.2)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Compass size={16} color="#0284c7" />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                    North Faces
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    (Controls sunlight direction)
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { wall: "top", label: "↑ Top" },
                    { wall: "right", label: "→ Right" },
                    { wall: "bottom", label: "↓ Bottom" },
                    { wall: "left", label: "← Left" }
                  ].map(dir => (
                    <button key={dir.wall} type="button"
                      onClick={() => setRoom(prev => ({ ...prev, northFacing: dir.wall }))}
                      style={{
                        padding: "6px 12px", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 600,
                        background: room.northFacing === dir.wall ? "#0284c7" : "var(--bg-input)",
                        color: room.northFacing === dir.wall ? "#fff" : "var(--text-secondary)",
                        border: "1px solid " + (room.northFacing === dir.wall ? "transparent" : "var(--border-subtle)")
                      }}>
                      {dir.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Furniture Catalog Selection Card */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Layers size={18} color="#059669" />
                  <span>5. Furniture Selection ({room.furnitureSelection.length} Items)</span>
                </h3>
                <div style={{ position: "relative", width: "150px" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input type="text" placeholder="Filter..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input" style={{ paddingLeft: "30px", fontSize: "12px", width: "100%", padding: "6px 8px 6px 30px" }} />
                </div>
              </div>

              {/* Quick Dining Set Helper */}
              <div style={{
                display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px",
                padding: "8px 12px", background: "rgba(180, 123, 72, 0.08)",
                borderRadius: "var(--radius-md)", border: "1px dashed rgba(180, 123, 72, 0.3)"
              }}>
                <Utensils size={15} color="#b47b48" />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>Dining Sets:</span>
                {[2, 4, 6].map(n => (
                  <button key={n} type="button" onClick={() => addDiningSet(n)}
                    className="btn-secondary" style={{ padding: "3px 8px", fontSize: "11px" }}>
                    Table + {n} Chairs
                  </button>
                ))}
              </div>

              {/* Category Filter Chips */}
              <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "10px", marginBottom: "12px" }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: "12px", fontWeight: 600,
                      background: selectedCategory === cat.id ? "var(--primary)" : "var(--bg-input)",
                      color: selectedCategory === cat.id ? "#ffffff" : "var(--text-secondary)",
                      border: "1px solid " + (selectedCategory === cat.id ? "transparent" : "var(--border-subtle)"),
                      whiteSpace: "nowrap"
                    }}>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Furniture Grid with Mini-Preview, Quantity, Custom Dimensions */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "10px", maxHeight: "420px", overflowY: "auto", paddingRight: "6px"
              }}>
                {filteredCatalog.map(item => {
                  const count = getItemCount(item.id);
                  const isSelected = count > 0;
                  const isExpanded = expandedItem === item.id;
                  const custom = customDimensions[item.id];
                  const displayW = custom?.width || item.width;
                  const displayD = custom?.depth || item.depth;
                  const hasCustomSize = !!custom?.width || !!custom?.depth;

                  return (
                    <div key={item.id} style={{
                      display: "flex", flexDirection: "column",
                      padding: "10px", borderRadius: "var(--radius-md)",
                      background: isSelected ? "rgba(180, 123, 72, 0.12)" : "var(--bg-input)",
                      border: "1.5px solid " + (isSelected ? "var(--primary)" : "var(--border-subtle)"),
                      transition: "all 0.15s ease"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <FurnitureMiniPreview item={{ ...item, width: displayW, depth: displayD, id: item.id }} />
                          <div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                              {item.name}
                            </span>
                            {isSelected && (
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#b47b48", marginLeft: "6px" }}>
                                ×{count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: hasCustomSize ? "var(--primary)" : "var(--text-muted)", fontWeight: hasCustomSize ? 700 : 400 }}>
                            {displayW}×{displayD} cm {hasCustomSize ? "★" : ""}
                          </span>
                          <button type="button"
                            onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                            style={{ background: isExpanded ? "var(--primary)" : "transparent", color: isExpanded ? "#fff" : "var(--text-muted)", padding: "2px 4px", borderRadius: "4px" }}
                            title="Resize dimensions">
                            <Edit3 size={12} />
                          </button>
                        </div>

                        {/* Quantity Counter */}
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <button type="button" onClick={() => setItemCount(item.id, count - 1)} disabled={count === 0}
                            style={{
                              width: "22px", height: "22px", borderRadius: "4px",
                              background: count > 0 ? "var(--bg-card)" : "transparent",
                              border: "1px solid var(--border-subtle)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "var(--text-primary)"
                            }}>
                            <Minus size={12} />
                          </button>
                          <span style={{ fontSize: "12px", fontWeight: 700, minWidth: "16px", textAlign: "center" }}>
                            {count}
                          </span>
                          <button type="button" onClick={() => setItemCount(item.id, count + 1)}
                            style={{
                              width: "22px", height: "22px", borderRadius: "4px",
                              background: "var(--bg-card)",
                              border: "1px solid var(--border-subtle)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "var(--primary)"
                            }}>
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Custom Dimensions with Confirm Button */}
                      {isExpanded && (
                        <div style={{
                          marginTop: "8px", padding: "10px", background: "#ffffff",
                          borderRadius: "var(--radius-sm)", border: "1px solid var(--border-medium)",
                          boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "8px"
                        }}>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                              <label style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>Width (cm)</label>
                              <input type="number" min="20" max="400"
                                value={displayW}
                                onChange={(e) => updateCustomDimension(item.id, "width", e.target.value)}
                                className="form-input" style={{ padding: "4px 6px", fontSize: "12px" }} />
                            </div>
                            <span style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "14px" }}>×</span>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                              <label style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>Depth (cm)</label>
                              <input type="number" min="20" max="400"
                                value={displayD}
                                onChange={(e) => updateCustomDimension(item.id, "depth", e.target.value)}
                                className="form-input" style={{ padding: "4px 6px", fontSize: "12px" }} />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedItem(null)}
                            className="btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px", alignSelf: "flex-end", color: "#059669", fontWeight: 700 }}
                          >
                            <Check size={12} />
                            <span>Apply Size ({displayW}×{displayD})</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Congestion Alert if Space Health is Congested */}
            {spaceHealth.level === "congested" && (
              <div style={{
                padding: "14px 16px", background: "rgba(225, 29, 72, 0.08)",
                border: "1.5px solid rgba(225, 29, 72, 0.4)", borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "flex-start", gap: "10px", color: "#be123c"
              }}>
                <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div style={{ fontSize: "13px" }}>
                  <strong>High Space Congestion Alert ({spaceHealth.percent}%):</strong>
                  <div style={{ marginTop: "3px", fontSize: "12px" }}>
                    The selected furniture items take up too much room area. This may cause crowded walking paths or furniture collisions. You can still generate layouts, but consider removing some pieces or increasing the room dimensions for optimal breathing space.
                  </div>
                </div>
              </div>
            )}

            {/* Submit CTA */}
            <button type="submit" disabled={isSubmitting || room.furnitureSelection.length === 0}
              className="btn-primary"
              style={{ width: "100%", padding: "16px", fontSize: "16px", borderRadius: "var(--radius-lg)" }}>
              {isSubmitting ? (
                <><Sparkles size={20} className="pulse-glow" /><span>Generating Distinct Spatial Archetypes...</span></>
              ) : (
                <><Sparkles size={20} /><span>Generate Pareto Layouts</span><ArrowRight size={20} /></>
              )}
            </button>
          </div>

          {/* Right Column: Real-Time Blueprint Preview with Horizontal Scroll Container */}
          <div style={{ position: "sticky", top: "90px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "100%", overflow: "hidden" }}>
            <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", width: "100%", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "16px", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "16px" }}>Real-Time 2D Floorplan</h3>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Live door & window perimeter positioning
                  </span>
                </div>
                <span className="badge badge-tag" style={{ fontFamily: "var(--font-mono)" }}>
                  {room.width} × {room.height} cm
                </span>
              </div>

              <div style={{ width: "100%", overflowX: "auto", overflowY: "hidden", display: "flex", justifyContent: "center", paddingBottom: "6px" }}>
                <RoomCanvas
                  roomWidth={room.width}
                  roomHeight={room.height}
                  layout={[]}
                  furnitureCatalog={furnitureCatalog}
                  doors={room.doors}
                  windows={room.windows}
                  customDimensions={customDimensions}
                  interactive={false}
                />
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default RoomSetup;