const { createChromosome } = require("./chromosome");

function generateLayouts(room) {
  const chromosome = createChromosome(room);

  return [
    {
      layout: chromosome,

      scores: {
        trafficFlow: 0,
        lightExposure: 0,
        clearance: 0,
        clustering: 0
      },

      isParetoOptimal: true
    }
  ];
}

module.exports = generateLayouts;