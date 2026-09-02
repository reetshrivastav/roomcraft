const furnitureCatalog = require("../../../furnitureCatalog.json");
const { validateSwingZone, getStorageSwingZone } = require("./swingZone");

const furnitureMap = new Map(
  furnitureCatalog.map((furniture) => [furniture.id, furniture])
);

const ROTATIONS = [0, 90, 180, 270];
const BOUNDARY_PADDING = 10;
const CORNER_MARGIN = 65;

function getFurnitureBounds(gene) {
  const furniture = furnitureMap.get(gene.furnitureId);
  if (!furniture) return { width: 50, depth: 50 };
  const rotated = gene.rotation === 90 || gene.rotation === 270;
  return {
    width: rotated ? furniture.depth : furniture.width,
    depth: rotated ? furniture.width : furniture.depth
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function checkOverlap(gA, gB, gap = 10) {
  const isChairTable =
    (gA.furnitureId === "dining-chair" && gB.furnitureId === "dining-table") ||
    (gA.furnitureId === "dining-table" && gB.furnitureId === "dining-chair") ||
    (gA.furnitureId === "office-chair" && gB.furnitureId === "desk") ||
    (gA.furnitureId === "desk" && gB.furnitureId === "office-chair");

  const effectiveGap = isChairTable ? -15 : gap;
  const bA = getFurnitureBounds(gA);
  const bB = getFurnitureBounds(gB);
  return (
    gA.x < gB.x + bB.width + effectiveGap &&
    gA.x + bA.width + effectiveGap > gB.x &&
    gA.y < gB.y + bB.depth + effectiveGap &&
    gA.y + bA.depth + effectiveGap > gB.y
  );
}

function getDoorClearanceBoxes(doors, room) {
  if (!Array.isArray(doors)) return [];
  return doors.map(d => {
    if (d.wall === "top") {
      return { x: d.x - 15, y: 0, w: 110, h: 90 };
    } else if (d.wall === "bottom") {
      return { x: d.x - 15, y: room.height - 90, w: 110, h: 90 };
    } else if (d.wall === "left") {
      return { x: 0, y: d.y - 15, w: 90, h: 110 };
    } else {
      return { x: room.width - 90, y: d.y - 15, w: 90, h: 110 };
    }
  });
}

function collidesWithDoors(x, y, w, h, doors, room) {
  const doorBoxes = getDoorClearanceBoxes(doors, room);
  return doorBoxes.some(b => (
    x < b.x + b.w &&
    x + w > b.x &&
    y < b.y + b.h &&
    y + h > b.y
  ));
}

function getStorageRotationForWall(wall) {
  switch (wall) {
    case "top": return 0;
    case "bottom": return 180;
    case "left": return 90;
    case "right": return 270;
    default: return 0;
  }
}

function getNearestWall(gene, room) {
  const bounds = getFurnitureBounds(gene);
  const distTop = gene.y;
  const distBottom = room.height - (gene.y + bounds.depth);
  const distLeft = gene.x;
  const distRight = room.width - (gene.x + bounds.width);
  const minDist = Math.min(distTop, distBottom, distLeft, distRight);
  if (minDist === distTop) return "top";
  if (minDist === distBottom) return "bottom";
  if (minDist === distLeft) return "left";
  return "right";
}

/**
 * Multi-pass overlap resolution with storage corner swing validation.
 */
function resolveAllOverlaps(mutated, room) {
  for (let pass = 0; pass < 6; pass++) {
    let anyOverlap = false;

    for (let i = 0; i < mutated.length; i++) {
      for (let j = 0; j < i; j++) {
        if (!checkOverlap(mutated[i], mutated[j], 8)) continue;
        anyOverlap = true;

        const bI = getFurnitureBounds(mutated[i]);
        const bJ = getFurnitureBounds(mutated[j]);

        const candidates = [
          { x: mutated[j].x + bJ.width + 15, y: mutated[i].y },
          { x: mutated[j].x - bI.width - 15, y: mutated[i].y },
          { x: mutated[i].x, y: mutated[j].y + bJ.depth + 15 },
          { x: mutated[i].x, y: mutated[j].y - bI.depth - 15 }
        ];

        let placed = false;
        for (const cand of candidates) {
          if (cand.x >= BOUNDARY_PADDING && cand.x + bI.width <= room.width - BOUNDARY_PADDING &&
              cand.y >= BOUNDARY_PADDING && cand.y + bI.depth <= room.height - BOUNDARY_PADDING &&
              !collidesWithDoors(cand.x, cand.y, bI.width, bI.depth, room.doors, room)) {

            // If storage, check corner swing clearance
            const furnI = furnitureMap.get(mutated[i].furnitureId);
            if (furnI?.category === "storage") {
              const testG = { ...mutated[i], x: cand.x, y: cand.y };
              if (!validateSwingZone(testG, bI, room, mutated)) continue;
            }

            const otherCollision = mutated.some((g, idx) => {
              if (idx === i) return false;
              if (checkOverlap({ ...mutated[i], x: cand.x, y: cand.y }, g, 8)) return true;
              if (["wardrobe", "dresser", "bookshelf"].includes(g.furnitureId)) {
                const gb = getFurnitureBounds(g);
                const sz = getStorageSwingZone(g, gb);
                const isOver = cand.x < sz.x + sz.w + 4 && cand.x + bI.width + 4 > sz.x &&
                               cand.y < sz.y + sz.h + 4 && cand.y + bI.depth + 4 > sz.y;
                if (isOver) return true;
              }
              return false;
            });

            if (!otherCollision) {
              mutated[i].x = Math.round(cand.x);
              mutated[i].y = Math.round(cand.y);
              placed = true;
              break;
            }
          }
        }

        if (!placed) {
          const overlapRight = (mutated[j].x + bJ.width + 15) - mutated[i].x;
          const overlapDown = (mutated[j].y + bJ.depth + 15) - mutated[i].y;
          if (Math.abs(overlapRight) < Math.abs(overlapDown)) {
            mutated[i].x = clamp(Math.round(mutated[j].x + bJ.width + 15), BOUNDARY_PADDING, room.width - bI.width - BOUNDARY_PADDING);
          } else {
            mutated[i].y = clamp(Math.round(mutated[j].y + bJ.depth + 15), BOUNDARY_PADDING, room.height - bI.depth - BOUNDARY_PADDING);
          }
        }
      }
    }

    if (!anyOverlap) break;
  }
}

/**
 * Mutates independent genes only (chairs are excluded from mutation).
 */
function mutateChromosome(room, chromosome, mutationRate = 0.25, positionMutationAmount = 50) {
  if (!room || typeof room !== "object") throw new Error("Room is required.");
  if (!Array.isArray(chromosome)) throw new Error("Chromosome must be an array.");

  // Filter out any companion chairs before mutating (handled deterministically)
  const activeGenes = chromosome.filter(g => g.furnitureId !== "dining-chair" && g.furnitureId !== "office-chair");

  const mutated = activeGenes.map((gene) => {
    const mutatedGene = { ...gene };
    const furniture = furnitureMap.get(gene.furnitureId);

    if (Math.random() < mutationRate) {
      const deltaX = (Math.random() * 2 - 1) * positionMutationAmount;
      const deltaY = (Math.random() * 2 - 1) * positionMutationAmount;
      mutatedGene.x += deltaX;
      mutatedGene.y += deltaY;

      if (Math.random() < 0.3) {
        if (furniture?.tags?.includes("must-be-near-wall") || furniture?.category === "storage") {
          const nearestWall = getNearestWall(mutatedGene, room);
          const doorsOnWall = (room.doors || []).filter(d => d.wall === nearestWall);

          if (doorsOnWall.length === 0) {
            mutatedGene.rotation = getStorageRotationForWall(nearestWall);
            const bounds = getFurnitureBounds(mutatedGene);

            if (furniture.category === "storage") {
              // Ensure >= 65cm corner clearance
              if (nearestWall === "top") {
                mutatedGene.y = 2;
                mutatedGene.x = clamp(mutatedGene.x, CORNER_MARGIN, room.width - bounds.width - CORNER_MARGIN);
              } else if (nearestWall === "bottom") {
                mutatedGene.y = room.height - bounds.depth - 2;
                mutatedGene.x = clamp(mutatedGene.x, CORNER_MARGIN, room.width - bounds.width - CORNER_MARGIN);
              } else if (nearestWall === "left") {
                mutatedGene.x = 2;
                mutatedGene.y = clamp(mutatedGene.y, CORNER_MARGIN, room.height - bounds.depth - CORNER_MARGIN);
              } else {
                mutatedGene.x = room.width - bounds.width - 2;
                mutatedGene.y = clamp(mutatedGene.y, CORNER_MARGIN, room.height - bounds.depth - CORNER_MARGIN);
              }
            } else {
              if (nearestWall === "top") mutatedGene.y = 2;
              else if (nearestWall === "bottom") mutatedGene.y = room.height - bounds.depth - 2;
              else if (nearestWall === "left") mutatedGene.x = 2;
              else mutatedGene.x = room.width - bounds.width - 2;
            }
          }
        } else {
          mutatedGene.rotation = ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];
        }
      }
    }

    // Boundary clamp
    const bounds = getFurnitureBounds(mutatedGene);
    mutatedGene.x = Math.round(clamp(mutatedGene.x, BOUNDARY_PADDING, Math.max(BOUNDARY_PADDING, room.width - bounds.width - BOUNDARY_PADDING)));
    mutatedGene.y = Math.round(clamp(mutatedGene.y, BOUNDARY_PADDING, Math.max(BOUNDARY_PADDING, room.height - bounds.depth - BOUNDARY_PADDING)));

    return mutatedGene;
  });

  resolveAllOverlaps(mutated, room);

  return mutated;
}

function mutatePopulation(room, children, mutationRate = 0.25, positionMutationAmount = 50) {
  if (!Array.isArray(children)) throw new Error("Children must be an array.");
  return children.map((chromosome) =>
    mutateChromosome(room, chromosome, mutationRate, positionMutationAmount)
  );
}

module.exports = {
  mutateChromosome,
  mutatePopulation,
  getFurnitureBounds,
  resolveAllOverlaps
};