import { Footprints, Sun, ShieldCheck, Grid } from "lucide-react";

function ScoreBreakdown({ scores = {} }) {
  const metrics = [
    {
      key: "trafficFlow",
      label: "Traffic Flow",
      score: scores.trafficFlow ?? 0,
      icon: Footprints,
      color: "#b47b48",
      description: "Unobstructed entry corridors between doorways and central movement paths."
    },
    {
      key: "lightExposure",
      label: "Light Exposure",
      score: scores.lightExposure ?? 0,
      icon: Sun,
      color: "#0284c7",
      description: "Natural sunlight alignment for desks while shielding storage from direct glare."
    },
    {
      key: "clearance",
      label: "Clearance & Walls",
      score: scores.clearance ?? 0,
      icon: ShieldCheck,
      color: "#059669",
      description: "Zero furniture collision, 70cm doorway swing clearance, and wall alignment."
    },
    {
      key: "clustering",
      label: "Functional Clustering",
      score: scores.clustering ?? 0,
      icon: Grid,
      color: "#d97706",
      description: "Harmonious grouping of complementary items (Table + Chairs, Bed + Nightstand)."
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const percentage = Math.round(metric.score * 100);

        return (
          <div
            key={metric.key}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              background: "var(--bg-input)",
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  padding: "5px",
                  borderRadius: "6px",
                  background: `${metric.color}15`,
                  color: metric.color,
                  display: "flex"
                }}>
                  <Icon size={15} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {metric.label}
                </span>
              </div>

              <span style={{
                fontSize: "13px",
                fontWeight: 700,
                color: metric.color,
                fontFamily: "var(--font-mono)"
              }}>
                {percentage}%
              </span>
            </div>

            {/* Progress Track */}
            <div style={{
              width: "100%",
              height: "6px",
              background: "rgba(0, 0, 0, 0.06)",
              borderRadius: "var(--radius-full)",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${percentage}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${metric.color}99 0%, ${metric.color} 100%)`,
                borderRadius: "var(--radius-full)",
                transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
              }} />
            </div>

            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              {metric.description}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default ScoreBreakdown;
