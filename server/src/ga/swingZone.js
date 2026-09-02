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

function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2, gap = 0) {
  return (
    x1 < x2 + w2 + gap &&
    x1 + w1 + gap > x2 &&
    y1 < y2 + h2 + gap &&
    y1 + h1 + gap > y2
  );
}

// 80cm door width + 90cm primary entry corridor
function collidesWithDoors(x, y, w, h, doors, room) {
  if (!Array.isArray(doors)) return false;
  return doors.some(d => {
    let dx = d.x - 15, dy = 0, dw = 110, dh = 95;
    if (d.wall === "bottom") { dy = room.height - 95; }
    else if (d.wall === "left") { dx = 0; dy = d.y - 15; dw = 95; dh = 110; }
    else if (d.wall === "right") { dx = room.width - 95; dy = d.y - 15; dw = 95; dh = 110; }
    return x < dx + dw && x + w > dx && y < dy + dh && y + h > dy;
  });
}

/**
 * Calculates physical door swing volume for storage items (Wardrobe, Bookshelf, Dresser).
 *
 * SwingZone = {
 *   origin: front_face_center,
 *   width: item.width,
 *   depth: 65cm,           // door width + hand clearance
 *   direction: front_face_normal
 * }
 */
function getStorageSwingZone(gene, bounds) {
  const SWING_DEPTH = 65; // 65cm door clearance

  switch (gene.rotation) {
    case 0: // Back against top wall -> front faces +Y (down)
      return { x: gene.x, y: gene.y + bounds.depth, w: bounds.width, h: SWING_DEPTH, wall: "top" };
    case 180: // Back against bottom wall -> front faces -Y (up)
      return { x: gene.x, y: gene.y - SWING_DEPTH, w: bounds.width, h: SWING_DEPTH, wall: "bottom" };
    case 90: // Back against left wall -> front faces +X (right)
      return { x: gene.x + bounds.width, y: gene.y, w: SWING_DEPTH, h: bounds.depth, wall: "left" };
    case 270: // Back against right wall -> front faces -X (left)
      return { x: gene.x - SWING_DEPTH, y: gene.y, w: SWING_DEPTH, h: bounds.depth, wall: "right" };
    default:
      return { x: gene.x, y: gene.y + bounds.depth, w: bounds.width, h: SWING_DEPTH, wall: "top" };
  }
}

/**
 * Validates storage swing zone against RoomCraft Rules v2:
 * 1. Must lie entirely within room bounds.
 * 2. Must not overlap any perpendicular wall segment (item must be >= 65cm away from corners).
 * 3. Must not overlap any entry door clearance corridors.
 * 4. Must not overlap any other furniture footprint.
 */
function validateSwingZone(gene, bounds, room, otherGenes = []) {
  const swing = getStorageSwingZone(gene, bounds);
  const CORNER_MARGIN = 65;

  // 1. Must lie entirely within room bounds
  if (swing.x < 0 || swing.y < 0 || swing.x + swing.w > room.width || swing.y + swing.h > room.height) {
    return false;
  }

  // 2. Corner Clearance (cannot clip perpendicular walls)
  if (gene.rotation === 0 || gene.rotation === 180) {
    // Horizontal wall: distance to left wall and right wall
    if (gene.x < CORNER_MARGIN || (room.width - (gene.x + bounds.width)) < CORNER_MARGIN) {
      return false;
    }
  } else if (gene.rotation === 90 || gene.rotation === 270) {
    // Vertical wall: distance to top wall and bottom wall
    if (gene.y < CORNER_MARGIN || (room.height - (gene.y + bounds.depth)) < CORNER_MARGIN) {
      return false;
    }
  }

  // 3. Must not block entry doorways
  if (collidesWithDoors(swing.x, swing.y, swing.w, swing.h, room.doors, room)) {
    return false;
  }

  // 4. Must not overlap other furniture
  for (const other of otherGenes) {
    if (other === gene) continue;
    const ob = getBounds(other.furnitureId, other.rotation);
    if (rectsOverlap(swing.x, swing.y, swing.w, swing.h, other.x, other.y, ob.width, ob.depth, 0)) {
      return false;
    }
  }

  return true;
}

const SWING_DOOR_ITEMS = ["wardrobe", "dresser", "bookshelf"];

/**
 * Checks if any wardrobe/storage item with swinging doors in the chromosome has a blocked swing zone.
 * Returns true if ANY swing-door item fails validation.
 */
function hasBlockedSwingZone(chromosome, room) {
  for (const gene of chromosome) {
    if (!SWING_DOOR_ITEMS.includes(gene.furnitureId)) continue;
    const bounds = getBounds(gene.furnitureId, gene.rotation);
    if (!validateSwingZone(gene, bounds, room, chromosome)) {
      return true; // Blocked swing zone detected!
    }
  }
  return false;
}

module.exports = {
  getStorageSwingZone,
  validateSwingZone,
  hasBlockedSwingZone,
  getBounds
};
