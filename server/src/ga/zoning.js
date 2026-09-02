const furnitureCatalog = require("../../../furnitureCatalog.json");
const furnitureMap = new Map(furnitureCatalog.map((item) => [item.id, item]));

function getBounds(furnitureId, rotation) {
  const item = furnitureMap.get(furnitureId);
  if (!item) return { width: 50, depth: 50 };
  const isRotated = rotation === 90 || rotation === 270;
  return {
    width: isRotated ? item.depth : item.width,
    depth: isRotated ? item.width : item.depth
  };
}

/**
 * 3.1 Zone tags
 */
const FURNITURE_ZONES = {
  "single-bed": "Sleep",
  "double-bed": "Sleep",
  "nightstand": "Sleep",
  "desk": "Work",
  "office-chair": "Work",
  "dining-table": "Dine",
  "dining-chair": "Dine",
  "sofa": "Lounge",
  "coffee-table": "Lounge",
  "tv-stand": "Lounge",
  "wardrobe": "Storage",
  "bookshelf": "Storage",
  "dresser": "Storage"
};

/**
 * 3.2 Zone compatibility matrix
 * Defines minimum centroid separation between zone centroids.
 */
const ZONE_SEPARATION_REQUIREMENTS = [
  { zoneA: "Sleep", zoneB: "Lounge", minSeparation: 150, relationship: "Incompatible" },
  { zoneA: "Work", zoneB: "Lounge", minSeparation: 120, relationship: "Incompatible" },
  { zoneA: "Sleep", zoneB: "Dine", minSeparation: 80, relationship: "Neutral" },
  { zoneA: "Work", zoneB: "Dine", minSeparation: 60, relationship: "Neutral" },
  { zoneA: "Dine", zoneB: "Lounge", minSeparation: 80, relationship: "Neutral" },
  { zoneA: "Sleep", zoneB: "Work", minSeparation: 0, relationship: "Compatible" }
];

/**
 * Quadrant coordinates for seeding archetypes
 */
function getQuadrantBounds(quadrant, room) {
  const hw = room.width / 2;
  const hh = room.height / 2;
  switch (quadrant) {
    case "NW": return { minX: 15, maxX: hw - 15, minY: 15, maxY: hh - 15 };
    case "NE": return { minX: hw + 15, maxX: room.width - 15, minY: 15, maxY: hh - 15 };
    case "SE": return { minX: hw + 15, maxX: room.width - 15, minY: hh + 15, maxY: room.height - 15 };
    case "SW": return { minX: 15, maxX: hw - 15, minY: hh + 15, maxY: room.height - 15 };
    default: return { minX: 15, maxX: room.width - 15, minY: 15, maxY: room.height - 15 };
  }
}

/**
 * Calculates centroids for all present functional zones (excluding neutral Storage).
 */
function calculateZoneCentroids(chromosome) {
  const zonePoints = {};

  for (const gene of chromosome) {
    const zone = FURNITURE_ZONES[gene.furnitureId];
    if (!zone || zone === "Storage") continue; // Storage attaches to nearest zone

    const bounds = getBounds(gene.furnitureId, gene.rotation);
    const cx = gene.x + bounds.width / 2;
    const cy = gene.y + bounds.depth / 2;

    if (!zonePoints[zone]) zonePoints[zone] = [];
    zonePoints[zone].push({ x: cx, y: cy });
  }

  const centroids = {};
  for (const [zone, points] of Object.entries(zonePoints)) {
    const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    centroids[zone] = { x: avgX, y: avgY };
  }

  return centroids;
}

/**
 * Calculates InterZoneSeparation score between 0 and 1.
 * For every zone pair present in the room, measures actual distance vs required distance.
 */
function calculateInterZoneSeparation(chromosome, room) {
  const centroids = calculateZoneCentroids(chromosome);
  const presentZones = Object.keys(centroids);

  if (presentZones.length <= 1) return 1.0;

  let totalPairScore = 0;
  let evaluatedPairs = 0;

  for (const req of ZONE_SEPARATION_REQUIREMENTS) {
    const cA = centroids[req.zoneA];
    const cB = centroids[req.zoneB];

    if (!cA || !cB) continue; // Pair not both present

    if (req.minSeparation === 0) {
      // Compatible pair (e.g. Sleep & Work)
      totalPairScore += 1.0;
      evaluatedPairs++;
      continue;
    }

    const dx = cA.x - cB.x;
    const dy = cA.y - cB.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Score is 1.0 if actual distance >= required distance, proportionally scaled otherwise
    const pairScore = Math.min(1.0, dist / req.minSeparation);
    totalPairScore += pairScore;
    evaluatedPairs++;
  }

  return evaluatedPairs > 0 ? totalPairScore / evaluatedPairs : 1.0;
}

module.exports = {
  FURNITURE_ZONES,
  ZONE_SEPARATION_REQUIREMENTS,
  getQuadrantBounds,
  calculateZoneCentroids,
  calculateInterZoneSeparation
};
