import { Link, useLocation } from "react-router-dom";
import { Sparkles, LayoutTemplate, Layers, Compass } from "lucide-react";

function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 32px",
      borderBottom: "1px solid var(--border-subtle)",
      background: "rgba(11, 15, 23, 0.8)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 50
    }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)"
        }}>
          <Compass size={20} color="#ffffff" />
        </div>
        <div>
          <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", color: "#ffffff" }}>
            Room<span style={{ color: "#06b6d4" }}>Craft</span>
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "-3px" }}>
            AI Architecture Lab
          </span>
        </div>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "var(--radius-md)",
            fontSize: "14px",
            fontWeight: 500,
            color: isActive("/") ? "#ffffff" : "var(--text-secondary)",
            background: isActive("/") ? "rgba(255, 255, 255, 0.08)" : "transparent",
            transition: "all 0.2s ease"
          }}
        >
          <Sparkles size={16} />
          <span>Home</span>
        </Link>

        <Link
          to="/room-setup"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "var(--radius-md)",
            fontSize: "14px",
            fontWeight: 500,
            color: isActive("/room-setup") ? "#ffffff" : "var(--text-secondary)",
            background: isActive("/room-setup") ? "rgba(255, 255, 255, 0.08)" : "transparent",
            transition: "all 0.2s ease"
          }}
        >
          <LayoutTemplate size={16} />
          <span>Room Setup</span>
        </Link>

        {location.pathname === "/layout" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "var(--radius-md)",
              fontSize: "14px",
              fontWeight: 500,
              color: "#06b6d4",
              background: "rgba(6, 182, 212, 0.12)",
              border: "1px solid rgba(6, 182, 212, 0.25)"
            }}
          >
            <Layers size={16} />
            <span>Generated Layouts</span>
          </div>
        )}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link
          to="/room-setup"
          className="btn-primary"
          style={{ padding: "8px 16px", fontSize: "13px" }}
        >
          <Sparkles size={15} />
          <span>New Room</span>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
