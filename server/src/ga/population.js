const { createGene } = require("./chromosome");
const { computeDiningChairs, attachDiningChairs } = require("./diningChairs");
const { getStorageSwingZone, validateSwingZone } = require("./swingZone");
const { getQuadrantBounds } = require("./zoning");

const DEFAULT_POPULATION_SIZE = 20;
const BOUNDARY_PADDING = 10; // 10cm from walls minimum
const CORNER_MARGIN = 65;   // 65cm swing clearance from perpendicular walls

const furnitureCatalog = require("../../../furnitureCatalog.json");
const furnitureMap = new Map(furnitureCatalog.map((item) => [item.id, item]));

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getBounds(furnitureId, rotation) {
  const item = furnitureMap.get(furnitureId);
  if (!item) return { width: 50, depth: 50 };
  const isRotated = rotation === 90 || rotation === 270;
  return {
    width: isRotated ? item.depth : item.width,
    depth: isRotated ? item.width : item.depth
  };
}

function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2, gap = 10) {
  return (
    x1 < x2 + w2 + gap &&
    x1 + w1 + gap > x2 &&
    y1 < y2 + h2 + gap &&
    y1 + h1 + gap > y2
  );
}

// 80cm door width + 90cm primary entry corridor
function getDoorClearanceBoxes(doors, room) {
  if (!Array.isArray(doors)) return [];
  return doors.map(d => {
    if (d.wall === "top") {
      return { x: d.x - 15, y: 0, w: 110, h: 95 };
    } else if (d.wall === "bottom") {
      return { x: d.x - 15, y: room.height - 95, w: 110, h: 95 };
    } else if (d.wall === "left") {
      return { x: 0, y: d.y - 15, w: 95, h: 110 };
    } else {
      return { x: room.width - 95, y: d.y - 15, w: 95, h: 110 };
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

const WALL_ORDER = ["top", "right", "bottom", "left"];

function getStorageRotationForWall(wall) {
  switch (wall) {
    case "top": return 0;
    case "bottom": return 180;
    case "left": return 90;
    case "right": return 270;
    default: return 0;
  }
}

/**
 * Validates candidate wall position for storage with corner swing-arc clearance (>= 65cm)
 * and door collision avoidance.
 */
function getStorageWallPosition(wall, room, bounds, placedGenes = []) {
  const doorsOnWall = (room.doors || []).filter(d => d.wall === wall);
  const minCorner = CORNER_MARGIN;

  if (wall === "top" || wall === "bottom") {
    const y = wall === "top" ? 2 : Math.max(0, room.height - bounds.depth - 2);
    const maxCorner = room.width - bounds.width - CORNER_MARGIN;
    if (maxCorner < minCorner) return null; // Wall too small to accommodate 65cm corner swing

    // Blocked intervals by doors
    const blockedX = doorsOnWall.map(d => ({ min: d.x - 20, max: d.x + 105 }));
    const intervals = [];
    let curMin = minCorner;

    blockedX.sort((a, b) => a.min - b.min).forEach(b => {
      if (b.min - curMin >= bounds.width) {
        intervals.push({ min: curMin, max: b.min - bounds.width });
      }
      curMin = Math.max(curMin, b.max);
    });

    if (maxCorner - curMin >= 0) {
      intervals.push({ min: curMin, max: maxCorner });
    }

    // Try intervals
    for (const chosen of intervals) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const testX = randomNumber(chosen.min, chosen.max);
        const testGene = { furnitureId: "wardrobe", x: testX, y, rotation: wall === "top" ? 0 : 180 };
        if (validateSwingZone(testGene, bounds, room, placedGenes)) {
          return { x: testX, y, wall };
        }
      }
    }
  } else {
    // left or right wall
    const x = wall === "left" ? 2 : Math.max(0, room.width - bounds.width - 2);
    const maxCorner = room.height - bounds.depth - CORNER_MARGIN;
    if (maxCorner < minCorner) return null;

    const blockedY = doorsOnWall.map(d => ({ min: d.y - 20, max: d.y + 105 }));
    const intervals = [];
    let curMin = minCorner;

    blockedY.sort((a, b) => a.min - b.min).forEach(b => {
      if (b.min - curMin >= bounds.depth) {
        intervals.push({ min: curMin, max: b.min - bounds.depth });
      }
      curMin = Math.max(curMin, b.max);
    });

    if (maxCorner - curMin >= 0) {
      intervals.push({ min: curMin, max: maxCorner });
    }

    for (const chosen of intervals) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const testY = randomNumber(chosen.min, chosen.max);
        const testGene = { furnitureId: "wardrobe", x, y: testY, rotation: wall === "left" ? 90 : 270 };
        if (validateSwingZone(testGene, bounds, room, placedGenes)) {
          return { x, y: testY, wall };
        }
      }
    }
  }

  return null;
}

