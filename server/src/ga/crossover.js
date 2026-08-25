/**
 * Create one child chromosome from two parent chromosomes.
 *
 * Each furniture gene is randomly inherited from
 * either parent.
 */
function crossover(parentA, parentB) {
  if (!Array.isArray(parentA)) {
    throw new Error("Parent A must be an array.");
  }

  if (!Array.isArray(parentB)) {
    throw new Error("Parent B must be an array.");
  }

  if (parentA.length !== parentB.length) {
    throw new Error(
      "Parent chromosomes must have the same length."
    );
  }

  const child = [];

  for (let i = 0; i < parentA.length; i++) {
    const sourceGene =
      Math.random() < 0.5
        ? parentA[i]
        : parentB[i];

    child.push({
      ...sourceGene
    });
  }

  return child;
}

/**
 * Generate multiple children from a set of parents.
 *
 * Parents are paired cyclically:
 *
 * parent 0 × parent 1
 * parent 1 × parent 2
 * parent 2 × parent 3
 * parent 3 × parent 0
 */
function createChildren(parents, childCount) {
  if (!Array.isArray(parents)) {
    throw new Error("Parents must be an array.");
  }

  if (parents.length < 2) {
    throw new Error(
      "At least two parents are required."
    );
  }

  if (
    !Number.isInteger(childCount) ||
    childCount <= 0
  ) {
    throw new Error(
      "Child count must be a positive integer."
    );
  }

  const children = [];

  for (let i = 0; i < childCount; i++) {
    const parentA =
      parents[i % parents.length].chromosome;

    const parentB =
      parents[(i + 1) % parents.length].chromosome;

    children.push(
      crossover(parentA, parentB)
    );
  }

  return children;
}

module.exports = {
  crossover,
  createChildren
};