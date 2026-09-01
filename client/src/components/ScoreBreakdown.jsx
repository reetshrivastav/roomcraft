import { Footprints, Sun, ShieldCheck, Grid } from "lucide-react";

function ScoreBreakdown({ scores = {} }) {
  const metrics = [
    {
      key: "trafficFlow",
      label: "Traffic Flow",
      score: scores.trafficFlow ?? 0,
      icon: Footprints,
      color: "#6366f1",
      description: "Accessibility of walking corridors between doors and central room movement pathways."
    },
    {
      key: "lightExposure",
      label: "Light Exposure",
      score: scores.lightExposure ?? 0,
      icon: Sun,
      color: "#06b6d4",
      description: "Optimal placement relative to windows (rewards desks near natural light, shields bookshelves)."
    },
    {
      key: "clearance",
      label: "Clearance & Walls",
      score: scores.clearance ?? 0,
      icon: ShieldCheck,
      color: "#10b981",
      description: "Zero furniture overlap, adequate spacing halos, unobstructed doors, and wall alignment."
    },
    {
      key: "clustering",
      label: "Functional Clustering",
      score: scores.clustering ?? 0,
      icon: Grid,
      color: "#f59e0b",
      description: "Harmonious grouping of complementary furniture (Bed + Nightstand, Desk + Chair, Sofa + Table)."
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
              background: "rgba(15, 23, 42, 0.6)",
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
                  background: `${metric.color}20`,
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
              background: "rgba(255, 255, 255, 0.08)",
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
