const ALLOWED_ROTATIONS = [0, 90, 180, 270];

/**
 * Create a single furniture gene.
 *
 * A gene represents the placement of one furniture item
 * inside a room.
 */
function createGene(furnitureId, x, y, rotation = 0) {
  if (typeof furnitureId !== "string" || furnitureId.trim() === "") {
    throw new Error("Furniture ID must be a non-empty string.");
  }

  if (!Number.isFinite(x) || x < 0) {
    throw new Error("Gene x must be a non-negative number.");
  }

  if (!Number.isFinite(y) || y < 0) {
    throw new Error("Gene y must be a non-negative number.");
  }

  if (!ALLOWED_ROTATIONS.includes(rotation)) {
    throw new Error(
      "Gene rotation must be 0, 90, 180, or 270."
    );
  }

  return {
    furnitureId,
    x,
    y,
    rotation
  };
}

/**
 * Create one chromosome from a room.
 *
 * For now, furniture is placed using a simple deterministic
 * initialization strategy. The actual GA will later create
 * multiple chromosomes and evolve them.
 */
function createChromosome(room) {
  if (!room || typeof room !== "object") {
    throw new Error("Room is required.");
  }

  if (!Array.isArray(room.furnitureSelection)) {
    throw new Error("Room furnitureSelection must be an array.");
  }

  const chromosome = room.furnitureSelection.map(
    (furnitureId, index) => {
      const x = 50 + index * 100;
      const y = 50 + index * 50;

      return createGene(
        furnitureId,
        x,
        y,
        0
      );
    }
  );

  return chromosome;
}

module.exports = {
  createGene,
  createChromosome,
  ALLOWED_ROTATIONS
};