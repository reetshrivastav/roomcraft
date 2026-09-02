const furnitureCatalog = require("../../../furnitureCatalog.json");
const furnitureMap = new Map(furnitureCatalog.map((item) => [item.id, item]));

function getBounds(furnitureId, rotation) {
  const item = furnitureMap.get(furnitureId);
  if (!item) return { width: 50, depth: 50 };
  const isRotated = rotation === 90 || rotation === 270;
  return {
    width: isRotated ? item.depth : item.width,
    depth: isRotated ? item.width : item.depth
  };
}

/**
 * Computes deterministic dining chairs based on RoomCraft Rules v2:
 * - Per-edge clearance check with >= 60cm threshold.
 * - Symmetrical allocation by target count (2, 4, 6).
 * - 1/3 and 2/3 placement on long edges for 4 chairs.
 * - Inward facing rotation (rot = edge.normal_angle + 180°).
 * - Under-table tuck allowance (15cm).
 * - Unfitted chairs are removed from layout, never relocated to open floor.
 */
function computeDiningChairs(tableGene, room, targetCount = 4, obstacles = []) {
  if (!tableGene || targetCount <= 0) return [];

  const tb = getBounds(tableGene.furnitureId, tableGene.rotation);
  const tuckGap = 15; // 15cm tuck under table edge
  const chairW = 45;
  const chairD = 45;

  // Clearances to room walls
  const distTop = tableGene.y;
  const distBottom = room.height - (tableGene.y + tb.depth);
  const distLeft = tableGene.x;
  const distRight = room.width - (tableGene.x + tb.width);

  // Clearances to obstacles
  const getMinObstacleDist = (edgeName) => {
    let minD = Infinity;
    for (const obs of obstacles) {
      if (obs === tableGene || obs.furnitureId === "dining-chair") continue;
      const ob = getBounds(obs.furnitureId, obs.rotation);

      if (edgeName === "top") {
        if (obs.y + ob.depth <= tableGene.y && obs.x + ob.width > tableGene.x && obs.x < tableGene.x + tb.width) {
          minD = Math.min(minD, tableGene.y - (obs.y + ob.depth));
        }
      } else if (edgeName === "bottom") {
        if (obs.y >= tableGene.y + tb.depth && obs.x + ob.width > tableGene.x && obs.x < tableGene.x + tb.width) {
          minD = Math.min(minD, obs.y - (tableGene.y + tb.depth));
        }
      } else if (edgeName === "left") {
        if (obs.x + ob.width <= tableGene.x && obs.y + ob.depth > tableGene.y && obs.y < tableGene.y + tb.depth) {
          minD = Math.min(minD, tableGene.x - (obs.x + ob.width));
        }
      } else if (edgeName === "right") {
        if (obs.x >= tableGene.x + tb.width && obs.y + ob.depth > tableGene.y && obs.y < tableGene.y + tb.depth) {
          minD = Math.min(minD, obs.x - (tableGene.x + tb.width));
        }
      }
    }
    return minD;
  };

  const MIN_CLEARANCE = 60; // 60cm realistic minimum threshold
  const topEligible = Math.min(distTop, getMinObstacleDist("top")) >= MIN_CLEARANCE;
  const bottomEligible = Math.min(distBottom, getMinObstacleDist("bottom")) >= MIN_CLEARANCE;
  const leftEligible = Math.min(distLeft, getMinObstacleDist("left")) >= MIN_CLEARANCE;
  const rightEligible = Math.min(distRight, getMinObstacleDist("right")) >= MIN_CLEARANCE;

  const isHorizontal = tb.width >= tb.depth;

  // Long vs Short edges
  const longEdges = isHorizontal
    ? [{ name: "top", eligible: topEligible }, { name: "bottom", eligible: bottomEligible }]
    : [{ name: "left", eligible: leftEligible }, { name: "right", eligible: rightEligible }];

  const shortEdges = isHorizontal
    ? [{ name: "left", eligible: leftEligible }, { name: "right", eligible: rightEligible }]
    : [{ name: "top", eligible: topEligible }, { name: "bottom", eligible: bottomEligible }];

  const chairs = [];

  const makeChair = (cx, cy, rot) => ({
    furnitureId: "dining-chair",
    x: Math.round(Math.max(2, Math.min(room.width - chairW - 2, cx))),
    y: Math.round(Math.max(2, Math.min(room.height - chairD - 2, cy))),
    rotation: rot
  });

  // Seat allocation based on target count
  if (targetCount === 2) {
    if (longEdges[0].eligible && longEdges[1].eligible) {
      if (isHorizontal) {
        chairs.push(makeChair(tableGene.x + tb.width / 2 - chairW / 2, tableGene.y - chairD + tuckGap, 0)); // Top edge -> face down
        chairs.push(makeChair(tableGene.x + tb.width / 2 - chairW / 2, tableGene.y + tb.depth - tuckGap, 180)); // Bottom edge -> face up
      } else {
        chairs.push(makeChair(tableGene.x - chairW + tuckGap, tableGene.y + tb.depth / 2 - chairD / 2, 90)); // Left edge -> face right
        chairs.push(makeChair(tableGene.x + tb.width - tuckGap, tableGene.y + tb.depth / 2 - chairD / 2, 270)); // Right edge -> face left
      }
    } else if (shortEdges[0].eligible && shortEdges[1].eligible) {
      if (isHorizontal) {
        chairs.push(makeChair(tableGene.x - chairW + tuckGap, tableGene.y + tb.depth / 2 - chairD / 2, 90));
        chairs.push(makeChair(tableGene.x + tb.width - tuckGap, tableGene.y + tb.depth / 2 - chairD / 2, 270));
      } else {
        chairs.push(makeChair(tableGene.x + tb.width / 2 - chairW / 2, tableGene.y - chairD + tuckGap, 0));
        chairs.push(makeChair(tableGene.x + tb.width / 2 - chairW / 2, tableGene.y + tb.depth - tuckGap, 180));
      }
    } else {
      if (longEdges[0].eligible) {
        if (isHorizontal) chairs.push(makeChair(tableGene.x + tb.width / 2 - chairW / 2, tableGene.y - chairD + tuckGap, 0));
        else chairs.push(makeChair(tableGene.x - chairW + tuckGap, tableGene.y + tb.depth / 2 - chairD / 2, 90));
      }
      if (longEdges[1].eligible) {
        if (isHorizontal) chairs.push(makeChair(tableGene.x + tb.width / 2 - chairW / 2, tableGene.y + tb.depth - tuckGap, 180));
        else chairs.push(makeChair(tableGene.x + tb.width - tuckGap, tableGene.y + tb.depth / 2 - chairD / 2, 270));
      }
    }
  } else if (targetCount === 4) {
    // 2 evenly spaced at 1/3 and 2/3 of long edges
    if (longEdges[0].eligible) {
      if (isHorizontal) {
        chairs.push(makeChair(tableGene.x + tb.width * (1/3) - chairW / 2, tableGene.y - chairD + tuckGap, 0));
        chairs.push(makeChair(tableGene.x + tb.width * (2/3) - chairW / 2, tableGene.y - chairD + tuckGap, 0));
      } else {
        chairs.push(makeChair(tableGene.x - chairW + tuckGap, tableGene.y + tb.depth * (1/3) - chairD / 2, 90));
        chairs.push(makeChair(tableGene.x - chairW + tuckGap, tableGene.y + tb.depth * (2/3) - chairD / 2, 90));
      }
    }
    if (longEdges[1].eligible) {
      if (isHorizontal) {
        chairs.push(makeChair(tableGene.x + tb.width * (1/3) - chairW / 2, tableGene.y + tb.depth - tuckGap, 180));
        chairs.push(makeChair(tableGene.x + tb.width * (2/3) - chairW / 2, tableGene.y + tb.depth - tuckGap, 180));
      } else {
        chairs.push(makeChair(tableGene.x + tb.width - tuckGap, tableGene.y + tb.depth * (1/3) - chairD / 2, 270));
        chairs.push(makeChair(tableGene.x + tb.width - tuckGap, tableGene.y + tb.depth * (2/3) - chairD / 2, 270));
      }
    }

    // Redistribution to short edges if one long edge is ineligible
    if (chairs.length < 4) {
      if (shortEdges[0].eligible && chairs.length < 4) {
        if (isHorizontal) chairs.push(makeChair(tableGene.x - chairW + tuckGap, tableGene.y + tb.depth / 2 - chairD / 2, 90));
        else chairs.push(makeChair(tableGene.x + tb.width / 2 - chairW / 2, tableGene.y - chairD + tuckGap, 0));
      }
      if (shortEdges[1].eligible && chairs.length < 4) {
        if (isHorizontal) chairs.push(makeChair(tableGene.x + tb.width - tuckGap, tableGene.y + tb.depth / 2 - chairD / 2, 270));
        else chairs.push(makeChair(tableGene.x + tb.width / 2 - chairW / 2, tableGene.y + tb.depth - tuckGap, 180));
      }
    }
  } else if (targetCount >= 6) {
    // 2+2 on long edges + 1 on each short edge
    if (longEdges[0].eligible) {
      if (isHorizontal) {
        chairs.push(makeChair(tableGene.x + tb.width * 0.28 - chairW / 2, tableGene.y - chairD + tuckGap, 0));
        chairs.push(makeChair(tableGene.x + tb.width * 0.72 - chairW / 2, tableGene.y - chairD + tuckGap, 0));
      } else {
        chairs.push(makeChair(tableGene.x - chairW + tuckGap, tableGene.y + tb.depth * 0.28 - chairD / 2, 90));
        chairs.push(makeChair(tableGene.x - chairW + tuckGap, tableGene.y + tb.depth * 0.72 - chairD / 2, 90));
      }
    }
    if (longEdges[1].eligible) {
      if (isHorizontal) {
        chairs.push(makeChair(tableGene.x + tb.width * 0.28 - chairW / 2, tableGene.y + tb.depth - tuckGap, 180));
        chairs.push(makeChair(tableGene.x + tb.width * 0.72 - chairW / 2, tableGene.y + tb.depth - tuckGap, 180));
      } else {
        chairs.push(makeChair(tableGene.x + tb.width - tuckGap, tableGene.y + tb.depth * 0.28 - chairD / 2, 270));
        chairs.push(makeChair(tableGene.x + tb.width - tuckGap, tableGene.y + tb.depth * 0.72 - chairD / 2, 270));
      }
    }
    if (shortEdges[0].eligible) {
      if (isHorizontal) chairs.push(makeChair(tableGene.x - chairW + tuckGap, tableGene.y + tb.depth / 2 - chairD / 2, 90));
      else chairs.push(makeChair(tableGene.x + tb.width / 2 - chairW / 2, tableGene.y - chairD + tuckGap, 0));
    }
    if (shortEdges[1].eligible) {
      if (isHorizontal) chairs.push(makeChair(tableGene.x + tb.width - tuckGap, tableGene.y + tb.depth / 2 - chairD / 2, 270));
      else chairs.push(makeChair(tableGene.x + tb.width / 2 - chairW / 2, tableGene.y + tb.depth - tuckGap, 180));
    }
  }

  return chairs;
}

