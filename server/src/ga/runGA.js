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
 * Calculate spatial Euclidean layout distance between two chromosomes.
 */
function spatialDistance(chromA, chromB) {
  let dist = 0;
  const len = Math.min(chromA.length, chromB.length);

  for (let i = 0; i < len; i++) {
    const gA = chromA[i];
    const gB = chromB[i];
    const dx = gA.x - gB.x;
    const dy = gA.y - gB.y;
    const rotDiff = gA.rotation !== gB.rotation ? 60 : 0;
    dist += Math.sqrt(dx * dx + dy * dy) + rotDiff;
  }

  return dist;
}

/**
 * Select a subset of candidates that maximizes pairwise spatial diversity.
 */
function selectDiverseCandidates(candidates, targetCount = 8) {
  if (candidates.length <= targetCount) {
    return candidates;
  }

  // 1. Sort by weighted score based on Rules v2: Clearance 20%, Traffic 20%, Light 20%, Zone 40%
  const pool = [...candidates].sort((a, b) => {
    const avgA = (a.scores.trafficFlow * 0.2) + (a.scores.lightExposure * 0.2) + (a.scores.clearance * 0.2) + (a.scores.clustering * 0.4);
    const avgB = (b.scores.trafficFlow * 0.2) + (b.scores.lightExposure * 0.2) + (b.scores.clearance * 0.2) + (b.scores.clustering * 0.4);
    return avgB - avgA;
  });

  const selected = [pool[0]];
  const remaining = pool.slice(1);

  // 2. Greedy farthest-point sampling for spatial diversity
  while (selected.length < targetCount && remaining.length > 0) {
    let maxMinDist = -1;
    let bestIdx = -1;

    for (let i = 0; i < remaining.length; i++) {
      let minDistToSelected = Infinity;
      for (const sel of selected) {
        const d = spatialDistance(remaining[i].chromosome, sel.chromosome);
        minDistToSelected = Math.min(minDistToSelected, d);
      }

      if (minDistToSelected > maxMinDist) {
        maxMinDist = minDistToSelected;
        bestIdx = i;
      }
    }

    if (bestIdx !== -1) {
      selected.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    } else {
      break;
    }
  }

  return selected;
}

/**
 * Run the genetic algorithm for multiple generations.
 */
function runGeneticAlgorithm(room, options = {}) {
  const {
    populationSize = 16,
    generations = 15,
    parentCount = 6,
    mutationRate = 0.25,
    positionMutationAmount = 60
  } = options;

  if (!room || typeof room !== "object") {
    throw new Error("Room is required.");
  }

  if (populationSize < 2) {
    throw new Error("Population size must be at least 2.");
  }

  if (generations < 1) {
    throw new Error("Generations must be at least 1.");
  }

  const { attachDiningChairs } = require("./diningChairs");

  // Create generation 0
  let population = createFirstGeneration(room, populationSize);
  const firstEvaluated = evaluatePopulation(room, population);
  const allEvaluatedCandidates = [...firstEvaluated];

  // Evolve generations
  for (let g = 1; g < generations; g++) {
    const result = createNextGeneration(room, population, {
      parentCount,
      mutationRate,
      positionMutationAmount
    });

    const evaluated = evaluatePopulation(room, result.nextGeneration);
    evaluated.forEach((item) => {
      allEvaluatedCandidates.push(item);
    });

    population = result.nextGeneration;
  }

  // Extract non-dominated global Pareto front
  const globalParetoFront = getParetoFront(allEvaluatedCandidates);

  // Filter out any candidates with zero-clearance collision penalties or blocked swing zones
  const validCandidates = globalParetoFront.filter(c => (c.scores.clearance || 0) > 0.4);
  const pool = validCandidates.length > 0 ? validCandidates : globalParetoFront;

  // Select up to 8 fundamentally distinct layout options
  const finalDiverseOptions = selectDiverseCandidates(pool, 8);
  const chosenCandidates = finalDiverseOptions.length > 0 ? finalDiverseOptions : globalParetoFront.slice(0, 1);

  // Attach deterministic dining chairs to each candidate's chromosome
  const paretoFrontWithChairs = chosenCandidates.map(cand => ({
    ...cand,
    chromosome: attachDiningChairs(cand.chromosome, room)
  }));

  return {
    generations,
    populationSize,
    paretoFront: paretoFrontWithChairs
  };
}

module.exports = {
  runGeneticAlgorithm,
  spatialDistance,
  selectDiverseCandidates
};