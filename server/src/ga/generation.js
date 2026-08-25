const {
  createInitialPopulation
} = require("./population");

const {
  evaluatePopulation
} = require("./evaluatePopulation");

const {
  assignParetoRanks
} = require("./ranking");

const {
  selectParents
} = require("./selection");

const {
  createChildren
} = require("./crossover");

const {
  mutatePopulation
} = require("./mutation");

/**
 * Create one new generation.
 *
 * Pipeline:
 *
 * 1. Create/evaluate population
 * 2. Assign Pareto ranks
 * 3. Select parents
 * 4. Create children through crossover
 * 5. Mutate children
 *
 * Returns the mutated children that form
 * the next generation.
 */
function createNextGeneration(
  room,
  population,
  options = {}
) {
  const {
    parentCount = 4,
    childCount = population.length,
    mutationRate = 0.2,
    positionMutationAmount = 50
  } = options;

  if (!room || typeof room !== "object") {
    throw new Error("Room is required.");
  }

  if (!Array.isArray(population)) {
    throw new Error(
      "Population must be an array."
    );
  }

  if (population.length === 0) {
    throw new Error(
      "Population cannot be empty."
    );
  }

  if (
    parentCount < 2 ||
    parentCount > population.length
  ) {
    throw new Error(
      "Parent count must be at least 2 and no greater than population size."
    );
  }

  if (childCount < 1) {
    throw new Error(
      "Child count must be at least 1."
    );
  }

  // -------------------------
  // Step 1: Evaluate
  // -------------------------

  const evaluated =
    evaluatePopulation(
      room,
      population
    );

  // -------------------------
  // Step 2: Pareto ranking
  // -------------------------

  const ranked =
    assignParetoRanks(evaluated);

  // -------------------------
  // Step 3: Parent selection
  // -------------------------

  const parents =
    selectParents(
      ranked,
      parentCount
    );

  // -------------------------
  // Step 4: Crossover
  // -------------------------

  const children =
    createChildren(
      parents,
      childCount
    );

  // -------------------------
  // Step 5: Mutation
  // -------------------------

  const mutatedChildren =
    mutatePopulation(
      room,
      children,
      mutationRate,
      positionMutationAmount
    );

  return {
    evaluated,
    ranked,
    parents,
    children,
    nextGeneration:
      mutatedChildren
  };
}

/**
 * Create the first population.
 *
 * This helper keeps population initialization
 * separate from subsequent generations.
 */
function createFirstGeneration(
  room,
  populationSize = 10
) {
  return createInitialPopulation(
    room,
    populationSize
  );
}

module.exports = {
  createNextGeneration,
  createFirstGeneration
};