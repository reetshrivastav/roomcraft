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
    const x = randomNumber(
      0,
      Math.max(0, room.width - 1)
    );

    const y = randomNumber(
      0,
      Math.max(0, room.height - 1)
    );

    const rotation = randomRotation();

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