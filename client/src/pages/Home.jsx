import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Dna, Compass, Layers, ShieldCheck, Box, Sliders } from "lucide-react";
import Navbar from "../components/Navbar";

const PRESET_TEMPLATES = [
  {
    id: "master-bedroom",
    title: "Master Bedroom Suite",
    dimensions: "500 × 420 cm",
    furniture: ["double-bed", "wardrobe", "nightstand", "nightstand", "dresser", "armchair"],
    desc: "Optimized for quiet circulation, dual nightstand alignment, and perimeter wardrobe storage."
  },
  {
    id: "dining-living",
    title: "Dining & Living Salon",
    dimensions: "600 × 450 cm",
    furniture: ["dining-table", "dining-chair", "dining-chair", "dining-chair", "dining-chair", "sofa", "coffee-table", "tv-stand"],
    desc: "4-seater dining perimeter arrangement paired with a comfortable living and entertainment zone."
  },
  {
    id: "home-office",
    title: "Executive Home Office",
    dimensions: "450 × 380 cm",
    furniture: ["desk", "office-chair", "bookshelf", "sofa", "coffee-table"],
    desc: "Window-aligned natural lighting on workstation, shielded bookcase, and cozy seating."
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
        {/* Subtle Warm Background Glow */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "350px",
          background: "radial-gradient(circle, rgba(180, 123, 72, 0.12) 0%, rgba(244, 240, 230, 0.4) 60%, transparent 80%)",
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
            background: "rgba(180, 123, 72, 0.1)",
            border: "1px solid rgba(180, 123, 72, 0.25)",
            color: "#9c6536",
            fontSize: "13px",
            fontWeight: 700,
            marginBottom: "24px"
          }}>
            <Dna size={16} color="#b47b48" />
            <span>Multi-Objective Genetic Algorithm (Pareto Optimization)</span>
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 62px)",
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            marginBottom: "20px",
            color: "var(--text-primary)"
          }}>
            Architectural Room Layouts <br />
            <span style={{
              background: "linear-gradient(135deg, #b47b48 0%, #784c28 100%)",
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
            Design and generate mathematically optimal furniture arrangements in 2D blueprint and 3D orbit views. RoomCraft balances walking corridors, window sunlight, ergonomic clearances, and functional clustering in real-time.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/room-setup"
              className="btn-primary"
              style={{ padding: "14px 28px", fontSize: "16px" }}
            >
              <Sparkles size={18} />
              <span>Configure Your Space</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Instant Presets Section */}
      <section style={{ maxWidth: "1160px", margin: "0 auto 60px", padding: "0 24px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
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
                  <h3 style={{ fontSize: "18px", color: "var(--text-primary)" }}>{preset.title}</h3>
                  <span className="badge badge-tag" style={{ fontFamily: "var(--font-mono)" }}>
                    {preset.dimensions}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.5 }}>
                  {preset.desc}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                  {preset.furniture.map((f, i) => (
                    <span
                      key={`${f}-${i}`}
                      style={{
                        padding: "3px 8px",
                        background: "var(--bg-input)",
                        borderRadius: "4px",
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        fontWeight: 500
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
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
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
              background: "rgba(180, 123, 72, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#b47b48",
              marginBottom: "14px"
            }}>
              <Compass size={22} />
            </div>
            <h4 style={{ fontSize: "16px", marginBottom: "8px" }}>Traffic Flow</h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Traces clear walking corridors between doors and room centers, scoring unobstructed transit paths.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(2, 132, 199, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0284c7",
              marginBottom: "14px"
            }}>
              <Sparkles size={22} />
            </div>
            <h4 style={{ fontSize: "16px", marginBottom: "8px" }}>Light Exposure</h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Rewards light-preferring items (desks) near windows while shielding glare-sensitive storage (bookshelves).
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(5, 150, 105, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#059669",
              marginBottom: "14px"
            }}>
              <ShieldCheck size={22} />
            </div>
            <h4 style={{ fontSize: "16px", marginBottom: "8px" }}>Clearance & Walls</h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Strictly eliminates collisions, maintains 70cm doorway swing clearance, and anchors beds and wardrobes to walls.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(217, 119, 6, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#d97706",
              marginBottom: "14px"
            }}>
              <Layers size={22} />
            </div>
            <h4 style={{ fontSize: "16px", marginBottom: "8px" }}>Functional Clustering</h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Coordinates spatial groupings like Dining Tables + Chairs, Bed + Nightstand, and Sofa + Coffee Table.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: "auto",
        borderTop: "1px solid var(--border-subtle)",
        padding: "28px 24px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "13px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        alignItems: "center"
      }}>
        <div>
          RoomCraft • Architectural Spatial AI & Interior BIM Studio
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          Engineered collaboratively by{" "}
          <a
            href="https://github.com/reetshrivastav"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}
          >
            Reet Shrivastav
          </a>{" "}
          &{" "}
          <a
            href="https://github.com/pranshi2300"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}
          >
            Pranshi Gupta
          </a>
        </div>
      </footer>
    </div>
  );
}

export default Home;
