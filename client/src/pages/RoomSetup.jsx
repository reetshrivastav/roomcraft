import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Plus, Trash2, Sliders, CheckCircle2,
  Layers, DoorOpen, Sun, Search, AlertCircle, ArrowRight
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

function RoomSetup() {
  const navigate = useNavigate();

  const [room, setRoom] = useState({
    width: 500,
    height: 400,
    doors: [{ x: 250, y: 0, wall: "top" }],
    windows: [{ x: 400, y: 0, wall: "top" }],
    furnitureSelection: ["double-bed", "wardrobe", "nightstand", "desk", "office-chair"]
  });

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

  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    const num = value === "" ? "" : Number(value);
    setRoom(prev => ({ ...prev, [name]: num }));
  };

  // Multi-door management
  const addDoor = () => {
    setRoom(prev => ({
      ...prev,
      doors: [...prev.doors, { x: Math.round(prev.width / 2), y: 0, wall: "top" }]
    }));
  };

  const removeDoor = (index) => {
    setRoom(prev => ({
      ...prev,
      doors: prev.doors.filter((_, i) => i !== index)
    }));
  };

  const updateDoor = (index, field, value) => {
    setRoom(prev => {
      const updated = [...prev.doors];
      const door = { ...updated[index], [field]: field === "wall" ? value : Number(value) };
      // Align coordinates to wall
      if (field === "wall") {
        if (value === "top" || value === "bottom") {
          door.x = Math.min(door.x || 100, prev.width);
          door.y = value === "top" ? 0 : prev.height;
        } else {
          door.x = value === "left" ? 0 : prev.width;
          door.y = Math.min(door.y || 100, prev.height);
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
    setRoom(prev => ({
      ...prev,
      windows: prev.windows.filter((_, i) => i !== index)
    }));
  };

  const updateWindow = (index, field, value) => {
    setRoom(prev => {
      const updated = [...prev.windows];
      const win = { ...updated[index], [field]: field === "wall" ? value : Number(value) };
      if (field === "wall") {
        if (value === "top" || value === "bottom") {
          win.x = Math.min(win.x || 100, prev.width);
          win.y = value === "top" ? 0 : prev.height;
        } else {
          win.x = value === "left" ? 0 : prev.width;
          win.y = Math.min(win.y || 100, prev.height);
        }
      }
      updated[index] = win;
      return { ...prev, windows: updated };
    });
  };

  // Furniture selection
  const toggleFurniture = (furnitureId) => {
    setRoom(prev => {
      const exists = prev.furnitureSelection.includes(furnitureId);
      const updated = exists
        ? prev.furnitureSelection.filter(id => id !== furnitureId)
        : [...prev.furnitureSelection, furnitureId];
      return { ...prev, furnitureSelection: updated };
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

      // 1. Create room
      const roomResponse = await createRoom(room);
      const roomId = roomResponse.room?._id;

      if (!roomId) {
        throw new Error("Failed to obtain room ID from backend.");
      }

      // 2. Trigger genetic algorithm generation
      await generateLayouts(roomId);

      // 3. Cache current room in session for rapid hydration
      sessionStorage.setItem("roomcraft-current-room", JSON.stringify(roomResponse.room));

      // 4. Navigate cleanly with React Router
      navigate(`/layout?roomId=${roomId}`);
    } catch (err) {
      console.error("Room setup failed:", err);
      setError(err.message || "Failed to generate layouts.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      <Navbar />

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px 80px", width: "100%" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "28px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Room Architecture & Furniture Builder
          </span>
          <h1 style={{ fontSize: "32px", margin: "4px 0 8px" }}>Configure Your Space</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            Set room dimensions, door openings, window positions, and select furniture pieces for evolutionary optimization.
          </p>
        </div>

        {error && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            background: "rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.4)",
            borderRadius: "var(--radius-md)",
            color: "#fda4af",
            fontSize: "14px",
            marginBottom: "24px"
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>
          {/* Left Column: Form Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Dimensions Card */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Sliders size={18} color="#6366f1" />
                <span>1. Room Dimensions (cm)</span>
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="width">Width (X Axis)</label>
                  <input
                    id="width"
                    name="width"
                    type="number"
                    min="200"
                    max="1500"
                    value={room.width}
                    onChange={handleDimensionChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="height">Length / Height (Y Axis)</label>
                  <input
                    id="height"
                    name="height"
                    type="number"
                    min="200"
                    max="1500"
                    value={room.height}
                    onChange={handleDimensionChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Doors & Windows Card */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <DoorOpen size={18} color="#f59e0b" />
                  <span>2. Doors & Openings ({room.doors.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={addDoor}
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                >
                  <Plus size={14} />
                  <span>Add Door</span>
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                {room.doors.map((door, idx) => (
                  <div
                    key={`door-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "var(--bg-input)",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)"
                    }}
                  >
                    <select
                      value={door.wall}
                      onChange={(e) => updateDoor(idx, "wall", e.target.value)}
                      className="form-input"
                      style={{ width: "110px", padding: "6px 8px" }}
                    >
                      <option value="top">Top Wall</option>
                      <option value="right">Right Wall</option>
                      <option value="bottom">Bottom Wall</option>
                      <option value="left">Left Wall</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Pos (cm)"
                      value={door.wall === "top" || door.wall === "bottom" ? door.x : door.y}
                      onChange={(e) => updateDoor(idx, door.wall === "top" || door.wall === "bottom" ? "x" : "y", e.target.value)}
                      className="form-input"
                      style={{ width: "100px", padding: "6px 8px" }}
                    />

                    <span style={{ fontSize: "11px", color: "var(--text-muted)", flex: 1 }}>
                      ({door.x}, {door.y}) cm
                    </span>

                    {room.doors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDoor(idx)}
                        style={{ color: "#f43f5e", background: "transparent" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Windows Section */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sun size={18} color="#06b6d4" />
                  <span>3. Windows & Sunlight ({room.windows.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={addWindow}
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                >
                  <Plus size={14} />
                  <span>Add Window</span>
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {room.windows.map((win, idx) => (
                  <div
                    key={`win-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "var(--bg-input)",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)"
                    }}
                  >
                    <select
                      value={win.wall}
                      onChange={(e) => updateWindow(idx, "wall", e.target.value)}
                      className="form-input"
                      style={{ width: "110px", padding: "6px 8px" }}
                    >
                      <option value="top">Top Wall</option>
                      <option value="right">Right Wall</option>
                      <option value="bottom">Bottom Wall</option>
                      <option value="left">Left Wall</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Pos (cm)"
                      value={win.wall === "top" || win.wall === "bottom" ? win.x : win.y}
                      onChange={(e) => updateWindow(idx, win.wall === "top" || win.wall === "bottom" ? "x" : "y", e.target.value)}
                      className="form-input"
                      style={{ width: "100px", padding: "6px 8px" }}
                    />

                    <span style={{ fontSize: "11px", color: "var(--text-muted)", flex: 1 }}>
                      ({win.x}, {win.y}) cm
                    </span>

                    {room.windows.length > 0 && (
                      <button
                        type="button"
                        onClick={() => removeWindow(idx)}
                        style={{ color: "#f43f5e", background: "transparent" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Furniture Catalog Selection Card */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Layers size={18} color="#10b981" />
                  <span>4. Furniture Items ({room.furnitureSelection.length} Selected)</span>
                </h3>

                <div style={{ position: "relative", width: "160px" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: "30px", fontSize: "12px", width: "100%", padding: "6px 8px 6px 30px" }}
                  />
                </div>
              </div>

              {/* Category Filter Chips */}
              <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "12px", marginBottom: "12px" }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "12px",
                      fontWeight: 500,
                      background: selectedCategory === cat.id ? "var(--primary)" : "var(--bg-input)",
                      color: selectedCategory === cat.id ? "#ffffff" : "var(--text-secondary)",
                      border: "1px solid " + (selectedCategory === cat.id ? "transparent" : "var(--border-subtle)"),
                      whiteSpace: "nowrap"
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Furniture List */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "10px",
                maxHeight: "320px",
                overflowY: "auto",
                paddingRight: "6px"
              }}>
                {filteredCatalog.map(item => {
                  const isSelected = room.furnitureSelection.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleFurniture(item.id)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "10px",
                        borderRadius: "var(--radius-md)",
                        background: isSelected ? "rgba(99, 102, 241, 0.18)" : "var(--bg-input)",
                        border: "1.5px solid " + (isSelected ? "var(--primary)" : "var(--border-subtle)"),
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                          {item.name}
                        </span>
                        {isSelected && <CheckCircle2 size={16} color="#6366f1" />}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
                        <span style={{ fontFamily: "var(--font-mono)" }}>
                          {item.width}×{item.depth} cm
                        </span>
                        <span style={{ textTransform: "capitalize", color: "#a5b4fc" }}>
                          {item.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting || room.furnitureSelection.length === 0}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "16px",
                borderRadius: "var(--radius-lg)"
              }}
            >
              {isSubmitting ? (
                <>
                  <Sparkles size={20} className="pulse-glow" />
                  <span>Running Genetic Algorithm (20 Generations)...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Generate Pareto Layouts</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>

          {/* Right Column: Real-Time Blueprint Live Preview */}
          <div style={{ position: "sticky", top: "90px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "16px", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "16px" }}>Real-Time Floorplan Blueprint</h3>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Updates live with doors, windows, and dimensions
                  </span>
                </div>

                <span className="badge badge-tag" style={{ fontFamily: "var(--font-mono)" }}>
                  {room.width} × {room.height} cm
                </span>
              </div>

              <RoomCanvas
                roomWidth={room.width}
                roomHeight={room.height}
                layout={[]}
                furnitureCatalog={furnitureCatalog}
                doors={room.doors}
                windows={room.windows}
                interactive={false}
              />
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default RoomSetup;