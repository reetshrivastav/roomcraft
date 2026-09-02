import React, { useState } from "react";
import stylePresets from "../data/stylePresets.json";

export default function StyleModal({ isOpen, onClose, activeStyleId, onApplyStyle }) {
  const [selectedId, setSelectedId] = useState(activeStyleId || "scandinavian");

  if (!isOpen) return null;

  const currentPreset = stylePresets.find(p => p.id === selectedId) || stylePresets[0];

  const handleApply = () => {
    onApplyStyle(currentPreset);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(30, 24, 20, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        zIndex: 9999
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "880px",
          maxHeight: "88vh",
          backgroundColor: "#fbf9f5",
          borderRadius: "24px",
          border: "1px solid #e2dad0",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(180, 123, 72, 0.1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 28px",
            borderBottom: "1px solid #ede5db",
            background: "linear-gradient(to right, #fbf9f5, #f4eee6)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                fontSize: "20px",
                padding: "8px",
                borderRadius: "12px",
                background: "rgba(180, 123, 72, 0.12)",
                color: "#b47b48"
              }}
            >
              🎨
            </span>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#2d2a26", margin: 0 }}>
                AI Architectural Style Presets
              </h2>
              <p style={{ fontSize: "12px", color: "#7d756d", margin: "2px 0 0" }}>
                Curated color palettes, material textures, and designer furniture pairings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid #e2dad0",
              background: "#ffffff",
              color: "#7d756d",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease"
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            display: "grid",
            gridTemplateColumns: "1fr 1.35fr",
            gap: "24px"
          }}
        >
          {/* Left Column: Preset Selector Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#9e958c", letterSpacing: "0.5px" }}>
              Select Style Preset
            </span>

            {stylePresets.map((preset) => {
              const isSelected = preset.id === selectedId;
              const isActive = preset.id === activeStyleId;

              return (
                <div
                  key={preset.id}
                  onClick={() => setSelectedId(preset.id)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "16px",
                    border: `2px solid ${isSelected ? "#b47b48" : "#ede5db"}`,
                    backgroundColor: isSelected ? "#ffffff" : "rgba(244, 239, 232, 0.6)",
                    boxShadow: isSelected ? "0 4px 16px rgba(180, 123, 72, 0.15)" : "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "#2d2a26" }}>
                        {preset.name}
                      </span>
                      {isActive && (
                        <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "10px", background: "#d1fae5", color: "#065f46", fontWeight: 700 }}>
                          Active
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: "rgba(180, 123, 72, 0.12)", color: "#b47b48", fontWeight: 700 }}>
                      {preset.badge}
                    </span>
                  </div>

                  <p style={{ fontSize: "12px", color: "#7d756d", margin: "0 0 10px", lineHeight: "1.4" }}>
                    {preset.description}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      {preset.swatches.map((swatch, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            backgroundColor: swatch.hex,
                            border: "1px solid rgba(0,0,0,0.12)"
                          }}
                          title={swatch.name}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: "11px", color: "#9e958c", fontWeight: 600 }}>
                      {preset.flooring.split(" ")[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Inspector */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "20px 22px",
              borderRadius: "16px",
              border: "1px solid #ede5db",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
            }}
          >
            {/* Title & Badge */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#2d2a26", margin: 0 }}>
                  {currentPreset.name}
                </h3>
                <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "12px", background: "#b47b48", color: "#ffffff", fontWeight: 700 }}>
                  {currentPreset.badge}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#7d756d", margin: 0, lineHeight: 1.5 }}>
                {currentPreset.description}
              </p>
            </div>

            {/* Color Palette Ribbon */}
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#9e958c", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
                Color Palette & Materials
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                {currentPreset.swatches.map((swatch, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        backgroundColor: swatch.hex,
                        border: "1px solid rgba(0,0,0,0.12)",
                        marginBottom: "4px",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.06)"
                      }}
                    />
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#2d2a26", lineHeight: 1.2 }}>
                      {swatch.name}
                    </span>
                    <span style={{ fontSize: "9px", color: "#9e958c", fontFamily: "monospace" }}>
                      {swatch.hex}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Flooring Spec */}
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#fbf9f5", border: "1px solid #ede5db", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#7d756d", fontWeight: 600 }}>Flooring Texture:</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#2d2a26" }}>🪵 {currentPreset.flooring}</span>
            </div>

            {/* Matching Furniture Set */}
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#9e958c", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
                🛋️ AI Matching Furniture Combinations
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ padding: "8px 12px", borderRadius: "8px", background: "#fbf9f5", border: "1px solid #ede5db", fontSize: "11px" }}>
                  <strong style={{ color: "#b47b48" }}>Living: </strong>
                  <span style={{ color: "#4a4641" }}>{currentPreset.matchingSets.living}</span>
                </div>
                <div style={{ padding: "8px 12px", borderRadius: "8px", background: "#fbf9f5", border: "1px solid #ede5db", fontSize: "11px" }}>
                  <strong style={{ color: "#b47b48" }}>Dining: </strong>
                  <span style={{ color: "#4a4641" }}>{currentPreset.matchingSets.dining}</span>
                </div>
                <div style={{ padding: "8px 12px", borderRadius: "8px", background: "#fbf9f5", border: "1px solid #ede5db", fontSize: "11px" }}>
                  <strong style={{ color: "#b47b48" }}>Bedroom: </strong>
                  <span style={{ color: "#4a4641" }}>{currentPreset.matchingSets.bedroom}</span>
                </div>
              </div>
            </div>

            {/* Designer Advice */}
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#9e958c", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
                💡 Architect & Styling Guidelines
              </span>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "#5a544e", lineHeight: 1.6 }}>
                {currentPreset.designerTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 28px",
            borderTop: "1px solid #ede5db",
            backgroundColor: "#fbf9f5"
          }}
        >
          <span style={{ fontSize: "12px", color: "#7d756d" }}>
            Updates 3D BIM Studio materials and 2D CAD blueprint in real time
          </span>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 18px",
                borderRadius: "10px",
                border: "1px solid #e2dad0",
                background: "#ffffff",
                color: "#7d756d",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              style={{
                padding: "8px 22px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #b47b48 0%, #9c6536 100%)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(180, 123, 72, 0.3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>Apply {currentPreset.name}</span>
              <span>✨</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
