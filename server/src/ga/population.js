const { createGene } = require("./chromosome");

const DEFAULT_POPULATION_SIZE = 16;

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRotation() {
  const rotations = [0, 90, 180, 270];
  return rotations[Math.floor(Math.random() * rotations.length)];
}

const furnitureCatalog = require("../../../furnitureCatalog.json");
const furnitureMap = new Map(furnitureCatalog.map((item) => [item.id, item]));

function getFurnitureBounds(furnitureId, rotation) {
  const item = furnitureMap.get(furnitureId);
  if (!item) {
    return { width: 50, depth: 50 };
  }
  const isRotated = rotation === 90 || rotation === 270;
  return {
    width: isRotated ? item.depth : item.width,
    depth: isRotated ? item.width : item.depth
  };
}

/**
 * Check if two placed items overlap.
 */
function isOverlapping(x1, y1, w1, h1, x2, y2, w2, h2) {
  return (
    x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2
  );
}

/**
 * Create a chromosome with a specific spatial wall archetype bias
 * (e.g. primary bed/sofa placed along North, East, South, or West wall).
 */
function createArchetypeChromosome(room, archetypeIndex = 0) {
  if (!room || typeof room !== "object") {
    throw new Error("Room is required.");
  }

  const placedGenes = [];
  const diningChairs = [];
  let diningTableGene = null;

  // Separate dining table and chairs for smart pairing
  const items = [...room.furnitureSelection];

  items.forEach((furnitureId, idx) => {
    const furniture = furnitureMap.get(furnitureId);
    let rotation = randomRotation();
    let bounds = getFurnitureBounds(furnitureId, rotation);

    const maxX = Math.max(0, room.width - bounds.width);
    const maxY = Math.max(0, room.height - bounds.depth);

    let x = 0;
    let y = 0;

    // Handle Dining Chairs around Dining Table
    if (furnitureId === "dining-chair" && diningTableGene) {
      diningChairs.push({ furnitureId, idx });
      return;
    }

    // Assign archetype positions for main items
    const wallBias = (archetypeIndex + idx) % 4; // 0: Top, 1: Right, 2: Bottom, 3: Left
    if (furniture?.tags?.includes("must-be-near-wall")) {
      if (wallBias === 0) {
        rotation = 0;
        bounds = getFurnitureBounds(furnitureId, rotation);
        x = randomNumber(0, Math.max(0, room.width - bounds.width));
        y = 0;
      } else if (wallBias === 1) {
        rotation = 90;
        bounds = getFurnitureBounds(furnitureId, rotation);
        x = Math.max(0, room.width - bounds.width);
        y = randomNumber(0, Math.max(0, room.height - bounds.depth));
      } else if (wallBias === 2) {
        rotation = 180;
        bounds = getFurnitureBounds(furnitureId, rotation);
        x = randomNumber(0, Math.max(0, room.width - bounds.width));
        y = Math.max(0, room.height - bounds.depth);
      } else {
        rotation = 270;
        bounds = getFurnitureBounds(furnitureId, rotation);
        x = 0;
        y = randomNumber(0, Math.max(0, room.height - bounds.depth));
      }
    } else {
      x = randomNumber(0, maxX);
      y = randomNumber(0, maxY);
    }

    // Try finding a non-overlapping slot
    let attempts = 0;
    while (attempts < 15) {
      const collision = placedGenes.some(g => {
        const gb = getFurnitureBounds(g.furnitureId, g.rotation);
        return isOverlapping(x, y, bounds.width, bounds.depth, g.x, g.y, gb.width, gb.depth);
      });

      if (!collision) break;
      x = randomNumber(0, maxX);
      y = randomNumber(0, maxY);
      attempts++;
    }

    const gene = createGene(furnitureId, x, y, rotation);
    placedGenes.push(gene);

    if (furnitureId === "dining-table") {
      diningTableGene = gene;
    }
  });

  // Arrange dining chairs around the table perimeter if table exists
  if (diningTableGene && diningChairs.length > 0) {
    const tableBounds = getFurnitureBounds(diningTableGene.furnitureId, diningTableGene.rotation);
    const chairSlots = [
      { x: diningTableGene.x + tableBounds.width * 0.2, y: Math.max(0, diningTableGene.y - 55), rot: 0 },
      { x: diningTableGene.x + tableBounds.width * 0.7, y: Math.max(0, diningTableGene.y - 55), rot: 0 },
      { x: diningTableGene.x + tableBounds.width * 0.2, y: Math.min(room.height - 50, diningTableGene.y + tableBounds.depth + 10), rot: 180 },
      { x: diningTableGene.x + tableBounds.width * 0.7, y: Math.min(room.height - 50, diningTableGene.y + tableBounds.depth + 10), rot: 180 },
      { x: Math.max(0, diningTableGene.x - 55), y: diningTableGene.y + tableBounds.depth * 0.3, rot: 90 },
      { x: Math.min(room.width - 50, diningTableGene.x + tableBounds.width + 10), y: diningTableGene.y + tableBounds.depth * 0.3, rot: 270 }
    ];

    diningChairs.forEach((chair, cIdx) => {
      const slot = chairSlots[cIdx % chairSlots.length];
      placedGenes.push(createGene(chair.furnitureId, Math.round(slot.x), Math.round(slot.y), slot.rot));
    });
  }

  return placedGenes;
}

function createInitialPopulation(
  room,
  populationSize = DEFAULT_POPULATION_SIZE
) {
  if (!Number.isInteger(populationSize) || populationSize <= 0) {
    throw new Error("Population size must be a positive integer.");
  }

  const population = [];

  for (let i = 0; i < populationSize; i++) {
    population.push(createArchetypeChromosome(room, i));
  }

  return population;
}

module.exports = {
  createInitialPopulation,
  createRandomChromosome: (room) => createArchetypeChromosome(room, 0),
  createArchetypeChromosome,
  getFurnitureBounds,
  DEFAULT_POPULATION_SIZE
};