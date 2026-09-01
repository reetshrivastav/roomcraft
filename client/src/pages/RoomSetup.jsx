import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, Plus, Minus, Trash2, Sliders, CheckCircle2, 
  Layers, DoorOpen, Sun, Search, AlertCircle, ArrowRight, Utensils 
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

  // Quantity Management for furniture
  const getItemCount = (id) => {
    return room.furnitureSelection.filter(item => item === id).length;
  };

  const setItemCount = (id, count) => {
    const clampedCount = Math.max(0, Math.min(8, count));
    setRoom(prev => {
      const otherItems = prev.furnitureSelection.filter(item => item !== id);
      const newDuplicates = Array(clampedCount).fill(id);
      return { ...prev, furnitureSelection: [...otherItems, ...newDuplicates] };
    });
  };

  // Helper for 2, 4, 6 Dining Sets
  const addDiningSet = (chairCount = 4) => {
    setRoom(prev => {
      const withoutDining = prev.furnitureSelection.filter(
        id => id !== "dining-table" && id !== "dining-chair"
      );
      const chairs = Array(chairCount).fill("dining-chair");
      return {
        ...prev,
        furnitureSelection: [...withoutDining, "dining-table", ...chairs]
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

      const roomResponse = await createRoom(room);
      const roomId = roomResponse.room?._id;

      if (!roomId) {
        throw new Error("Failed to obtain room ID from backend.");
      }

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

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      <Navbar />

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px 80px", width: "100%" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "28px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            BIM Architectural Studio
          </span>
          <h1 style={{ fontSize: "32px", margin: "4px 0 8px" }}>Configure Room & Furniture</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            Set exact dimensions, door openings, sunlight windows, and choose furniture with custom quantities (e.g. Dining Sets with 2, 4, 6 chairs).
          </p>
        </div>

        {error && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            background: "rgba(225, 29, 72, 0.1)",
            border: "1px solid rgba(225, 29, 72, 0.3)",
            borderRadius: "var(--radius-md)",
            color: "#be123c",
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
                <Sliders size={18} color="#b47b48" />
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
                  <DoorOpen size={18} color="#b47b48" />
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
                        style={{ color: "#e11d48", background: "transparent" }}
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
                  <Sun size={18} color="#0284c7" />
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
                        style={{ color: "#e11d48", background: "transparent" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Furniture Catalog Selection Card with Multi-Quantity */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Layers size={18} color="#059669" />
                  <span>4. Furniture Selection ({room.furnitureSelection.length} Items)</span>
                </h3>

                <div style={{ position: "relative", width: "150px" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: "30px", fontSize: "12px", width: "100%", padding: "6px 8px 6px 30px" }}
                  />
                </div>
              </div>

              {/* Quick Dining Set Helper Buttons */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "14px",
                padding: "8px 12px",
                background: "rgba(180, 123, 72, 0.08)",
                borderRadius: "var(--radius-md)",
                border: "1px dashed rgba(180, 123, 72, 0.3)"
              }}>
                <Utensils size={15} color="#b47b48" />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>Dining Sets:</span>
                <button
                  type="button"
                  onClick={() => addDiningSet(2)}
                  className="btn-secondary"
                  style={{ padding: "3px 8px", fontSize: "11px" }}
                >
                  Table + 2 Chairs
                </button>
                <button
                  type="button"
                  onClick={() => addDiningSet(4)}
                  className="btn-secondary"
                  style={{ padding: "3px 8px", fontSize: "11px" }}
                >
                  Table + 4 Chairs
                </button>
                <button
                  type="button"
                  onClick={() => addDiningSet(6)}
                  className="btn-secondary"
                  style={{ padding: "3px 8px", fontSize: "11px" }}
                >
                  Table + 6 Chairs
                </button>
              </div>

              {/* Category Filter Chips */}
              <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "10px", marginBottom: "12px" }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "12px",
                      fontWeight: 600,
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

              {/* Furniture List with Quantity Counters */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "10px",
                maxHeight: "340px",
                overflowY: "auto",
                paddingRight: "6px"
              }}>
                {filteredCatalog.map(item => {
                  const count = getItemCount(item.id);
                  const isSelected = count > 0;

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "10px",
                        borderRadius: "var(--radius-md)",
                        background: isSelected ? "rgba(180, 123, 72, 0.12)" : "var(--bg-input)",
                        border: "1.5px solid " + (isSelected ? "var(--primary)" : "var(--border-subtle)"),
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {item.name}
                        </span>
                        {isSelected && (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#b47b48" }}>
                            ×{count}
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                        <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          {item.width}×{item.depth} cm
                        </span>

                        {/* Quantity Counter */}
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <button
                            type="button"
                            onClick={() => setItemCount(item.id, count - 1)}
                            disabled={count === 0}
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "4px",
                              background: count > 0 ? "var(--bg-card)" : "transparent",
                              border: "1px solid var(--border-subtle)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--text-primary)"
                            }}
                          >
                            <Minus size={12} />
                          </button>

                          <span style={{ fontSize: "12px", fontWeight: 700, minWidth: "16px", textAlign: "center" }}>
                            {count}
                          </span>

                          <button
                            type="button"
                            onClick={() => setItemCount(item.id, count + 1)}
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "4px",
                              background: "var(--bg-card)",
                              border: "1px solid var(--border-subtle)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--primary)"
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
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
                  <span>Generating Distinct Spatial Archetypes...</span>
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
                  <h3 style={{ fontSize: "16px" }}>Real-Time 2D Floorplan</h3>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Updates live with doors, windows, and perimeter dimensions
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