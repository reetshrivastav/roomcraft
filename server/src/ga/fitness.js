const furnitureCatalog = require("../../../furnitureCatalog.json");
const { hasBlockedSwingZone } = require("./swingZone");
const { attachDiningChairs } = require("./diningChairs");
const { calculateInterZoneSeparation } = require("./zoning");

const MIN_CLEARANCE = 50;
const PRIMARY_WALKWAY = 90; // 90cm recommended walkway

const furnitureMap = new Map(
  furnitureCatalog.map((furniture) => [furniture.id, furniture])
);

function getFurnitureBounds(gene) {
  const furniture = furnitureMap.get(gene.furnitureId);
  if (!furniture) {
    throw new Error(`Furniture not found in catalog: ${gene.furnitureId}`);
  }
  const rotated = gene.rotation === 90 || gene.rotation === 270;
  return {
    width: rotated ? furniture.depth : furniture.width,
    depth: rotated ? furniture.width : furniture.depth
  };
}

function getFurnitureCenter(gene) {
  const bounds = getFurnitureBounds(gene);
  return {
    x: gene.x + bounds.width / 2,
    y: gene.y + bounds.depth / 2
  };
}

function distance(pointA, pointB) {
  const dx = pointA.x - pointB.x;
  const dy = pointA.y - pointB.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function rectanglesOverlap(geneA, geneB) {
  const isChairTable =
    (geneA.furnitureId === "dining-chair" && geneB.furnitureId === "dining-table") ||
    (geneA.furnitureId === "dining-table" && geneB.furnitureId === "dining-chair") ||
    (geneA.furnitureId === "office-chair" && geneB.furnitureId === "desk") ||
    (geneA.furnitureId === "desk" && geneB.furnitureId === "office-chair");

  const boundsA = getFurnitureBounds(geneA);
  const boundsB = getFurnitureBounds(geneB);

  // Chairs can tuck under tables/desks by up to 20cm
  const tuck = isChairTable ? 20 : 0;

  return (
    geneA.x + tuck < geneB.x + boundsB.width &&
    geneA.x + boundsA.width - tuck > geneB.x &&
    geneA.y + tuck < geneB.y + boundsB.depth &&
    geneA.y + boundsA.depth - tuck > geneB.y
  );
}

function minimumFurnitureDistance(chromosome) {
  if (chromosome.length < 2) return Infinity;
  let minDist = Infinity;
  for (let i = 0; i < chromosome.length; i++) {
    for (let j = i + 1; j < chromosome.length; j++) {
      const centerA = getFurnitureCenter(chromosome[i]);
      const centerB = getFurnitureCenter(chromosome[j]);
      minDist = Math.min(minDist, distance(centerA, centerB));
    }
  }
  return minDist;
}

function pointInFurniture(px, py, gene) {
  const bounds = getFurnitureBounds(gene);
  return (
    px >= gene.x && px <= gene.x + bounds.width &&
    py >= gene.y && py <= gene.y + bounds.depth
  );
}

/**
 * Objective 1: Clearance & Ergonomics
 *
 * Real interior design rules:
 * 1. ZERO furniture overlaps (hard constraint)
 * 2. Minimum 50cm spacing between furniture edges
 * 3. 90cm primary walkway clearance from doors
 * 4. "must-be-near-wall" items flush against wall (< 15cm)
 * 5. Central breathing zone: inner 30% of room kept mostly clear
 */
function calculateClearance(room, chromosome) {
  if (chromosome.length === 0) return 1;

  // 1. Strict overlap penalty
  let overlapCount = 0;
  for (let i = 0; i < chromosome.length; i++) {
    for (let j = i + 1; j < chromosome.length; j++) {
      if (rectanglesOverlap(chromosome[i], chromosome[j])) {
        overlapCount++;
      }
    }
  }
  // Zero tolerance: any overlap → drastic penalty
  if (overlapCount > 0) {
    return Number(Math.max(0.01, 0.15 - overlapCount * 0.03).toFixed(4));
  }

  // 2. Minimum pairwise edge distance
  let minEdgeDist = Infinity;
  for (let i = 0; i < chromosome.length; i++) {
    const bI = getFurnitureBounds(chromosome[i]);
    for (let j = i + 1; j < chromosome.length; j++) {
      const bJ = getFurnitureBounds(chromosome[j]);
      // Calculate edge-to-edge distance (not center-to-center)
      const gapX = Math.max(0,
        Math.max(chromosome[i].x, chromosome[j].x) -
        Math.min(chromosome[i].x + bI.width, chromosome[j].x + bJ.width)
      );
      const gapY = Math.max(0,
        Math.max(chromosome[i].y, chromosome[j].y) -
        Math.min(chromosome[i].y + bI.depth, chromosome[j].y + bJ.depth)
      );
      const edgeDist = Math.sqrt(gapX * gapX + gapY * gapY);
      minEdgeDist = Math.min(minEdgeDist, edgeDist);
    }
  }
  const spacingScore = minEdgeDist === Infinity ? 1 : Math.min(minEdgeDist / MIN_CLEARANCE, 1);

  // 3. Door clearance (90cm primary walkway & zero direct doorway obstruction)
  let doorClearanceScore = 1;
  if (Array.isArray(room.doors) && room.doors.length > 0) {
    let doorBlockCount = 0;
    let directBlock = false;

    for (const door of room.doors) {
      const db = {
        x: door.wall === "top" || door.wall === "bottom" ? door.x - 10 : (door.wall === "left" ? 0 : room.width - 85),
        y: door.wall === "left" || door.wall === "right" ? door.y - 10 : (door.wall === "top" ? 0 : room.height - 85),
        w: door.wall === "top" || door.wall === "bottom" ? 100 : 85,
        h: door.wall === "left" || door.wall === "right" ? 100 : 85
      };

      for (const gene of chromosome) {
        const bounds = getFurnitureBounds(gene);
        // Direct door threshold blockage
        if (gene.x < db.x + db.w && gene.x + bounds.width > db.x &&
            gene.y < db.y + db.h && gene.y + bounds.depth > db.y) {
          directBlock = true;
          doorBlockCount += 5;
        } else {
          const center = getFurnitureCenter(gene);
          const dist = distance({ x: door.x, y: door.y }, center);
          const approxRadius = Math.max(bounds.width, bounds.depth) / 2;
          if (dist < PRIMARY_WALKWAY + approxRadius) {
            doorBlockCount++;
          }
        }
      }
    }

    if (directBlock) {
      doorClearanceScore = 0.01;
    } else {
      const maxDoorChecks = room.doors.length * chromosome.length;
      doorClearanceScore = maxDoorChecks > 0 ? Math.max(0, 1 - (doorBlockCount / maxDoorChecks)) : 1;
    }
  }

  // 4. Wall placement for "must-be-near-wall" items
  let wallScoreSum = 0;
  let wallConstraintCount = 0;
  for (const gene of chromosome) {
    const furniture = furnitureMap.get(gene.furnitureId);
    if (furniture?.tags?.includes("must-be-near-wall")) {
      wallConstraintCount++;
      const bounds = getFurnitureBounds(gene);
      const distLeft = gene.x;
      const distTop = gene.y;
      const distRight = Math.max(0, room.width - (gene.x + bounds.width));
      const distBottom = Math.max(0, room.height - (gene.y + bounds.depth));
      const minDistToWall = Math.min(distLeft, distTop, distRight, distBottom);
      // Must be within 15cm of wall for full score
      const score = minDistToWall <= 15 ? 1.0 : Math.max(0, 1 - (minDistToWall - 15) / 80);
      wallScoreSum += score;
    }
  }
  const wallScore = wallConstraintCount > 0 ? wallScoreSum / wallConstraintCount : 1;

  // 5. Central breathing zone: penalize large items occupying the inner 30%
  const cx1 = room.width * 0.3;
  const cy1 = room.height * 0.3;
  const cx2 = room.width * 0.7;
  const cy2 = room.height * 0.7;
  let centralCongestionCount = 0;
  let totalLargeItems = 0;

  for (const gene of chromosome) {
    const furniture = furnitureMap.get(gene.furnitureId);
    if (!furniture) continue;
    const area = furniture.width * furniture.depth;
    if (area < 3000) continue; // skip small items
    totalLargeItems++;

    const center = getFurnitureCenter(gene);
    if (center.x > cx1 && center.x < cx2 && center.y > cy1 && center.y < cy2) {
      centralCongestionCount++;
    }
  }
  const breathingScore = totalLargeItems > 0
    ? Math.max(0, 1 - (centralCongestionCount / totalLargeItems) * 0.8)
    : 1;

  let finalScore =
    (spacingScore * 0.15) +
    (doorClearanceScore * 0.3) +
    (wallScore * 0.25) +
    (breathingScore * 0.3);

  // 6. TV Line-of-Sight Corridor Protection
  // Ensures TV-Sofa or TV-Bed line of sight has nothing in front except small coffee-table
  const tvGene = chromosome.find(g => g.furnitureId === "tv-stand");
  let tvObstruction = false;
  if (tvGene) {
    const target = chromosome.find(g => g.furnitureId === "sofa") || chromosome.find(g => g.furnitureId === "bed");
    if (target) {
      const bT = getFurnitureBounds(tvGene);
      const bTarget = getFurnitureBounds(target);
      const minX = Math.min(tvGene.x, target.x);
      const maxX = Math.max(tvGene.x + bT.width, target.x + bTarget.width);
      const minY = Math.min(tvGene.y, target.y);
      const maxY = Math.max(tvGene.y + bT.depth, target.y + bTarget.depth);

      for (const other of chromosome) {
        if (other === tvGene || other === target || other.furnitureId === "coffee-table" || other.furnitureId === "nightstand") continue;
        const ob = getFurnitureBounds(other);
        const overlap =
          other.x < maxX &&
          other.x + ob.width > minX &&
          other.y < maxY &&
          other.y + ob.depth > minY;
        if (overlap) {
          tvObstruction = true;
          break;
        }
      }
    }
  }

  if (tvObstruction) {
    finalScore *= 0.5; // Heavy 50% penalty if TV line of sight is blocked
  }

  if (doorClearanceScore < 0.05) {
    finalScore *= 0.1; // Hard penalty for blocking door
  }

  // Hard filter: Storage Door Swing Zone Validation (corner clearance >= 65cm, room bounds & obstacle clearance)
  if (hasBlockedSwingZone(chromosome, room)) {
    return 0.01; // Disqualifies layout from Pareto front
  }

  return Number(Math.max(0, Math.min(1, finalScore)).toFixed(4));
}

/**
 * Objective 2: Traffic Flow
 */
function calculateTrafficFlow(room, chromosome) {
  if (chromosome.length === 0) return 1;

  // Check direct doorway threshold blockage
  for (const door of (room.doors || [])) {
    const db = {
      x: door.wall === "top" || door.wall === "bottom" ? door.x - 10 : (door.wall === "left" ? 0 : room.width - 90),
      y: door.wall === "left" || door.wall === "right" ? door.y - 10 : (door.wall === "top" ? 0 : room.height - 90),
      w: door.wall === "top" || door.wall === "bottom" ? 100 : 90,
      h: door.wall === "left" || door.wall === "right" ? 100 : 90
    };
    for (const gene of chromosome) {
      const bounds = getFurnitureBounds(gene);
      if (gene.x < db.x + db.w && gene.x + bounds.width > db.x &&
          gene.y < db.y + db.h && gene.y + bounds.depth > db.y) {
        return 0.001; // Direct door blockage is Pareto disqualified
      }
    }
  }

  const roomCenterX = room.width / 2;
  const roomCenterY = room.height / 2;

  let sampledPoints = 0;
  let blockedPoints = 0;

  if (Array.isArray(room.doors) && room.doors.length > 0) {
    // Door-to-center paths
    for (const door of room.doors) {
      const steps = 12;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const px = door.x + (roomCenterX - door.x) * t;
        const py = door.y + (roomCenterY - door.y) * t;
        for (const offset of [-40, 0, 40]) {
          const dx = roomCenterY - door.y;
          const dy = -(roomCenterX - door.x);
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ox = px + (dx / len) * offset;
          const oy = py + (dy / len) * offset;

          sampledPoints++;
          if (chromosome.some((gene) => pointInFurniture(ox, oy, gene))) {
            blockedPoints++;
          }
        }
      }
    }

    // Door-to-door paths (if multiple doors)
    if (room.doors.length > 1) {
      for (let di = 0; di < room.doors.length; di++) {
        for (let dj = di + 1; dj < room.doors.length; dj++) {
          const doorA = room.doors[di];
          const doorB = room.doors[dj];
          const steps = 10;
          for (let s = 1; s < steps; s++) {
            const t = s / steps;
            const px = doorA.x + (doorB.x - doorA.x) * t;
            const py = doorA.y + (doorB.y - doorA.y) * t;
            sampledPoints++;
            if (chromosome.some((gene) => pointInFurniture(px, py, gene))) {
              blockedPoints++;
            }
          }
        }
      }
    }
  } else {
    const steps = 10;
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      sampledPoints++;
      if (chromosome.some((gene) => pointInFurniture(room.width * t, roomCenterY, gene))) blockedPoints++;
      sampledPoints++;
      if (chromosome.some((gene) => pointInFurniture(roomCenterX, room.height * t, gene))) blockedPoints++;
    }
  }

  const pathClearanceRatio = sampledPoints > 0 ? (sampledPoints - blockedPoints) / sampledPoints : 1;

  // Central open circulation score
  const innerMinX = room.width * 0.3;
  const innerMaxX = room.width * 0.7;
  const innerMinY = room.height * 0.3;
  const innerMaxY = room.height * 0.7;

  let centerSampleCount = 0;
  let centerBlockedCount = 0;
  for (let x = innerMinX; x <= innerMaxX; x += (innerMaxX - innerMinX) / 5) {
    for (let y = innerMinY; y <= innerMaxY; y += (innerMaxY - innerMinY) / 5) {
      centerSampleCount++;
      if (chromosome.some((gene) => pointInFurniture(x, y, gene))) {
        centerBlockedCount++;
      }
    }
  }
  const centerClearanceRatio = centerSampleCount > 0
    ? (centerSampleCount - centerBlockedCount) / centerSampleCount
    : 1;

  const trafficScore = (pathClearanceRatio * 0.55) + (centerClearanceRatio * 0.45);
  return Number(Math.max(0, Math.min(1, trafficScore)).toFixed(4));
}

