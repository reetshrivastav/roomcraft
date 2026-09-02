import { Link, useLocation } from "react-router-dom";
import { Sparkles, LayoutTemplate, Layers, Compass } from "lucide-react";

function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="app-navbar" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 32px",
      borderBottom: "1px solid var(--border-subtle)",
      background: "rgba(251, 249, 245, 0.92)",
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
          background: "linear-gradient(135deg, #b47b48 0%, #784c28 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 10px rgba(180, 123, 72, 0.3)",
          flexShrink: 0
        }}>
          <Compass size={20} color="#ffffff" />
        </div>
        <div>
          <span style={{ fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            Room<span style={{ color: "#b47b48" }}>Craft</span>
          </span>
          <span className="app-navbar-subtext" style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "-3px", fontWeight: 500 }}>
            Architectural AI Studio
          </span>
        </div>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
            fontWeight: 600,
            color: isActive("/") ? "var(--primary)" : "var(--text-secondary)",
            background: isActive("/") ? "rgba(180, 123, 72, 0.1)" : "transparent",
            transition: "all 0.2s ease"
          }}
          title="Home"
        >
          <Sparkles size={16} />
          <span className="app-nav-link-text">Home</span>
        </Link>

        <Link
          to="/room-setup"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
            fontWeight: 600,
            color: isActive("/room-setup") ? "var(--primary)" : "var(--text-secondary)",
            background: isActive("/room-setup") ? "rgba(180, 123, 72, 0.1)" : "transparent",
            transition: "all 0.2s ease"
          }}
          title="Room Setup"
        >
          <LayoutTemplate size={16} />
          <span className="app-nav-link-text">Room Setup</span>
        </Link>

        {location.pathname === "/layout" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              fontWeight: 600,
              color: "#b47b48",
              background: "rgba(180, 123, 72, 0.12)",
              border: "1px solid rgba(180, 123, 72, 0.25)"
            }}
            title="Generated Layouts"
          >
            <Layers size={16} />
            <span className="app-nav-link-text">Layouts</span>
          </div>
        )}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link
          to="/room-setup"
          className="btn-primary"
          style={{ padding: "8px 14px", fontSize: "13px" }}
          title="Create New Room"
        >
          <Sparkles size={15} />
          <span className="app-nav-link-text">New Room</span>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
