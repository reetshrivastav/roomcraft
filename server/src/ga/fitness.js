const furnitureCatalog = require("../../../furnitureCatalog.json");

const MIN_CLEARANCE = 50;

/**
 * Create a lookup map for furniture metadata.
 */
function createFurnitureMap() {
  const furnitureMap = new Map();

  for (const furniture of furnitureCatalog) {
    furnitureMap.set(furniture.id, furniture);
  }

  return furnitureMap;
}

const furnitureMap = createFurnitureMap();

/**
 * Get the effective width/depth of a furniture item
 * after accounting for rotation.
 */
function getFurnitureBounds(gene) {
  const furniture = furnitureMap.get(gene.furnitureId);

  if (!furniture) {
    throw new Error(
      `Furniture not found in catalog: ${gene.furnitureId}`
    );
  }

  const rotated =
    gene.rotation === 90 ||
    gene.rotation === 270;

  return {
    width: rotated ? furniture.depth : furniture.width,
    depth: rotated ? furniture.width : furniture.depth
  };
}

/**
 * Get the center point of a furniture item.
 */
function getFurnitureCenter(gene) {
  const bounds = getFurnitureBounds(gene);

  return {
    x: gene.x + bounds.width / 2,
    y: gene.y + bounds.depth / 2
  };
}

/**
 * Calculate Euclidean distance between two points.
 */
function distance(pointA, pointB) {
  const dx = pointA.x - pointB.x;
  const dy = pointA.y - pointB.y;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check whether two rectangular furniture items overlap.
 */
function rectanglesOverlap(geneA, geneB) {
  const boundsA = getFurnitureBounds(geneA);
  const boundsB = getFurnitureBounds(geneB);

  const overlapX =
    geneA.x < geneB.x + boundsB.width &&
    geneA.x + boundsA.width > geneB.x;

  const overlapY =
    geneA.y < geneB.y + boundsB.depth &&
    geneA.y + boundsA.depth > geneB.y;

  return overlapX && overlapY;
}

/**
 * Calculate the minimum distance between furniture centers.
 */
function minimumFurnitureDistance(chromosome) {
  if (chromosome.length < 2) {
    return Infinity;
  }

  let minimumDistance = Infinity;

  for (let i = 0; i < chromosome.length; i++) {
    for (let j = i + 1; j < chromosome.length; j++) {
      const centerA = getFurnitureCenter(chromosome[i]);
      const centerB = getFurnitureCenter(chromosome[j]);

      const currentDistance = distance(
        centerA,
        centerB
      );

      minimumDistance = Math.min(
        minimumDistance,
        currentDistance
      );
    }
  }

  return minimumDistance;
}

/**
 * Helper: Check if a point (px, py) is inside a furniture bounding box.
 */
function pointInFurniture(px, py, gene) {
  const bounds = getFurnitureBounds(gene);
  return (
    px >= gene.x &&
    px <= gene.x + bounds.width &&
    py >= gene.y &&
    py <= gene.y + bounds.depth
  );
}

/**
 * Objective 1: Clearance
 *
 * Evaluates:
 * 1. Lack of overlaps between furniture items
 * 2. Minimum spacing between furniture
 * 3. Keeping door entryways unobstructed (70cm clearance zone)
 * 4. Satisfying "must-be-near-wall" tags
 */
function calculateClearance(room, chromosome) {
  if (chromosome.length === 0) {
    return 1;
  }

  // 1. Strict overlap penalty (zero collisions required)
  let overlapCount = 0;
  for (let i = 0; i < chromosome.length; i++) {
    for (let j = i + 1; j < chromosome.length; j++) {
      if (rectanglesOverlap(chromosome[i], chromosome[j])) {
        overlapCount++;
      }
    }
  }

  const pairCount = (chromosome.length * (chromosome.length - 1)) / 2;
  // If even a single item overlaps, drastically penalize
  const overlapScore = overlapCount === 0 ? 1.0 : Math.max(0.01, 1 - (overlapCount * 0.6));

  // 2. Minimum pairwise distance spacing score
  const minimumDistance = minimumFurnitureDistance(chromosome);
  const spacingScore =
    minimumDistance === Infinity
      ? 1
      : Math.min(minimumDistance / MIN_CLEARANCE, 1);

  // 3. Door clearance (no furniture blocking door swing / entry within 70cm)
  let doorClearanceScore = 1;
  if (Array.isArray(room.doors) && room.doors.length > 0) {
    let doorBlockCount = 0;
    for (const door of room.doors) {
      for (const gene of chromosome) {
        const center = getFurnitureCenter(gene);
        const dist = distance({ x: door.x, y: door.y }, center);
        const bounds = getFurnitureBounds(gene);
        const approxRadius = Math.max(bounds.width, bounds.depth) / 2;
        if (dist < 70 + approxRadius) {
          doorBlockCount++;
        }
      }
    }
    const maxDoorChecks = room.doors.length * chromosome.length;
    doorClearanceScore = maxDoorChecks > 0 ? Math.max(0, 1 - (doorBlockCount / maxDoorChecks)) : 1;
  }

  // 4. Wall placement constraint check
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
      // Reward being within 20cm of any wall
      const score = Math.max(0, 1 - minDistToWall / 100);
      wallScoreSum += score;
    }
  }

  const wallScore = wallConstraintCount > 0 ? wallScoreSum / wallConstraintCount : 1;

  // Composite clearance score with heavy weight on zero overlap
  let finalScore = (overlapScore * 0.5) + (spacingScore * 0.15) + (doorClearanceScore * 0.2) + (wallScore * 0.15);
  if (overlapCount > 0) {
    finalScore *= 0.3; // Hard penalty multiplier if overlapping
  }

  return Number(Math.max(0, Math.min(1, finalScore)).toFixed(4));
}