/**
 * Computes deterministic office chair placement for a desk.
 * Tucked 15cm under the desk on the open user side, facing inward toward the desk.
 */
function computeOfficeChair(deskGene, room) {
  if (!deskGene) return null;
  const deskBounds = getBounds("desk", deskGene.rotation);
  const chairW = 60;
  const chairD = 60;
  const tuckGap = 15; // 15cm tuck under desk

  const deskCX = deskGene.x + deskBounds.width / 2;
  const deskCY = deskGene.y + deskBounds.depth / 2;

  let cx, cy, rot;

  // Desk rotations:
  // 0: back to top wall -> user sits on bottom side, facing top (180°)
  // 180: back to bottom wall -> user sits on top side, facing bottom (0°)
  // 90: back to left wall -> user sits on right side, facing left (270°)
  // 270: back to right wall -> user sits on left side, facing right (90°)
  switch (deskGene.rotation) {
    case 0:
      cx = deskCX - chairW / 2;
      cy = deskGene.y + deskBounds.depth - tuckGap;
      rot = 180;
      break;
    case 180:
      cx = deskCX - chairW / 2;
      cy = deskGene.y - chairD + tuckGap;
      rot = 0;
      break;
    case 90:
      cx = deskGene.x + deskBounds.width - tuckGap;
      cy = deskCY - chairD / 2;
      rot = 270;
      break;
    case 270:
      cx = deskGene.x - chairW + tuckGap;
      cy = deskCY - chairD / 2;
      rot = 90;
      break;
    default:
      cx = deskCX - chairW / 2;
      cy = deskGene.y + deskBounds.depth - tuckGap;
      rot = 180;
  }

  return {
    furnitureId: "office-chair",
    x: Math.round(Math.max(2, Math.min(room.width - chairW - 2, cx))),
    y: Math.round(Math.max(2, Math.min(room.height - chairD - 2, cy))),
    rotation: rot
  };
}

