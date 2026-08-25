const { dominates } = require("./pareto");

/**
 * Assign a Pareto rank to every evaluated candidate.
 *
 * Rank 0 = first non-dominated front
 * Rank 1 = second front
 * Rank 2 = third front
 * etc.
 */
function assignParetoRanks(evaluatedPopulation) {
  if (!Array.isArray(evaluatedPopulation)) {
    throw new Error("Evaluated population must be an array.");
  }

  const size = evaluatedPopulation.length;

  if (size === 0) {
    return [];
  }

  const dominationCounts = new Array(size).fill(0);
  const dominatedCandidates = Array.from(
    { length: size },
    () => []
  );

  const ranks = new Array(size).fill(null);

  // Determine who dominates whom.
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      const scoresI = evaluatedPopulation[i].scores;
      const scoresJ = evaluatedPopulation[j].scores;

      if (dominates(scoresI, scoresJ)) {
        dominatedCandidates[i].push(j);
        dominationCounts[j]++;
      } else if (dominates(scoresJ, scoresI)) {
        dominatedCandidates[j].push(i);
        dominationCounts[i]++;
      }
    }
  }

  // First front = candidates not dominated by anyone.
  let currentFront = [];

  for (let i = 0; i < size; i++) {
    if (dominationCounts[i] === 0) {
      ranks[i] = 0;
      currentFront.push(i);
    }
  }

  // Build subsequent fronts.
  let currentRank = 0;

  while (currentFront.length > 0) {
    const nextFront = [];

    for (const candidateIndex of currentFront) {
      for (const dominatedIndex of dominatedCandidates[candidateIndex]) {
        dominationCounts[dominatedIndex]--;

        if (dominationCounts[dominatedIndex] === 0) {
          ranks[dominatedIndex] = currentRank + 1;
          nextFront.push(dominatedIndex);
        }
      }
    }

    currentRank++;
    currentFront = nextFront;
  }

  return evaluatedPopulation.map((candidate, index) => ({
    ...candidate,
    rank: ranks[index]
  }));
}

module.exports = {
  assignParetoRanks
};