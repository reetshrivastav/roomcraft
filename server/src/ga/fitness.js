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
 * Objective 1: Clearance
 *
 * Rewards layouts where furniture does not overlap
 * and has reasonable spacing between items.
 */
function calculateClearance(room, chromosome) {
  if (chromosome.length === 0) {
    return 1;
  }

  let overlapCount = 0;

  for (let i = 0; i < chromosome.length; i++) {
    for (let j = i + 1; j < chromosome.length; j++) {
      if (
        rectanglesOverlap(
          chromosome[i],
          chromosome[j]
        )
      ) {
        overlapCount++;
      }
    }
  }

  const pairCount =
    (chromosome.length * (chromosome.length - 1)) / 2;

  if (pairCount === 0) {
    return 1;
  }

  const overlapScore =
    1 - overlapCount / pairCount;

  const minimumDistance =
    minimumFurnitureDistance(chromosome);

  const spacingScore =
    minimumDistance === Infinity
      ? 1
      : Math.min(
          minimumDistance / MIN_CLEARANCE,
          1
        );

  return Number(
    ((overlapScore + spacingScore) / 2).toFixed(4)
  );
}

/**
 * Objective 2: Traffic Flow
 *
 * Rewards furniture arrangements that leave
 * more open space in the room.
 *
 * This is intentionally a simple heuristic for now.
 */
function calculateTrafficFlow(room, chromosome) {
  if (chromosome.length === 0) {
    return 1;
  }

  let occupiedArea = 0;

  for (const gene of chromosome) {
    const bounds = getFurnitureBounds(gene);

    occupiedArea +=
      bounds.width * bounds.depth;
  }

  const roomArea =
    room.width * room.height;

  if (roomArea <= 0) {
    return 0;
  }

  const occupiedRatio =
    occupiedArea / roomArea;

  return Number(
    Math.max(
      0,
      Math.min(
        1,
        1 - occupiedRatio
      )
    ).toFixed(4)
  );
}

/**
 * Objective 3: Light Exposure
 *
 * Rewards furniture that is positioned closer
 * to windows.
 *
 * Window positions are treated as the light sources.
 */
function calculateLightExposure(room, chromosome) {
  if (
    !Array.isArray(room.windows) ||
    room.windows.length === 0
  ) {
    return 0;
  }

  if (chromosome.length === 0) {
    return 1;
  }

  let totalScore = 0;

  for (const gene of chromosome) {
    const furnitureCenter =
      getFurnitureCenter(gene);

    let closestWindowDistance = Infinity;

    for (const window of room.windows) {
      const windowPoint = {
        x: window.x,
        y: window.y
      };

      const currentDistance = distance(
        furnitureCenter,
        windowPoint
      );

      closestWindowDistance = Math.min(
        closestWindowDistance,
        currentDistance
      );
    }

    const roomDiagonal = Math.sqrt(
      room.width * room.width +
      room.height * room.height
    );

    const score =
      1 -
      Math.min(
        closestWindowDistance / roomDiagonal,
        1
      );

    totalScore += score;
  }

  return Number(
    (totalScore / chromosome.length).toFixed(4)
  );
}

/**
 * Objective 4: Clustering
 *
 * Rewards furniture that belongs to the same
 * functional categories being reasonably close.
 *
 * For now, we compare furniture belonging to
 * the same category.
 */
function calculateClustering(room, chromosome) {
  if (chromosome.length < 2) {
    return 1;
  }

  let sameCategoryPairs = 0;
  let totalSameCategoryDistance = 0;

  for (let i = 0; i < chromosome.length; i++) {
    for (let j = i + 1; j < chromosome.length; j++) {
      const furnitureA =
        furnitureMap.get(
          chromosome[i].furnitureId
        );

      const furnitureB =
        furnitureMap.get(
          chromosome[j].furnitureId
        );

      if (!furnitureA || !furnitureB) {
        continue;
      }

      if (
        furnitureA.category ===
        furnitureB.category
      ) {
        const centerA =
          getFurnitureCenter(chromosome[i]);

        const centerB =
          getFurnitureCenter(chromosome[j]);

        totalSameCategoryDistance +=
          distance(centerA, centerB);

        sameCategoryPairs++;
      }
    }
  }

  if (sameCategoryPairs === 0) {
    return 0.5;
  }

  const averageDistance =
    totalSameCategoryDistance /
    sameCategoryPairs;

  const roomDiagonal = Math.sqrt(
    room.width * room.width +
    room.height * room.height
  );

  return Number(
    Math.max(
      0,
      Math.min(
        1,
        1 -
          averageDistance /
            roomDiagonal
      )
    ).toFixed(4)
  );
}

/**
 * Calculate all four RoomCraft objectives.
 */
function calculateFitness(room, chromosome) {
  return {
    trafficFlow: calculateTrafficFlow(
      room,
      chromosome
    ),

    lightExposure: calculateLightExposure(
      room,
      chromosome
    ),

    clearance: calculateClearance(
      room,
      chromosome
    ),

    clustering: calculateClustering(
      room,
      chromosome
    )
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