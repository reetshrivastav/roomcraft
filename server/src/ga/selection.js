const OBJECTIVES = [
  "trafficFlow",
  "lightExposure",
  "clearance",
  "clustering"
];

/**
 * Calculate the average of all objective scores.
 *
 * This is used only as a tie-breaker between
 * candidates with the same Pareto rank.
 */
function averageScore(scores) {
  let total = 0;

  for (const objective of OBJECTIVES) {
    total += scores[objective];
  }

  return total / OBJECTIVES.length;
}

/**
 * Compare two evaluated candidates.
 *
 * Lower Pareto rank is better.
 *
 * If ranks are equal, higher average objective
 * score is better.
 */
function compareCandidates(candidateA, candidateB) {
  if (candidateA.rank !== candidateB.rank) {
    return candidateA.rank - candidateB.rank;
  }

  return (
    averageScore(candidateB.scores) -
    averageScore(candidateA.scores)
  );
}

/**
 * Select the strongest candidates from the
 * ranked population.
 *
 * The original candidate objects are not mutated.
 */
function selectParents(rankedPopulation, parentCount) {
  if (!Array.isArray(rankedPopulation)) {
    throw new Error("Ranked population must be an array.");
  }

  if (
    !Number.isInteger(parentCount) ||
    parentCount <= 0
  ) {
    throw new Error(
      "Parent count must be a positive integer."
    );
  }

  if (rankedPopulation.length === 0) {
    return [];
  }

  const sortedPopulation = [...rankedPopulation].sort(
    compareCandidates
  );

  return sortedPopulation.slice(
    0,
    Math.min(parentCount, sortedPopulation.length)
  );
}

module.exports = {
  selectParents,
  averageScore,
  compareCandidates
};