/**
 * Attaches deterministic companion items (dining chairs and office chair) to chromosome.
 */
function attachDiningChairs(chromosome, room) {
  // Filter out any stray companion chairs
  let baseChromosome = chromosome.filter(g => g.furnitureId !== "dining-chair" && g.furnitureId !== "office-chair");

  // Attach dining chairs if dining table present
  const targetDiningChairs = (room.furnitureSelection || []).filter(id => id === "dining-chair").length;
  if (targetDiningChairs > 0) {
    const table = baseChromosome.find(g => g.furnitureId === "dining-table");
    if (table) {
      const chairs = computeDiningChairs(table, room, targetDiningChairs, baseChromosome);
      baseChromosome = [...baseChromosome, ...chairs];
    }
  }

  // Attach office chair if desk present
  const hasOfficeChair = (room.furnitureSelection || []).includes("office-chair");
  if (hasOfficeChair) {
    const desk = baseChromosome.find(g => g.furnitureId === "desk");
    if (desk) {
      const officeChair = computeOfficeChair(desk, room);
      if (officeChair) {
        baseChromosome = [...baseChromosome, officeChair];
      }
    }
  }

  return baseChromosome;
}

module.exports = {
  computeDiningChairs,
  computeOfficeChair,
  attachDiningChairs,
  getBounds
};