/**
 * Objective 2: Traffic Flow
 *
 * Evaluates dynamic walking pathways:
 * 1. Door-to-center path clearance
 * 2. Unobstructed central circulation space
 */
function calculateTrafficFlow(room, chromosome) {
  if (chromosome.length === 0) {
    return 1;
  }

  const roomCenterX = room.width / 2;
  const roomCenterY = room.height / 2;

  // Sample pathway points from each door to room center
  let sampledPoints = 0;
  let blockedPoints = 0;

  if (Array.isArray(room.doors) && room.doors.length > 0) {
    for (const door of room.doors) {
      const steps = 10;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const px = door.x + (roomCenterX - door.x) * t;
        const py = door.y + (roomCenterY - door.y) * t;

        sampledPoints++;
        const isBlocked = chromosome.some((gene) => pointInFurniture(px, py, gene));
        if (isBlocked) {
          blockedPoints++;
        }
      }
    }
  } else {
    // If no doors specified, sample central axes (cross-flow)
    const steps = 10;
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      const px = room.width * t;
      const py = room.height * t;
      sampledPoints++;
      if (chromosome.some((gene) => pointInFurniture(px, roomCenterY, gene))) {
        blockedPoints++;
      }
      sampledPoints++;
      if (chromosome.some((gene) => pointInFurniture(roomCenterX, py, gene))) {
        blockedPoints++;
      }
    }
  }

  const pathClearanceRatio = sampledPoints > 0 ? (sampledPoints - blockedPoints) / sampledPoints : 1;

  // Measure center room circulation ratio (inner 40% box)
  const innerMinX = room.width * 0.3;
  const innerMaxX = room.width * 0.7;
  const innerMinY = room.height * 0.3;
  const innerMaxY = room.height * 0.7;

  let centerSampleCount = 0;
  let centerBlockedCount = 0;

  for (let x = innerMinX; x <= innerMaxX; x += (innerMaxX - innerMinX) / 4) {
    for (let y = innerMinY; y <= innerMaxY; y += (innerMaxY - innerMinY) / 4) {
      centerSampleCount++;
      if (chromosome.some((gene) => pointInFurniture(x, y, gene))) {
        centerBlockedCount++;
      }
    }
  }

  const centerClearanceRatio = centerSampleCount > 0 ? (centerSampleCount - centerBlockedCount) / centerSampleCount : 1;

  const trafficScore = (pathClearanceRatio * 0.6) + (centerClearanceRatio * 0.4);

  return Number(Math.max(0, Math.min(1, trafficScore)).toFixed(4));
}

/**
 * Objective 3: Light Exposure
 *
 * Incorporates furniture catalog tags:
 * - "light-preferring" (e.g. Desk): high score when placed near windows
 * - "light-avoiding" (e.g. Bookshelf): high score when kept away from direct window glare
 * - neutral furniture: balanced score maintaining natural lighting distribution
 */