/**
 * Objective 3: Light Exposure
 */
function calculateLightExposure(room, chromosome) {
  if (chromosome.length === 0) return 1;
  if (!Array.isArray(room.windows) || room.windows.length === 0) return 1;

  const roomDiagonal = Math.sqrt(room.width * room.width + room.height * room.height) || 1;
  let totalScore = 0;

  for (const gene of chromosome) {
    const furniture = furnitureMap.get(gene.furnitureId);
    const center = getFurnitureCenter(gene);

    let closestWindowDist = Infinity;
    for (const win of room.windows) {
      closestWindowDist = Math.min(closestWindowDist, distance(center, { x: win.x, y: win.y }));
    }
    const normalizedDist = Math.min(closestWindowDist / roomDiagonal, 1);

    if (furniture?.tags?.includes("light-preferring")) {
      totalScore += 1 - normalizedDist;
    } else if (furniture?.tags?.includes("light-avoiding")) {
      totalScore += Math.min(normalizedDist * 2, 1);
    } else {
      totalScore += Math.max(0, Math.min(1, 1 - Math.abs(normalizedDist - 0.4)));
    }
  }

  return Number((totalScore / chromosome.length).toFixed(4));
}

/**
 * Objective 4: Functional Clustering
 */
const COMPLEMENTARY_PAIRS = [
  ["bed", "storage"],
  ["work", "seating"],
  ["seating", "table"],
  ["seating", "entertainment"],
  ["table", "seating"]
];

