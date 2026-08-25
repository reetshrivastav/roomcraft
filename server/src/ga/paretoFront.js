const { dominates } = require("./pareto");

/**
 * Extract the non-dominated candidates from an evaluated population.
 *
 * Every candidate is expected to have:
 * {
 *   chromosome: [...],
 *   scores: {
 *     trafficFlow,
 *     lightExposure,
 *     clearance,
 *     clustering
 *   }
 * }
 */
function getParetoFront(evaluatedPopulation) {
  if (!Array.isArray(evaluatedPopulation)) {
    throw new Error("Evaluated population must be an array.");
  }

  const paretoFront = [];

  for (let i = 0; i < evaluatedPopulation.length; i++) {
    const candidate = evaluatedPopulation[i];

    let isDominated = false;

    for (let j = 0; j < evaluatedPopulation.length; j++) {
      if (i === j) {
        continue;
      }

      const otherCandidate = evaluatedPopulation[j];

      if (dominates(otherCandidate.scores, candidate.scores)) {
        isDominated = true;
        break;
      }
    }

    if (!isDominated) {
      paretoFront.push(candidate);
    }
  }

  return paretoFront;
}

module.exports = {
  getParetoFront
};