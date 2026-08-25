function dominates(scoresA, scoresB) {
  const objectives = [
    "trafficFlow",
    "lightExposure",
    "clearance",
    "clustering"
  ];

  let strictlyBetter = false;

  for (const objective of objectives) {
    const a = scoresA[objective];
    const b = scoresB[objective];

    if (a < b) {
      return false;
    }

    if (a > b) {
      strictlyBetter = true;
    }
  }

  return strictlyBetter;
}

module.exports = {
  dominates
};