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
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(180, 123, 72, 0.28)",
          flexShrink: 0,
          overflow: "hidden"
        }}>
          <svg viewBox="0 0 48 48" width="38" height="38" fill="none">
            <defs>
              <linearGradient id="nav-rc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c58a55" />
                <stop offset="100%" stopColor="#6f421f" />
              </linearGradient>
              <linearGradient id="nav-rc-top" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dfad7c" />
                <stop offset="100%" stopColor="#b47b48" />
              </linearGradient>
              <linearGradient id="nav-rc-left" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#986134" />
                <stop offset="100%" stopColor="#5a3316" />
              </linearGradient>
              <linearGradient id="nav-rc-right" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ba8250" />
                <stop offset="100%" stopColor="#734220" />
              </linearGradient>
            </defs>
            <rect width="48" height="48" rx="10" fill="url(#nav-rc-grad)" />
            <polygon points="24,10 37,17.5 24,25 11,17.5" fill="url(#nav-rc-top)" stroke="#ffffff" strokeWidth="1.3" strokeLinejoin="round" opacity="0.95"/>
            <polygon points="11,17.5 24,25 24,38 11,30.5" fill="url(#nav-rc-left)" stroke="#ffffff" strokeWidth="1.3" strokeLinejoin="round" opacity="0.92"/>
            <polygon points="24,25 37,17.5 37,30.5 24,38" fill="url(#nav-rc-right)" stroke="#ffffff" strokeWidth="1.3" strokeLinejoin="round" opacity="0.95"/>
            <polygon points="15,22 19,24.3 19,32.2 15,29.9" fill="#ffffff" fillOpacity="0.28" stroke="#ffffff" strokeWidth="0.9"/>
            <polygon points="27,24.5 33,21 33,27 27,30.5" fill="#38bdf8" fillOpacity="0.65" stroke="#ffffff" strokeWidth="0.9"/>
            <circle cx="24" cy="25" r="1.4" fill="#ffffff"/>
          </svg>
        </div>
        <div>
          <span style={{ fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            Room<span style={{ color: "#b47b48" }}>Craft</span>
          </span>
          <span className="app-navbar-subtext" style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "-3px", fontWeight: 600 }}>
            Spatial AI & Interior BIM Studio
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