function calculateLightExposure(room, chromosome) {
  if (chromosome.length === 0) {
    return 1;
  }

  if (!Array.isArray(room.windows) || room.windows.length === 0) {
    return 1; // Neutral full score if room has no windows
  }

  const roomDiagonal = Math.sqrt(
    room.width * room.width +
    room.height * room.height
  ) || 1;

  let totalScore = 0;

  for (const gene of chromosome) {
    const furniture = furnitureMap.get(gene.furnitureId);
    const center = getFurnitureCenter(gene);

    let closestWindowDist = Infinity;
    for (const win of room.windows) {
      const d = distance(center, { x: win.x, y: win.y });
      closestWindowDist = Math.min(closestWindowDist, d);
    }

    const normalizedDist = Math.min(closestWindowDist / roomDiagonal, 1);

    if (furniture?.tags?.includes("light-preferring")) {
      // Closer to window is better
      totalScore += 1 - normalizedDist;
    } else if (furniture?.tags?.includes("light-avoiding")) {
      // Further from direct window is better (up to half room distance)
      totalScore += Math.min(normalizedDist * 2, 1);
    } else {
      // Neutral items: moderate distance (0.2 to 0.7 diagonal) is ideal
      const distScore = 1 - Math.abs(normalizedDist - 0.4);
      totalScore += Math.max(0, Math.min(1, distScore));
    }
  }

  return Number((totalScore / chromosome.length).toFixed(4));
}

/**
 * Objective 4: Clustering
 *
 * Rewards functionally related furniture pairings (e.g. bed + nightstand, desk + chair, sofa + table)
 * being placed in proximity, while respecting same-category groupings.
 */
const COMPLEMENTARY_PAIRS = [
  ["bed", "storage"],          // Bed + Nightstand / Wardrobe
  ["work", "seating"],          // Desk + Office Chair
  ["seating", "table"],         // Sofa + Coffee Table / Armchair + Side Table
  ["seating", "entertainment"], // Sofa + TV Stand
  ["table", "seating"]          // Dining Table + Dining Chair
];

function getCategoryAffinity(catA, catB) {
  if (catA === catB) return 1.0;
  for (const [p1, p2] of COMPLEMENTARY_PAIRS) {
    if ((catA === p1 && catB === p2) || (catA === p2 && catB === p1)) {
      return 0.85;
    }
  }
  return 0;
}

function calculateClustering(room, chromosome) {
  if (chromosome.length < 2) {
    return 1;
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;

  const roomDiagonal = Math.sqrt(
    room.width * room.width +
    room.height * room.height
  ) || 1;

  for (let i = 0; i < chromosome.length; i++) {
    for (let j = i + 1; j < chromosome.length; j++) {
      const furnitureA = furnitureMap.get(chromosome[i].furnitureId);
      const furnitureB = furnitureMap.get(chromosome[j].furnitureId);

      if (!furnitureA || !furnitureB) continue;

      const affinity = getCategoryAffinity(furnitureA.category, furnitureB.category);
      if (affinity > 0) {
        const centerA = getFurnitureCenter(chromosome[i]);
        const centerB = getFurnitureCenter(chromosome[j]);
        const d = distance(centerA, centerB);

        // Ideal distance between clustered items is 60cm - 180cm
        let pairScore;
        if (d < 60) {
          pairScore = d / 60; // Penalize overlapping right on top
        } else if (d <= 200) {
          pairScore = 1.0; // Sweet spot for complementary items
        } else {
          pairScore = Math.max(0, 1 - (d - 200) / (roomDiagonal * 0.6));
        }

        totalWeightedScore += pairScore * affinity;
        totalWeight += affinity;
      }
    }
  }

  if (totalWeight === 0) {
    return 0.8; // Default good baseline when items have no explicit coupling
  }

  return Number((totalWeightedScore / totalWeight).toFixed(4));
}

/**
 * Calculate all four RoomCraft objectives.
 */
function calculateFitness(room, chromosome) {
  return {
    trafficFlow: calculateTrafficFlow(room, chromosome),
    lightExposure: calculateLightExposure(room, chromosome),
    clearance: calculateClearance(room, chromosome),
    clustering: calculateClustering(room, chromosome)
  };
}

module.exports = {
  calculateFitness,
  calculateTrafficFlow,
  calculateLightExposure,
  calculateClearance,
  calculateClustering,
  getFurnitureBounds,
  getFurnitureCenter,
  rectanglesOverlap
};