function getCategoryAffinity(catA, catB) {
  if (catA === catB) return 1.0;
  for (const [p1, p2] of COMPLEMENTARY_PAIRS) {
    if ((catA === p1 && catB === p2) || (catA === p2 && catB === p1)) return 0.85;
  }
  return 0;
}

function calculateClustering(room, chromosome) {
  if (chromosome.length < 2) return 1;

  let totalWeightedScore = 0;
  let totalWeight = 0;
  const roomDiagonal = Math.sqrt(room.width * room.width + room.height * room.height) || 1;

  for (let i = 0; i < chromosome.length; i++) {
    for (let j = i + 1; j < chromosome.length; j++) {
      const furnitureA = furnitureMap.get(chromosome[i].furnitureId);
      const furnitureB = furnitureMap.get(chromosome[j].furnitureId);
      if (!furnitureA || !furnitureB) continue;

      const affinity = getCategoryAffinity(furnitureA.category, furnitureB.category);
      if (affinity > 0) {
        const d = distance(getFurnitureCenter(chromosome[i]), getFurnitureCenter(chromosome[j]));
        let pairScore;
        if (d < 40) {
          pairScore = d / 40;
        } else if (d <= 200) {
          pairScore = 1.0;
        } else {
          pairScore = Math.max(0, 1 - (d - 200) / (roomDiagonal * 0.6));
        }
        totalWeightedScore += pairScore * affinity;
        totalWeight += affinity;
      }
    }
  }

  if (totalWeight === 0) return 0.8;
  return Number((totalWeightedScore / totalWeight).toFixed(4));
}

function calculateZoneScore(room, chromosome) {
  const intraScore = calculateClustering(room, chromosome);
  const interScore = calculateInterZoneSeparation(chromosome, room);
  return Number(((intraScore * 0.5) + (interScore * 0.5)).toFixed(4));
}

function calculateFitness(room, chromosome) {
  // Attach deterministic dining chairs based on dining table position
  const fullChromosome = attachDiningChairs(chromosome, room);

  return {
    trafficFlow: calculateTrafficFlow(room, fullChromosome),
    lightExposure: calculateLightExposure(room, fullChromosome),
    clearance: calculateClearance(room, fullChromosome),
    clustering: calculateZoneScore(room, fullChromosome)
  };
}

module.exports = {
  calculateFitness,
  calculateTrafficFlow,
  calculateLightExposure,
  calculateClearance,
  calculateClustering,
  calculateZoneScore,
  getFurnitureBounds,
  getFurnitureCenter,
  rectanglesOverlap
};