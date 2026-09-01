import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Dna, Compass, Layers, ShieldCheck, Box, Sliders } from "lucide-react";
import Navbar from "../components/Navbar";

const PRESET_TEMPLATES = [
  {
    id: "master-bedroom",
    title: "Master Bedroom Suite",
    dimensions: "500 × 420 cm",
    furniture: ["double-bed", "wardrobe", "nightstand", "dresser", "armchair"],
    desc: "Optimized for quiet circulation, bedside lighting, and wall-aligned wardrobes."
  },
  {
    id: "home-office",
    title: "Executive Home Office",
    dimensions: "450 × 380 cm",
    furniture: ["desk", "office-chair", "bookshelf", "sofa", "coffee-table"],
    desc: "Window-aligned natural light on desk, shielded bookshelf, and client seating zone."
  },
  {
    id: "studio-apartment",
    title: "Cozy Studio Living",
    dimensions: "600 × 480 cm",
    furniture: ["single-bed", "sofa", "coffee-table", "tv-stand", "dining-table", "dining-chair", "wardrobe"],
    desc: "Multi-functional zone clustering with unobstructed primary entrance corridors."
  }
];

function Home() {
  const navigate = useNavigate();

  const handleLaunchPreset = (preset) => {
    sessionStorage.setItem("roomcraft-preset", JSON.stringify(preset));
    navigate("/room-setup");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        position: "relative",
        padding: "80px 24px 60px",
        textAlign: "center",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        {/* Subtle Background Glow Spheres */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "350px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 80%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "860px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "var(--radius-full)",
            background: "rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            color: "#a5b4fc",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "24px"
          }}>
            <Dna size={16} color="#6366f1" />
            <span>Multi-Objective Genetic Algorithm (Pareto Front)</span>
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "20px",
            background: "linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Architectural Room Layouts <br />
            <span style={{
              background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              Optimized by Evolutionary AI
            </span>
          </h1>

          <p style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            maxWidth: "680px",
            margin: "0 auto 36px",
            lineHeight: 1.6
          }}>
            Design and generate mathematically optimal furniture arrangements. RoomCraft balances
            walking traffic flow, window natural lighting, ergonomic clearances, and functional clustering in real-time.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/room-setup"
              className="btn-primary"
              style={{ padding: "14px 28px", fontSize: "16px" }}
            >
              <Sparkles size={18} />
              <span>Configure Your Room</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Instant Presets Section */}
      <section style={{ maxWidth: "1160px", margin: "0 auto 60px", padding: "0 24px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#06b6d4", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Instant Starter Templates
          </span>
          <h2 style={{ fontSize: "28px", marginTop: "4px" }}>
            Launch a Room in Seconds
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px"
        }}>
          {PRESET_TEMPLATES.map((preset) => (
            <div
              key={preset.id}
              className="glass-panel"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.25s ease",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden"
              }}
              onClick={() => handleLaunchPreset(preset)}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "18px", color: "#ffffff" }}>{preset.title}</h3>
                  <span className="badge badge-tag" style={{ fontFamily: "var(--font-mono)" }}>
                    {preset.dimensions}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.5 }}>
                  {preset.desc}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                  {preset.furniture.map((f) => (
                    <span
                      key={f}
                      style={{
                        padding: "3px 8px",
                        background: "rgba(255, 255, 255, 0.05)",
                        borderRadius: "4px",
                        fontSize: "11px",
                        color: "var(--text-muted)"
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className="btn-secondary"
                style={{ width: "100%", justifyContent: "center", fontSize: "13px" }}
              >
                <span>Use This Template</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Core Objectives Breakdown Grid */}
      <section style={{ maxWidth: "1160px", margin: "0 auto 80px", padding: "0 24px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Genetic Algorithm Objectives
          </span>
          <h2 style={{ fontSize: "28px", marginTop: "4px" }}>
            Four Independent Optimization Dimensions
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px"
        }}>
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(99, 102, 241, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#818cf8",
              marginBottom: "14px"
            }}>
              <Compass size={22} />
            </div>
            <h4 style={{ fontSize: "16px", marginBottom: "8px" }}>Traffic Flow</h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Traces ray-cast walking corridors between doors and room centers, penalizing furniture obstructing transit paths.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(6, 182, 212, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#22d3ee",
              marginBottom: "14px"
            }}>
              <Sparkles size={22} />
            </div>
            <h4 style={{ fontSize: "16px", marginBottom: "8px" }}>Light Exposure</h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Rewards light-preferring items (desks) near windows while shielding light-sensitive storage (bookshelves).
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#34d399",
              marginBottom: "14px"
            }}>
              <ShieldCheck size={22} />
            </div>
            <h4 style={{ fontSize: "16px", marginBottom: "8px" }}>Clearance & Walls</h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Prevents spatial collisions, maintains 70cm doorway swing clearance, and satisfies wall-anchored tags.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fbbf24",
              marginBottom: "14px"
            }}>
              <Layers size={22} />
            </div>
            <h4 style={{ fontSize: "16px", marginBottom: "8px" }}>Functional Clustering</h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Evaluates functional pairings like Bed + Nightstand, Desk + Chair, and Sofa + Coffee Table for harmonious living.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: "auto",
        borderTop: "1px solid var(--border-subtle)",
        padding: "24px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "13px"
      }}>
        RoomCraft • AI-Powered Room Layout Optimization Engine
      </footer>
    </div>
  );
}

export default Home;
