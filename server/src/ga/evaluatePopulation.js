const { calculateFitness } = require("./fitness");

/**
 * Evaluate every chromosome in a population.
 *
 * Returns an array containing each chromosome
 * together with its objective scores.
 */
function evaluatePopulation(room, population) {
  if (!Array.isArray(population)) {
    throw new Error("Population must be an array.");
  }

  return population.map((chromosome) => {
    const scores = calculateFitness(
      room,
      chromosome
    );

    return {
      chromosome,
      scores
    };
  });
}

module.exports = {
  evaluatePopulation
};