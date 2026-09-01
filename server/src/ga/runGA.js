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

function areChromosomesSimilar(chromA, chromB, threshold = 20) {
  if (chromA.length !== chromB.length) return false;
  for (let i = 0; i < chromA.length; i++) {
    const gA = chromA[i];
    const gB = chromB[i];
    if (gA.furnitureId !== gB.furnitureId) return false;
    if (gA.rotation !== gB.rotation) return false;
    if (Math.abs(gA.x - gB.x) > threshold || Math.abs(gA.y - gB.y) > threshold) {
      return false;
    }
  }
  return true;
}

function deduplicateCandidates(candidates) {
  const unique = [];
  for (const candidate of candidates) {
    const isDuplicate = unique.some((existing) =>
      areChromosomesSimilar(existing.chromosome, candidate.chromosome)
    );
    if (!isDuplicate) {
      unique.push(candidate);
    }
  }
  return unique;
}

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
    throw new Error("Population size must be at least 2.");
  }

  if (generations < 1) {
    throw new Error("Number of generations must be at least 1.");
  }

  if (parentCount < 2 || parentCount > populationSize) {
    throw new Error("Parent count must be between 2 and population size.");
  }

  let population = createFirstGeneration(room, populationSize);
  let allEvaluatedCandidates = [];

  for (let generation = 0; generation < generations; generation++) {
    const evaluated = evaluatePopulation(room, population);
    allEvaluatedCandidates.push(...evaluated);

    if (generation === generations - 1) {
      break;
    }

    const result = createNextGeneration(room, population, {
      parentCount,
      childCount: populationSize,
      mutationRate,
      positionMutationAmount
    });

    population = result.nextGeneration;
  }

  // Extract non-dominated solutions across all evaluated generations
  const uniqueCandidates = deduplicateCandidates(allEvaluatedCandidates, 35);
  const globalParetoFront = getParetoFront(uniqueCandidates);

  // Return deduplicated final Pareto front, capped at max 8 most distinct high-quality layouts
  let finalParetoFront = deduplicateCandidates(globalParetoFront, 40);

  if (finalParetoFront.length > 8) {
    // Sort by diversity/average score and pick top 8
    finalParetoFront.sort((a, b) => {
      const avgA = (a.scores.trafficFlow + a.scores.lightExposure + a.scores.clearance + a.scores.clustering) / 4;
      const avgB = (b.scores.trafficFlow + b.scores.lightExposure + b.scores.clearance + b.scores.clustering) / 4;
      return avgB - avgA;
    });
    finalParetoFront = finalParetoFront.slice(0, 8);
  }

  return {
    generations,
    populationSize,
    paretoFront: finalParetoFront.length > 0 ? finalParetoFront : globalParetoFront.slice(0, 1)
  };
}

module.exports = {
  runGeneticAlgorithm,
  deduplicateCandidates
};