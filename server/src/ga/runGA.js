const {
  createFirstGeneration,
  createNextGeneration
} = require("./generation");

const {
  evaluatePopulation
} = require("./evaluatePopulation");

const {
  getParetoFront
} = require("./paretoFront");

/**
 * Run the genetic algorithm for multiple generations.
 *
 * Returns the final Pareto-optimal candidates.
 */
function runGeneticAlgorithm(room, options = {}) {
  const {
    populationSize = 10,
    generations = 10,
    parentCount = 4,
    mutationRate = 0.2,
    positionMutationAmount = 50
  } = options;

  if (!room || typeof room !== "object") {
    throw new Error("Room is required.");
  }

  if (populationSize < 2) {
    throw new Error(
      "Population size must be at least 2."
    );
  }

  if (generations < 1) {
    throw new Error(
      "Number of generations must be at least 1."
    );
  }

  if (
    parentCount < 2 ||
    parentCount > populationSize
  ) {
    throw new Error(
      "Parent count must be between 2 and population size."
    );
  }

  // -------------------------
  // Generation 0
  // -------------------------

  let population =
    createFirstGeneration(
      room,
      populationSize
    );

  let bestParetoFront = [];

  // -------------------------
  // Evolution loop
  // -------------------------

  for (
    let generation = 0;
    generation < generations;
    generation++
  ) {
    // Evaluate current population
    const evaluated =
      evaluatePopulation(
        room,
        population
      );

    // Find current Pareto front
    const paretoFront =
      getParetoFront(evaluated);

    // Keep the best Pareto front seen so far.
    //
    // For now we simply replace it with the
    // current generation's front.
    bestParetoFront = paretoFront;

    // No need to create another generation
    // after the final iteration.
    if (generation === generations - 1) {
      break;
    }

    // Create next generation
    const result =
      createNextGeneration(
        room,
        population,
        {
          parentCount,
          childCount: populationSize,
          mutationRate,
          positionMutationAmount
        }
      );

    population =
      result.nextGeneration;
  }

  return {
    generations,
    populationSize,
    paretoFront: bestParetoFront
  };
}

module.exports = {
  runGeneticAlgorithm
};