const { createGene } = require("./chromosome");

const DEFAULT_POPULATION_SIZE = 10;

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRotation() {
  const rotations = [0, 90, 180, 270];

  return rotations[
    Math.floor(Math.random() * rotations.length)
  ];
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

function createRandomChromosome(room) {
  if (!room || typeof room !== "object") {
    throw new Error("Room is required.");
  }

  if (
    !Number.isFinite(room.width) ||
    room.width <= 0
  ) {
    throw new Error("Room width must be a positive number.");
  }

  if (
    !Number.isFinite(room.height) ||
    room.height <= 0
  ) {
    throw new Error("Room height must be a positive number.");
  }

  if (!Array.isArray(room.furnitureSelection)) {
    throw new Error(
      "Room furnitureSelection must be an array."
    );
  }

  return room.furnitureSelection.map((furnitureId) => {
    const rotation = randomRotation();
    const bounds = getFurnitureBounds(furnitureId, rotation);

    const maxX = Math.max(0, room.width - bounds.width);
    const maxY = Math.max(0, room.height - bounds.depth);

    const x = randomNumber(0, maxX);
    const y = randomNumber(0, maxY);

    return createGene(
      furnitureId,
      x,
      y,
      rotation
    );
  });
}

function createInitialPopulation(
  room,
  populationSize = DEFAULT_POPULATION_SIZE
) {
  if (
    !Number.isInteger(populationSize) ||
    populationSize <= 0
  ) {
    throw new Error(
      "Population size must be a positive integer."
    );
  }

  const population = [];

  for (let i = 0; i < populationSize; i++) {
    population.push(
      createRandomChromosome(room)
    );
  }

  return population;
}

module.exports = {
  createInitialPopulation,
  createRandomChromosome,
  DEFAULT_POPULATION_SIZE
};