/**
 * Standard wall position for non-storage items (sofa, bed, desk).
 */
function getStandardWallPosition(wall, room, bounds) {
  const doorsOnWall = (room.doors || []).filter(d => d.wall === wall);

  if (wall === "top" || wall === "bottom") {
    const y = wall === "top" ? 2 : Math.max(0, room.height - bounds.depth - 2);
    const blockedX = doorsOnWall.map(d => ({ min: d.x - 20, max: d.x + 105 }));
    const intervals = [];
    let curMin = BOUNDARY_PADDING;

    blockedX.sort((a, b) => a.min - b.min).forEach(b => {
      if (b.min - curMin >= bounds.width) {
        intervals.push({ min: curMin, max: b.min - bounds.width });
      }
      curMin = Math.max(curMin, b.max);
    });

    if (room.width - BOUNDARY_PADDING - curMin >= bounds.width) {
      intervals.push({ min: curMin, max: room.width - BOUNDARY_PADDING - bounds.width });
    }

    if (intervals.length > 0) {
      const chosen = intervals[Math.floor(Math.random() * intervals.length)];
      return { x: randomNumber(chosen.min, chosen.max), y, wall };
    }
  } else {
    const x = wall === "left" ? 2 : Math.max(0, room.width - bounds.width - 2);
    const blockedY = doorsOnWall.map(d => ({ min: d.y - 20, max: d.y + 105 }));
    const intervals = [];
    let curMin = BOUNDARY_PADDING;

    blockedY.sort((a, b) => a.min - b.min).forEach(b => {
      if (b.min - curMin >= bounds.depth) {
        intervals.push({ min: curMin, max: b.min - bounds.depth });
      }
      curMin = Math.max(curMin, b.max);
    });

    if (room.height - BOUNDARY_PADDING - curMin >= bounds.depth) {
      intervals.push({ min: curMin, max: room.height - BOUNDARY_PADDING - bounds.depth });
    }

    if (intervals.length > 0) {
      const chosen = intervals[Math.floor(Math.random() * intervals.length)];
      return { x, y: randomNumber(chosen.min, chosen.max), wall };
    }
  }

  return { x: BOUNDARY_PADDING, y: BOUNDARY_PADDING, wall };
}

function getOppositeWall(wall) {
  const map = { top: "bottom", bottom: "top", left: "right", right: "left" };
  return map[wall] || "bottom";
}

function findFreePosition(x, y, bounds, placedGenes, room, maxAttempts = 60, viewingCorridor = null) {
  const maxX = Math.max(0, room.width - bounds.width - BOUNDARY_PADDING);
  const maxY = Math.max(0, room.height - bounds.depth - BOUNDARY_PADDING);

  const clampX = (v) => Math.max(BOUNDARY_PADDING, Math.min(maxX, v));
  const clampY = (v) => Math.max(BOUNDARY_PADDING, Math.min(maxY, v));

  x = clampX(x);
  y = clampY(y);

  const isFree = (tx, ty) => {
    if (collidesWithDoors(tx, ty, bounds.width, bounds.depth, room.doors, room)) return false;

    // Viewing Corridor protection: Ensure nothing except coffee-table blocks TV line-of-sight
    if (viewingCorridor && bounds.furnitureId !== "coffee-table") {
      const vW = Math.max(0, viewingCorridor.maxX - viewingCorridor.minX);
      const vH = Math.max(0, viewingCorridor.maxY - viewingCorridor.minY);
      if (vW > 0 && vH > 0 && rectsOverlap(tx, ty, bounds.width, bounds.depth, viewingCorridor.minX, viewingCorridor.minY, vW, vH, 4)) {
        return false;
      }
    }

    // Check collision with placed items and their swing zones
    for (const g of placedGenes) {
      const gb = getBounds(g.furnitureId, g.rotation);
      if (rectsOverlap(tx, ty, bounds.width, bounds.depth, g.x, g.y, gb.width, gb.depth, 8)) {
        return false;
      }
      // Never place any item inside an existing storage swing zone
      if (["wardrobe", "dresser", "bookshelf"].includes(g.furnitureId)) {
        const sz = getStorageSwingZone(g, gb);
        if (rectsOverlap(tx, ty, bounds.width, bounds.depth, sz.x, sz.y, sz.w, sz.h, 4)) {
          return false;
        }
      }
    }

    // If this item is itself a storage item, validate its own swing zone
    if (["wardrobe", "dresser", "bookshelf"].includes(bounds.furnitureId)) {
      const testGene = { furnitureId: bounds.furnitureId, x: tx, y: ty, rotation: bounds.rotation || 0 };
      if (!validateSwingZone(testGene, bounds, room, placedGenes)) {
        return false;
      }
    }

    return true;
  };

  if (isFree(x, y)) return { x, y };

  for (let a = 0; a < maxAttempts; a++) {
    const spread = 35 + a * 10;
    const tx = clampX(x + (Math.random() * 2 - 1) * spread);
    const ty = clampY(y + (Math.random() * 2 - 1) * spread);
    if (isFree(tx, ty)) return { x: tx, y: ty };
  }

  for (let gy = BOUNDARY_PADDING; gy <= maxY; gy += 30) {
    for (let gx = BOUNDARY_PADDING; gx <= maxX; gx += 30) {
      if (isFree(gx, gy)) return { x: gx, y: gy };
    }
  }

  return { x, y };
}

