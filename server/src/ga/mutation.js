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
  const furniture = furnitureMap.get(gene.furnitureId);

  if (!furniture) {
    return { width: 50, depth: 50 };
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function checkOverlap(gA, gB) {
  const bA = getFurnitureBounds(gA);
  const bB = getFurnitureBounds(gB);

  return (
    gA.x < gB.x + bB.width &&
    gA.x + bA.width > gB.x &&
    gA.y < gB.y + bB.depth &&
    gA.y + bA.depth > gB.y
  );
}

/**
 * Mutate one chromosome with collision repair.
 */
function mutateChromosome(
  room,
  chromosome,
  mutationRate = 0.25,
  positionMutationAmount = 60
) {
  if (!room || typeof room !== "object") {
    throw new Error("Room is required.");
  }

  if (!Array.isArray(chromosome)) {
    throw new Error("Chromosome must be an array.");
  }

  const mutated = chromosome.map((gene) => {
    const mutatedGene = { ...gene };

    if (Math.random() < mutationRate) {
      // Position mutation
      const deltaX = (Math.random() * 2 - 1) * positionMutationAmount;
      const deltaY = (Math.random() * 2 - 1) * positionMutationAmount;

      mutatedGene.x += deltaX;
      mutatedGene.y += deltaY;

      // Rotation mutation
      if (Math.random() < 0.4) {
        mutatedGene.rotation = ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];
      }
    }

    // Keep furniture inside room boundaries
    const bounds = getFurnitureBounds(mutatedGene);
    const maxX = Math.max(0, room.width - bounds.width);
    const maxY = Math.max(0, room.height - bounds.depth);

    mutatedGene.x = Math.round(clamp(mutatedGene.x, 0, maxX));
    mutatedGene.y = Math.round(clamp(mutatedGene.y, 0, maxY));

    return mutatedGene;
  });

  // Collision separation / repair pass
  for (let i = 0; i < mutated.length; i++) {
    for (let j = 0; j < i; j++) {
      if (checkOverlap(mutated[i], mutated[j])) {
        const bI = getFurnitureBounds(mutated[i]);
        const bJ = getFurnitureBounds(mutated[j]);

        // Push along axis of least overlap
        const pushRight = (mutated[j].x + bJ.width) - mutated[i].x;
        const pushDown = (mutated[j].y + bJ.depth) - mutated[i].y;

        if (pushRight < pushDown && mutated[i].x + pushRight + bI.width <= room.width) {
          mutated[i].x = Math.min(room.width - bI.width, mutated[i].x + pushRight + 5);
        } else if (mutated[i].y + pushDown + bI.depth <= room.height) {
          mutated[i].y = Math.min(room.height - bI.depth, mutated[i].y + pushDown + 5);
        } else {
          // Wrap/shift to other side if cornered
          mutated[i].x = Math.max(0, mutated[j].x - bI.width - 5);
        }
      }
    }
  }

  return mutated;
}

/**
 * Mutate an entire population of children.
 */
function mutatePopulation(
  room,
  children,
  mutationRate = 0.25,
  positionMutationAmount = 60
) {
  if (!Array.isArray(children)) {
    throw new Error("Children must be an array.");
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