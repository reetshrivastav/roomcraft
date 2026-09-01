import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  Sparkles, CheckCircle2, Layers, Compass, ArrowLeft,
  RotateCw, Share2, Box, Eye, Check, AlertCircle
} from "lucide-react";
import Navbar from "../components/Navbar";
import RoomCanvas from "../components/RoomCanvas";
import Room3DView from "../components/Room3DView";
import ScoreBreakdown from "../components/ScoreBreakdown";
import furnitureCatalog from "../furnitureCatalog.json";
import { getRoom, getRoomLayouts, confirmLayout, generateLayouts } from "../services/room";

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

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const params = new URLSearchParams(location.search);
  const roomId = params.get("roomId");

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

        setRoom(roomData);

        const layoutsRes = await getRoomLayouts(roomId);
        const layouts = layoutsRes.layouts || [];
        setGeneratedLayouts(layouts);

        if (roomData?.selectedLayoutId) {
          const matchIdx = layouts.findIndex((l) => l._id === roomData.selectedLayoutId);
          if (matchIdx !== -1) {
            setSelectedIndex(matchIdx);
          }
        }
      } catch (err) {
        console.error("Failed to load layout data:", err);
        setError(err.message || "Failed to fetch room or layout data.");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [roomId]);

  const handleConfirm = async () => {
    if (!roomId || !generatedLayouts[selectedIndex]) return;

    try {
      setIsConfirming(true);
      setError("");
      setSuccess("");

      const layout = generatedLayouts[selectedIndex];
      const res = await confirmLayout(roomId, layout._id);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      const updated = {
        ...room,
        selectedLayoutId: layout._id
      };

      setRoom(updated);
      sessionStorage.setItem("roomcraft-current-room", JSON.stringify(updated));
      setSuccess(`Layout Option #${selectedIndex + 1} confirmed as your authoritative room layout!`);
    } catch (err) {
      console.error("Confirmation error:", err);
      setError(err.message || "Failed to confirm layout.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRegenerate = async () => {
    if (!roomId) return;
    try {
      setIsRegenerating(true);
      setError("");
      setSuccess("");

      await generateLayouts(roomId);
      const layoutsRes = await getRoomLayouts(roomId);
      setGeneratedLayouts(layoutsRes.layouts || []);
      setSelectedIndex(0);
      setSuccess("Generated 8 diverse spatial layout options!");
    } catch (err) {
      console.error("Regeneration error:", err);
      setError(err.message || "Failed to re-generate layouts.");
    } finally {
      setIsRegenerating(false);
    }
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

  const selectedLayout = generatedLayouts[selectedIndex] || generatedLayouts[0];
  const isConfirmed = selectedLayout && room?.selectedLayoutId === selectedLayout._id;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      <Navbar />

      <main style={{ maxWidth: "1440px", margin: "0 auto", padding: "28px 24px 80px", width: "100%" }}>
        {/* Top Navigation & Status Bar */}
        <div style={{
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
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Room {room?.width} × {room?.height} cm
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
                <span>3D BIM Orbit View</span>
              </button>
            </div>

            {/* Re-generate Button */}
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="btn-secondary"
              style={{ fontSize: "13px" }}
            >
              <RotateCw size={14} className={isRegenerating ? "pulse-glow" : ""} />
              <span>{isRegenerating ? "Evolving..." : "Evolve New Batch"}</span>
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
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
            marginBottom: "20px"
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            background: "rgba(5, 150, 105, 0.1)",
            border: "1px solid rgba(5, 150, 105, 0.3)",
            borderRadius: "var(--radius-md)",
            color: "#047857",
            fontSize: "14px",
            marginBottom: "20px"
          }}>
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Layout Selection Grid */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Distinct Layout Archetypes ({generatedLayouts.length} Options)
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Optimized for Spatial Diversity & Zero Collisions
            </span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "14px"
          }}>
            {generatedLayouts.map((layout, idx) => {
              const isSelected = selectedIndex === idx;
              const isItemConfirmed = room?.selectedLayoutId === layout._id;

              return (
                <div
                  key={layout._id || idx}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setError("");
                    setSuccess("");
                  }}
                  className="glass-panel"
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-md)",
                    border: isSelected
                      ? "2px solid #b47b48"
                      : isItemConfirmed
                      ? "1.5px solid #d97706"
                      : "1px solid var(--border-subtle)",
                    boxShadow: isSelected
                      ? "0 4px 16px rgba(180, 123, 72, 0.25)"
                      : "var(--shadow-sm)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative",
                    background: isSelected ? "#fcfaf7" : "#ffffff"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                      Option #{idx + 1}
                    </span>

                    {isItemConfirmed ? (
                      <span className="badge badge-confirmed">
                        <Check size={12} /> Confirmed
                      </span>
                    ) : (
                      <span className="badge badge-pareto">
                        Pareto Optimal
                      </span>
                    )}
                  </div>

                  {/* 4 Score Indicators in mini-chips */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px" }}>
                    <div style={{ padding: "4px 6px", background: "rgba(180, 123, 72, 0.08)", borderRadius: "4px", color: "#9c6536", fontWeight: 600 }}>
                      Traffic: {Math.round((layout.scores?.trafficFlow ?? 0) * 100)}%
                    </div>
                    <div style={{ padding: "4px 6px", background: "rgba(2, 132, 199, 0.08)", borderRadius: "4px", color: "#0284c7", fontWeight: 600 }}>
                      Light: {Math.round((layout.scores?.lightExposure ?? 0) * 100)}%
                    </div>
                    <div style={{ padding: "4px 6px", background: "rgba(5, 150, 105, 0.08)", borderRadius: "4px", color: "#059669", fontWeight: 600 }}>
                      Clear: {Math.round((layout.scores?.clearance ?? 0) * 100)}%
                    </div>
                    <div style={{ padding: "4px 6px", background: "rgba(217, 119, 6, 0.08)", borderRadius: "4px", color: "#d97706", fontWeight: 600 }}>
                      Cluster: {Math.round((layout.scores?.clustering ?? 0) * 100)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Layout Presentation Area */}
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
                />
              ) : (
                <Room3DView
                  roomWidth={room.width}
                  roomHeight={room.height}
                  layout={selectedLayout.layout}
                  furnitureCatalog={furnitureCatalog}
                  doors={room.doors}
                  windows={room.windows}
                />
              )}
            </div>

            {/* Right Side: Score Breakdown & Confirmation Card */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="glass-panel" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>
                  Option #{selectedIndex + 1} Metrics
                </h3>

                <ScoreBreakdown scores={selectedLayout.scores} />

                {/* Confirm Action Button */}
                <div style={{ marginTop: "24px" }}>
                  <button
                    onClick={handleConfirm}
                    disabled={isConfirming || isConfirmed}
                    className={isConfirmed ? "btn-secondary" : "btn-primary"}
                    style={{
                      width: "100%",
                      padding: "14px",
                      fontSize: "15px",
                      fontWeight: 700
                    }}
                  >
                    {isConfirming ? (
                      <span>Saving Confirmation...</span>
                    ) : isConfirmed ? (
                      <>
                        <CheckCircle2 size={18} color="#059669" />
                        <span>Confirmed Arrangement</span>
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
      </main>
    </div>
  );
}

export default LayoutView;