/**
 * Archetype seedings: assigns functional zones to quadrants.
 */
const ARCHETYPE_ZONE_QUADRANTS = [
  { Sleep: "NW", Work: "NE", Dine: "SE", Lounge: "SW" },
  { Sleep: "NE", Work: "SE", Dine: "SW", Lounge: "NW" },
  { Sleep: "SE", Work: "SW", Dine: "NW", Lounge: "NE" },
  { Sleep: "SW", Work: "NW", Dine: "NE", Lounge: "SE" },
  { Sleep: "NW", Work: "NW", Dine: "SE", Lounge: "NE" },
  { Sleep: "NE", Work: "NE", Dine: "SW", Lounge: "SE" },
  { Sleep: "SW", Work: "SW", Dine: "NE", Lounge: "NW" },
  { Sleep: "SE", Work: "SE", Dine: "NW", Lounge: "SW" }
];

/**
 * Creates an archetype chromosome without dining chairs as independent genes.
 */
function createArchetypeChromosome(room, archetypeIndex = 0) {
  if (!room || typeof room !== "object") throw new Error("Room is required.");

  const placedGenes = [];
  let bedGene = null;
  let bedWall = null;
  let sofaGene = null;
  let sofaWall = null;
  let tvGene = null;
  let deskGene = null;
  let diningTableGene = null;

  // Filter OUT companion items (dining-chair and office-chair) from chromosome genes (handled deterministically)
  const items = (room.furnitureSelection || []).filter(id => id !== "dining-chair" && id !== "office-chair");

  const zoneAssignments = ARCHETYPE_ZONE_QUADRANTS[archetypeIndex % ARCHETYPE_ZONE_QUADRANTS.length];

  // Sort: primary large items first
  items.sort((a, b) => {
    const fa = furnitureMap.get(a);
    const fb = furnitureMap.get(b);
    const areaA = (fa?.width || 50) * (fa?.depth || 50);
    const areaB = (fb?.width || 50) * (fb?.depth || 50);
    const companionOrder = { "nightstand": 100, "coffee-table": 102 };
    const orderA = companionOrder[a] || 0;
    const orderB = companionOrder[b] || 0;
    if (orderA !== orderB) return orderA - orderB;
    return areaB - areaA;
  });

  const nonDoorWalls = WALL_ORDER.filter(w => !(room.doors || []).some(d => d.wall === w));
  let wallList = nonDoorWalls.length > 0 ? nonDoorWalls : WALL_ORDER;
  let wallIdx = archetypeIndex % wallList.length;

  items.forEach((furnitureId) => {
    const furniture = furnitureMap.get(furnitureId);
    if (!furniture) return;

    let rotation, bounds, x, y;

    // ========== SOFA ==========
    if (furnitureId === "sofa") {
      const loungeQuad = getQuadrantBounds(zoneAssignments.Lounge, room);
      // Pick wall near the lounge quadrant
      const eligibleWalls = wallList.filter(w => {
        if (zoneAssignments.Lounge.includes("N") && w === "top") return true;
        if (zoneAssignments.Lounge.includes("S") && w === "bottom") return true;
        if (zoneAssignments.Lounge.includes("W") && w === "left") return true;
        if (zoneAssignments.Lounge.includes("E") && w === "right") return true;
        return false;
      });
      const wall = eligibleWalls[0] || wallList[wallIdx % wallList.length];
      wallIdx++;
      sofaWall = wall;
      rotation = getStorageRotationForWall(wall);
      bounds = getBounds(furnitureId, rotation);
      const pos = getStandardWallPosition(wall, room, bounds);
      x = pos.x;
      y = pos.y;
    }
    // ========== TV STAND (opposite sofa or opposite bed) ==========
    else if (furnitureId === "tv-stand") {
      let targetWall;
      if (sofaWall) {
        targetWall = getOppositeWall(sofaWall);
      } else if (bedWall) {
        targetWall = getOppositeWall(bedWall);
      } else {
        targetWall = wallList[wallIdx % wallList.length];
        wallIdx++;
      }
      rotation = getStorageRotationForWall(targetWall);
      bounds = getBounds(furnitureId, rotation);
      const pos = getStandardWallPosition(targetWall, room, bounds);
      if (sofaGene) {
        const sofaBounds = getBounds(sofaGene.furnitureId, sofaGene.rotation);
        const sofaCenterX = sofaGene.x + sofaBounds.width / 2;
        x = Math.max(BOUNDARY_PADDING, Math.min(room.width - bounds.width - BOUNDARY_PADDING, sofaCenterX - bounds.width / 2));
      } else if (bedGene) {
        const bedBounds = getBounds(bedGene.furnitureId, bedGene.rotation);
        const bedCenterX = bedGene.x + bedBounds.width / 2;
        x = Math.max(BOUNDARY_PADDING, Math.min(room.width - bounds.width - BOUNDARY_PADDING, bedCenterX - bounds.width / 2));
      } else {
        x = pos.x;
      }
      y = pos.y;
    }
    // ========== COFFEE TABLE (in front of sofa) ==========
    else if (furnitureId === "coffee-table") {
      if (sofaGene) {
        const sb = getBounds(sofaGene.furnitureId, sofaGene.rotation);
        rotation = sofaGene.rotation;
        bounds = getBounds(furnitureId, rotation);
        const sofaCX = sofaGene.x + sb.width / 2;

        if (sofaWall === "top") {
          x = sofaCX - bounds.width / 2;
          y = sofaGene.y + sb.depth + 45;
        } else if (sofaWall === "bottom") {
          x = sofaCX - bounds.width / 2;
          y = sofaGene.y - bounds.depth - 45;
        } else if (sofaWall === "left") {
          x = sofaGene.x + sb.width + 45;
          y = sofaGene.y + sb.depth / 2 - bounds.depth / 2;
        } else {
          x = sofaGene.x - bounds.width - 45;
          y = sofaGene.y + sb.depth / 2 - bounds.depth / 2;
        }
      } else {
        rotation = 0;
        bounds = getBounds(furnitureId, rotation);
        x = room.width / 2 - bounds.width / 2;
        y = room.height / 2 - bounds.depth / 2;
      }
      x = Math.max(BOUNDARY_PADDING, Math.min(room.width - bounds.width - BOUNDARY_PADDING, x));
      y = Math.max(BOUNDARY_PADDING, Math.min(room.height - bounds.depth - BOUNDARY_PADDING, y));
    }
    // ========== STORAGE (wardrobe, bookshelf, dresser) WITH SWING-ARC CHECK ==========
    else if (furniture.tags?.includes("must-be-near-wall") && furniture.category === "storage") {
      // Test all 4 walls for valid swing-arc volume
      let validPos = null;
      let chosenWall = null;

      for (let wAttempt = 0; wAttempt < 4; wAttempt++) {
        const testWall = WALL_ORDER[(wallIdx + wAttempt) % 4];
        rotation = getStorageRotationForWall(testWall);
        bounds = getBounds(furnitureId, rotation);
        const pos = getStorageWallPosition(testWall, room, bounds, placedGenes);
        if (pos) {
          validPos = pos;
          chosenWall = testWall;
          break;
        }
      }

      if (validPos) {
        x = validPos.x;
        y = validPos.y;
        wallIdx++;
      } else {
        // Fallback: pick standard wall position
        const fallbackWall = WALL_ORDER[wallIdx % 4];
        wallIdx++;
        rotation = getStorageRotationForWall(fallbackWall);
        bounds = getBounds(furnitureId, rotation);
        const pos = getStandardWallPosition(fallbackWall, room, bounds);
        x = pos.x;
        y = pos.y;
      }
    }
    // ========== BED ==========
    else if (furniture.category === "bed") {
      const sleepQuad = getQuadrantBounds(zoneAssignments.Sleep, room);
      const eligibleWalls = wallList.filter(w => {
        if (zoneAssignments.Sleep.includes("N") && w === "top") return true;
        if (zoneAssignments.Sleep.includes("S") && w === "bottom") return true;
        if (zoneAssignments.Sleep.includes("W") && w === "left") return true;
        if (zoneAssignments.Sleep.includes("E") && w === "right") return true;
        return false;
      });
      const wall = eligibleWalls[0] || wallList[wallIdx % wallList.length];
      wallIdx++;
      bedWall = wall;
      rotation = getStorageRotationForWall(wall);
      bounds = getBounds(furnitureId, rotation);
      const pos = getStandardWallPosition(wall, room, bounds);
      x = pos.x;
      y = pos.y;
    }
    // ========== DESK ==========
    else if (furnitureId === "desk") {
      const workQuad = getQuadrantBounds(zoneAssignments.Work, room);
      const eligibleWalls = wallList.filter(w => {
        if (zoneAssignments.Work.includes("N") && w === "top") return true;
        if (zoneAssignments.Work.includes("S") && w === "bottom") return true;
        if (zoneAssignments.Work.includes("W") && w === "left") return true;
        if (zoneAssignments.Work.includes("E") && w === "right") return true;
        return false;
      });
      const wall = eligibleWalls[0] || wallList[wallIdx % wallList.length];
      wallIdx++;
      rotation = getStorageRotationForWall(wall);
      bounds = getBounds(furnitureId, rotation);
      const pos = getStandardWallPosition(wall, room, bounds);
      x = pos.x;
      y = pos.y;
    }
    // ========== NIGHTSTAND ==========
    else if (furnitureId === "nightstand") {
      rotation = 0;
      bounds = getBounds(furnitureId, rotation);
      if (bedGene) {
        const bb = getBounds(bedGene.furnitureId, bedGene.rotation);
        const existingNightstands = placedGenes.filter(g => g.furnitureId === "nightstand").length;
        if (existingNightstands === 0) {
          x = bedGene.x - bounds.width - 6;
          y = bedGene.y;
        } else {
          x = bedGene.x + bb.width + 6;
          y = bedGene.y;
        }
      } else {
        x = randomNumber(BOUNDARY_PADDING, room.width - bounds.width - BOUNDARY_PADDING);
        y = randomNumber(BOUNDARY_PADDING, room.height - bounds.depth - BOUNDARY_PADDING);
      }
      x = Math.max(BOUNDARY_PADDING, Math.min(room.width - bounds.width - BOUNDARY_PADDING, x));
      y = Math.max(BOUNDARY_PADDING, Math.min(room.height - bounds.depth - BOUNDARY_PADDING, y));
    }
    // ========== OFFICE CHAIR ==========
    else if (furnitureId === "office-chair") {
      if (deskGene) {
        const db = getBounds(deskGene.furnitureId, deskGene.rotation);
        rotation = (deskGene.rotation + 180) % 360;
        bounds = getBounds(furnitureId, rotation);
        const deskCX = deskGene.x + db.width / 2;

        if (deskGene.rotation === 0) {
          x = deskCX - bounds.width / 2;
          y = deskGene.y + db.depth - 15; // tucked 15cm under desk
        } else if (deskGene.rotation === 180) {
          x = deskCX - bounds.width / 2;
          y = deskGene.y - bounds.depth + 15;
        } else if (deskGene.rotation === 90) {
          x = deskGene.x + db.width - 15;
          y = deskGene.y + db.depth / 2 - bounds.depth / 2;
        } else {
          x = deskGene.x - bounds.width + 15;
          y = deskGene.y + db.depth / 2 - bounds.depth / 2;
        }
      } else {
        rotation = 0;
        bounds = getBounds(furnitureId, rotation);
        x = randomNumber(BOUNDARY_PADDING, room.width - bounds.width - BOUNDARY_PADDING);
        y = randomNumber(BOUNDARY_PADDING, room.height - bounds.depth - BOUNDARY_PADDING);
      }
      x = Math.max(BOUNDARY_PADDING, Math.min(room.width - bounds.width - BOUNDARY_PADDING, x));
      y = Math.max(BOUNDARY_PADDING, Math.min(room.height - bounds.depth - BOUNDARY_PADDING, y));
    }
    // ========== DINING TABLE ==========
    else if (furnitureId === "dining-table") {
      const dineQuad = getQuadrantBounds(zoneAssignments.Dine, room);
      rotation = [0, 90][archetypeIndex % 2];
      bounds = getBounds(furnitureId, rotation);
      x = randomNumber(dineQuad.minX, Math.max(dineQuad.minX, dineQuad.maxX - bounds.width));
      y = randomNumber(dineQuad.minY, Math.max(dineQuad.minY, dineQuad.maxY - bounds.depth));
      x = Math.max(BOUNDARY_PADDING, Math.min(room.width - bounds.width - BOUNDARY_PADDING, x));
      y = Math.max(BOUNDARY_PADDING, Math.min(room.height - bounds.depth - BOUNDARY_PADDING, y));
    }
    // ========== OTHER ITEMS ==========
    else {
      const wall = WALL_ORDER[wallIdx % 4];
      wallIdx++;
      if (furniture.tags?.includes("must-be-near-wall")) {
        rotation = getStorageRotationForWall(wall);
        bounds = getBounds(furnitureId, rotation);
        const pos = getStandardWallPosition(wall, room, bounds);
        x = pos.x;
        y = pos.y;
      } else {
        rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
        bounds = getBounds(furnitureId, rotation);
        x = randomNumber(BOUNDARY_PADDING, Math.max(BOUNDARY_PADDING, room.width - bounds.width - BOUNDARY_PADDING));
        y = randomNumber(BOUNDARY_PADDING, Math.max(BOUNDARY_PADDING, room.height - bounds.depth - BOUNDARY_PADDING));
      }
    }

    x = x ?? randomNumber(BOUNDARY_PADDING, Math.max(BOUNDARY_PADDING, room.width - bounds.width - BOUNDARY_PADDING));
    y = y ?? randomNumber(BOUNDARY_PADDING, Math.max(BOUNDARY_PADDING, room.height - bounds.depth - BOUNDARY_PADDING));

    // Calculate TV viewing corridor
    let viewingCorridor = null;
    const targetA = sofaGene || bedGene;
    if (targetA && tvGene) {
      const bA = getBounds(targetA.furnitureId, targetA.rotation);
      const bB = getBounds(tvGene.furnitureId, tvGene.rotation);
      viewingCorridor = {
        minX: Math.min(targetA.x, tvGene.x),
        maxX: Math.max(targetA.x + bA.width, tvGene.x + bB.width),
        minY: Math.min(targetA.y, tvGene.y),
        maxY: Math.max(targetA.y + bA.depth, tvGene.y + bB.depth)
      };
    }

    const pos = findFreePosition(Math.round(x), Math.round(y), { ...bounds, furnitureId }, placedGenes, room, 60, viewingCorridor);
    const gene = createGene(furnitureId, Math.round(pos.x), Math.round(pos.y), rotation);
    placedGenes.push(gene);

    if (furniture.category === "bed") bedGene = gene;
    if (furnitureId === "sofa") sofaGene = gene;
    if (furnitureId === "tv-stand") tvGene = gene;
    if (furnitureId === "desk") deskGene = gene;
    if (furnitureId === "dining-table") diningTableGene = gene;
  });

  return placedGenes;
}

function createInitialPopulation(room, populationSize = DEFAULT_POPULATION_SIZE) {
  const size = typeof populationSize === "object" ? (populationSize?.populationSize || DEFAULT_POPULATION_SIZE) : populationSize;
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error("Population size must be a positive integer.");
  }
  const population = [];
  for (let i = 0; i < size; i++) {
    population.push(createArchetypeChromosome(room, i));
  }
  return population;
}

module.exports = {
  createInitialPopulation,
  createRandomChromosome: (room) => createArchetypeChromosome(room, 0),
  createArchetypeChromosome,
  getBounds,
  DEFAULT_POPULATION_SIZE
};