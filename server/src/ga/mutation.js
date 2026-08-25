const furnitureCatalog = require("../../../furnitureCatalog.json");

const furnitureMap = new Map(
  furnitureCatalog.map((furniture) => [
    furniture.id,
    furniture
  ])
);

const ROTATIONS = [0, 90, 180, 270];

/**
 * Get furniture dimensions after rotation.
 */
function getFurnitureBounds(gene) {
  const furniture = furnitureMap.get(
    gene.furnitureId
  );

  if (!furniture) {
    throw new Error(
      `Furniture not found in catalog: ${gene.furnitureId}`
    );
  }

  const rotated =
    gene.rotation === 90 ||
    gene.rotation === 270;

  return {
    width: rotated
      ? furniture.depth
      : furniture.width,

    depth: rotated
      ? furniture.width
      : furniture.depth
  };
}

/**
 * Keep a number within a range.
 */
function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

/**
 * Mutate one chromosome.
 *
 * mutationRate:
 * Probability that each furniture item is mutated.
 *
 * positionMutationAmount:
 * Maximum number of centimeters by which
 * x/y can move.
 */
function mutateChromosome(
  room,
  chromosome,
  mutationRate = 0.2,
  positionMutationAmount = 50
) {
  if (!room || typeof room !== "object") {
    throw new Error("Room is required.");
  }

  if (!Array.isArray(chromosome)) {
    throw new Error("Chromosome must be an array.");
  }

  if (
    mutationRate < 0 ||
    mutationRate > 1
  ) {
    throw new Error(
      "Mutation rate must be between 0 and 1."
    );
  }

  if (
    positionMutationAmount < 0
  ) {
    throw new Error(
      "Position mutation amount must be non-negative."
    );
  }

  return chromosome.map((gene) => {
    const mutatedGene = {
      ...gene
    };

    // Decide whether this gene mutates.
    if (Math.random() >= mutationRate) {
      return mutatedGene;
    }

    // -------------------------
    // Position mutation
    // -------------------------

    const deltaX =
      (Math.random() * 2 - 1) *
      positionMutationAmount;

    const deltaY =
      (Math.random() * 2 - 1) *
      positionMutationAmount;

    mutatedGene.x += deltaX;
    mutatedGene.y += deltaY;

    // -------------------------
    // Rotation mutation
    // -------------------------

    if (Math.random() < 0.5) {
      const randomRotation =
        ROTATIONS[
          Math.floor(
            Math.random() * ROTATIONS.length
          )
        ];

      mutatedGene.rotation =
        randomRotation;
    }

    // -------------------------
    // Keep furniture inside room
    // -------------------------

    const bounds =
      getFurnitureBounds(mutatedGene);

    const maxX = Math.max(
      0,
      room.width - bounds.width
    );

    const maxY = Math.max(
      0,
      room.height - bounds.depth
    );

    mutatedGene.x = clamp(
      mutatedGene.x,
      0,
      maxX
    );

    mutatedGene.y = clamp(
      mutatedGene.y,
      0,
      maxY
    );

    return mutatedGene;
  });
}

/**
 * Mutate an entire population of children.
 */
function mutatePopulation(
  room,
  children,
  mutationRate = 0.2,
  positionMutationAmount = 50
) {
  if (!Array.isArray(children)) {
    throw new Error(
      "Children must be an array."
    );
  }

  return children.map((chromosome) =>
    mutateChromosome(
      room,
      chromosome,
      mutationRate,
      positionMutationAmount
    )
  );
}

module.exports = {
  mutateChromosome,
  mutatePopulation,
  getFurnitureBounds
};