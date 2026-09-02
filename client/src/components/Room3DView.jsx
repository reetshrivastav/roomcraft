import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { RotateCw, Maximize, Sun, Moon, Compass, Sparkles, Move, Trash2, Sliders } from "lucide-react";

/**
 * Helper to generate a realistic procedural oak wood texture canvas.
 */
function createOakWoodTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Base warm oak color
  ctx.fillStyle = "#e3d2be";
  ctx.fillRect(0, 0, 512, 512);

  // Draw parquet planks
  ctx.strokeStyle = "#cbb59f";
  ctx.lineWidth = 3;

  const plankW = 128;
  const plankH = 64;

  for (let y = 0; y < 512; y += plankH) {
    for (let x = 0; x < 512; x += plankW) {
      const offset = (y / plankH) % 2 === 0 ? 0 : plankW / 2;
      const px = (x + offset) % 512;

      ctx.fillStyle = (x + y) % 3 === 0 ? "#deccb7" : (x + y) % 2 === 0 ? "#dfcdb8" : "#e6d5c2";
      ctx.fillRect(px, y, plankW, plankH);
      ctx.strokeRect(px, y, plankW, plankH);

      // Wood grain lines
      ctx.strokeStyle = "rgba(160, 130, 100, 0.15)";
      ctx.beginPath();
      ctx.moveTo(px + 10, y + 15);
      ctx.lineTo(px + plankW - 10, y + 15);
      ctx.moveTo(px + 5, y + 40);
      ctx.lineTo(px + plankW - 5, y + 40);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

function Room3DView({
  roomWidth = 500,
  roomHeight = 400,
  layout = [],
  furnitureCatalog = [],
  doors = [],
  windows = [],
  roomType = "bedroom",
  northFacing = "top",
  onLayoutChange = null,
  customDimensions = {},
  activeStyle = null
}) {
  const mountRef = useRef(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isOrbiting, setIsOrbiting] = useState(true);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const furnitureGroupsRef = useRef([]);
  const selectionRingRef = useRef(null);
  const wallsRef = useRef([]);

  const controlsRef = useRef({
    isDragging: false,
    dragTarget: null, // "camera" or { type: "furniture", index, initialX, initialZ, planeY }
    prevX: 0,
    prevY: 0,
    startX: 0,
    startY: 0,
    theta: Math.PI / 4,
    phi: Math.PI / 3.6,
    radius: Math.max(950, Math.max(roomWidth, roomHeight) * 1.6)
  });

  const catalogMap = useMemo(() => {
    return new Map(furnitureCatalog.map((f) => [f.id, f]));
  }, [furnitureCatalog]);

  // Handle rotation of selected furniture in 3D
  const handleRotateSelected = () => {
    if (selectedIndex === null || !onLayoutChange || !layout[selectedIndex]) return;
    const currentRot = layout[selectedIndex].rotation || 0;
    const nextRot = (currentRot + 90) % 360;
    const updated = [...layout];
    updated[selectedIndex] = { ...updated[selectedIndex], rotation: nextRot };
    onLayoutChange(updated);
  };

  // Handle deletion of selected furniture in 3D
  const handleDeleteSelected = () => {
    if (selectedIndex === null || !onLayoutChange) return;
    const updated = layout.filter((_, idx) => idx !== selectedIndex);
    setSelectedIndex(null);
    onLayoutChange(updated);
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 760;
    const height = 520;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNightMode ? 0x221c18 : 0xfbf9f5);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 6000);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    const toThreeX = (x) => x - roomWidth / 2;
    const toThreeZ = (y) => y - roomHeight / 2;

    // Materials Palette
    // Active style color overrides
    const activeWoodHex = activeStyle?.three?.woodColor ? parseInt(activeStyle.three.woodColor.replace("#", "0x")) : 0xc49a6c;
    const activeFabricHex = activeStyle?.three?.fabricColor ? parseInt(activeStyle.three.fabricColor.replace("#", "0x")) : 0xfdfbf7;
    const activeAccentHex = activeStyle?.three?.accentColor ? parseInt(activeStyle.three.accentColor.replace("#", "0x")) : 0x9c6536;
    const activeWallHex = activeStyle?.three?.wallColor ? parseInt(activeStyle.three.wallColor.replace("#", "0x")) : 0xf5efe6;
    const activeFloorHex = activeStyle?.three?.floorColor ? parseInt(activeStyle.three.floorColor.replace("#", "0x")) : null;

    const woodTex = createOakWoodTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: activeFloorHex ? null : woodTex,
      color: activeFloorHex || 0xffffff,
      roughness: activeStyle?.three?.floorRoughness || 0.45,
      metalness: 0.05
    });

    const oakMat = new THREE.MeshStandardMaterial({ color: activeWoodHex, roughness: 0.5 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: activeWoodHex === 0x4a3325 ? 0x2e1f17 : activeWoodHex, roughness: 0.6 });
    const fabricCreamMat = new THREE.MeshStandardMaterial({ color: activeFabricHex, roughness: 0.85 });
    const fabricGreyMat = new THREE.MeshStandardMaterial({ color: activeAccentHex, roughness: 0.8 });
    const leatherBrownMat = new THREE.MeshStandardMaterial({ color: activeAccentHex, roughness: 0.6 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.68,
      roughness: 0.04,
      metalness: 0.12,
      transmission: 0.72,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      ior: 1.52,
      thickness: 2.5
    });

    // 4. Floor Plane
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = "Floor";
    scene.add(floor);

    // 5. 4 Walls with Dynamic View Adaptability
    const wallHeight = 160;
    const wallThick = 10;

    const wallOpaqueMat = new THREE.MeshStandardMaterial({
      color: activeWallHex,
      roughness: 0.85
    });

    const wallTransparentMat = new THREE.MeshStandardMaterial({
      color: activeWallHex,
      roughness: 0.85,
      transparent: true,
      opacity: 0.38,
      depthWrite: false
    });

    // Top Wall (North: y = -roomHeight/2)
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth + wallThick * 2, wallHeight, wallThick), wallOpaqueMat);
    topWall.position.set(0, wallHeight / 2, -roomHeight / 2 - wallThick / 2);
    topWall.receiveShadow = true;
    topWall.userData = { normal: new THREE.Vector3(0, 0, 1), name: "top" };
    scene.add(topWall);

    // Left Wall (West: x = -roomWidth/2)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, roomHeight), wallOpaqueMat);
    leftWall.position.set(-roomWidth / 2 - wallThick / 2, wallHeight / 2, 0);
    leftWall.receiveShadow = true;
    leftWall.userData = { normal: new THREE.Vector3(1, 0, 0), name: "left" };
    scene.add(leftWall);

    // Right Wall (East: x = +roomWidth/2)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, roomHeight), wallTransparentMat);
    rightWall.position.set(roomWidth / 2 + wallThick / 2, wallHeight / 2, 0);
    rightWall.receiveShadow = true;
    rightWall.userData = { normal: new THREE.Vector3(-1, 0, 0), name: "right" };
    scene.add(rightWall);

    // Bottom Wall (South: y = +roomHeight/2)
    const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth + wallThick * 2, wallHeight, wallThick), wallTransparentMat);
    bottomWall.position.set(0, wallHeight / 2, roomHeight / 2 + wallThick / 2);
    bottomWall.receiveShadow = true;
    bottomWall.userData = { normal: new THREE.Vector3(0, 0, -1), name: "bottom" };
    scene.add(bottomWall);

    wallsRef.current = [topWall, leftWall, rightWall, bottomWall];

    // Baseboards
    const baseboardTop = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 8, 2), oakMat);
    baseboardTop.position.set(0, 4, -roomHeight / 2 + 1);
    scene.add(baseboardTop);

    const baseboardLeft = new THREE.Mesh(new THREE.BoxGeometry(2, 8, roomHeight), oakMat);
    baseboardLeft.position.set(-roomWidth / 2 + 1, 4, 0);
    scene.add(baseboardLeft);

    const baseboardRight = new THREE.Mesh(new THREE.BoxGeometry(2, 8, roomHeight), oakMat);
    baseboardRight.position.set(roomWidth / 2 - 1, 4, 0);
    scene.add(baseboardRight);

    const baseboardBottom = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 8, 2), oakMat);
    baseboardBottom.position.set(0, 4, roomHeight / 2 - 1);
    scene.add(baseboardBottom);

    // 6. 3D Doors
    doors.forEach((door) => {
      const doorGroup = new THREE.Group();
      const doorW = 80;
      const doorH = 140;

      const frameMat = darkWoodMat;
      const frameL = new THREE.Mesh(new THREE.BoxGeometry(4, doorH, 12), frameMat);
      frameL.position.set(-doorW / 2, doorH / 2, 0);
      const frameR = new THREE.Mesh(new THREE.BoxGeometry(4, doorH, 12), frameMat);
      frameR.position.set(doorW / 2, doorH / 2, 0);
      const frameT = new THREE.Mesh(new THREE.BoxGeometry(doorW + 4, 4, 12), frameMat);
      frameT.position.set(0, doorH, 0);
      doorGroup.add(frameL, frameR, frameT);

      const panel = new THREE.Mesh(new THREE.BoxGeometry(doorW - 4, doorH - 4, 4), oakMat);
      panel.position.set(0, doorH / 2, 0);
      panel.castShadow = true;
      doorGroup.add(panel);

      const knob = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 12), brassMat);
      knob.position.set(doorW / 2 - 8, doorH * 0.5, 4);
      doorGroup.add(knob);

      let px = 0, pz = 0, rotY = 0;
      if (door.wall === "top") { px = toThreeX(door.x); pz = -roomHeight / 2; rotY = 0; }
      else if (door.wall === "bottom") { px = toThreeX(door.x); pz = roomHeight / 2; rotY = Math.PI; }
      else if (door.wall === "left") { px = -roomWidth / 2; pz = toThreeZ(door.y); rotY = Math.PI / 2; }
      else { px = roomWidth / 2; pz = toThreeZ(door.y); rotY = -Math.PI / 2; }

      doorGroup.position.set(px, 0, pz);
      doorGroup.rotation.y = rotY;
      scene.add(doorGroup);
    });

    // 7. 3D Windows
    windows.forEach((win) => {
      const winGroup = new THREE.Group();
      const winW = 90;
      const winH = 80;
      const winSillY = 60;

      const frameMat = darkWoodMat;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(winW, winH, 6), frameMat);
      frame.position.set(0, winSillY + winH / 2, 0);
      winGroup.add(frame);

      const pane = new THREE.Mesh(new THREE.BoxGeometry(winW - 8, winH - 8, 2), glassMat);
      pane.position.set(0, winSillY + winH / 2, 0);
      winGroup.add(pane);

      // Window Mullion Frame Crossbars
      const mullionMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const mullionV = new THREE.Mesh(new THREE.BoxGeometry(2, winH - 8, 2.5), mullionMat);
      mullionV.position.set(0, winSillY + winH / 2, 0);
      const mullionH = new THREE.Mesh(new THREE.BoxGeometry(winW - 8, 2, 2.5), mullionMat);
      mullionH.position.set(0, winSillY + winH / 2, 0);
      winGroup.add(mullionV, mullionH);

      let px = 0, pz = 0, rotY = 0;
      if (win.wall === "top") { px = toThreeX(win.x); pz = -roomHeight / 2; rotY = 0; }
      else if (win.wall === "bottom") { px = toThreeX(win.x); pz = roomHeight / 2; rotY = Math.PI; }
      else if (win.wall === "left") { px = -roomWidth / 2; pz = toThreeZ(win.y); rotY = Math.PI / 2; }
      else { px = roomWidth / 2; pz = toThreeZ(win.y); rotY = -Math.PI / 2; }

      winGroup.position.set(px, 0, pz);
      winGroup.rotation.y = rotY;
      scene.add(winGroup);
    });

    // 8. 3D Realistic Furniture Models
    const furnitureGroups = [];

    layout.forEach((item, index) => {
      const furniture = catalogMap.get(item.furnitureId);
      if (!furniture) return;

      const group = new THREE.Group();
      group.userData = { index, furnitureId: item.furnitureId, item };

      const custom = customDimensions[item.furnitureId];
      const origW = custom?.width || furniture.width;
      const origD = custom?.depth || furniture.depth;

      // Group rotation (matches clockwise 2D architectural coordinates)
      group.rotation.y = (item.rotation * Math.PI) / 180;

      const w = origW;
      const d = origD;

      // ==========================================
      // BED (Single / Double)
      // ==========================================
      if (furniture.category === "bed") {
        const frameH = 22;
        const frame = new THREE.Mesh(new THREE.BoxGeometry(w, frameH, d), oakMat);
        frame.position.y = frameH / 2;
        frame.castShadow = true;
        group.add(frame);

        const mattressH = 20;
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(w - 6, mattressH, d - 10), fabricCreamMat);
        mattress.position.set(0, frameH + mattressH / 2, 2);
        mattress.castShadow = true;
        group.add(mattress);

        const headboardH = 65;
        const headboard = new THREE.Mesh(new THREE.BoxGeometry(w, headboardH, 8), darkWoodMat);
        headboard.position.set(0, headboardH / 2, -d / 2 + 4);
        headboard.castShadow = true;
        group.add(headboard);

        const isDouble = w > 120;
        const pillowCount = isDouble ? 2 : 1;
        const pillowW = isDouble ? (w - 24) / 2 : w - 20;
        for (let p = 0; p < pillowCount; p++) {
          const pillow = new THREE.Mesh(new THREE.BoxGeometry(pillowW, 8, 25), fabricGreyMat);
          const pxOffset = isDouble ? (p === 0 ? -pillowW / 2 - 3 : pillowW / 2 + 3) : 0;
          pillow.position.set(pxOffset, frameH + mattressH + 4, -d / 2 + 22);
          pillow.castShadow = true;
          group.add(pillow);
        }

        const duvet = new THREE.Mesh(new THREE.BoxGeometry(w - 4, 6, d * 0.65), fabricCreamMat);
        duvet.position.set(0, frameH + mattressH + 3, d * 0.14);
        duvet.castShadow = true;
        group.add(duvet);
      }

      // ==========================================
      // SEATING (Sofa / Armchair / Chairs)
      // ==========================================
      else if (furniture.category === "seating") {
        const isSofa = furniture.id === "sofa";
        const isArmchair = furniture.id === "armchair";
        const isOfficeChair = furniture.id === "office-chair";
        const isDiningChair = furniture.id === "dining-chair";

        if (isSofa || isArmchair) {
          const seatH = 24;
          const seatBase = new THREE.Mesh(new THREE.BoxGeometry(w, seatH, d), fabricCreamMat);
          seatBase.position.y = seatH / 2;
          seatBase.castShadow = true;
          group.add(seatBase);

          const backrestH = 45;
          const backrest = new THREE.Mesh(new THREE.BoxGeometry(w, backrestH, 16), fabricCreamMat);
          backrest.position.set(0, seatH + backrestH / 2 - 8, -d / 2 + 8);
          backrest.castShadow = true;
          group.add(backrest);

          const armW = 14;
          const armH = 32;
          const armL = new THREE.Mesh(new THREE.BoxGeometry(armW, armH, d), fabricCreamMat);
          armL.position.set(-w / 2 + armW / 2, armH / 2, 0);
          armL.castShadow = true;
          const armR = new THREE.Mesh(new THREE.BoxGeometry(armW, armH, d), fabricCreamMat);
          armR.position.set(w / 2 - armW / 2, armH / 2, 0);
          armR.castShadow = true;
          group.add(armL, armR);

          const cCount = isSofa ? 3 : 1;
          const cWidth = (w - armW * 2 - 8) / cCount;
          for (let c = 0; c < cCount; c++) {
            const cushion = new THREE.Mesh(new THREE.BoxGeometry(cWidth, 8, d - 22), fabricGreyMat);
            const cxPos = -(w - armW * 2) / 2 + cWidth / 2 + c * (cWidth + 2);
            cushion.position.set(cxPos, seatH + 4, 4);
            cushion.castShadow = true;
            group.add(cushion);
          }
        } else if (isOfficeChair) {
          const baseH = 28;
          const baseCol = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, baseH, 8), darkWoodMat);
          baseCol.position.y = baseH / 2;
          group.add(baseCol);

          const seatMat = leatherBrownMat;
          const seat = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 6, d * 0.8), seatMat);
          seat.position.y = baseH + 3;
          seat.castShadow = true;
          group.add(seat);

          const back = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, 40, 5), seatMat);
          back.position.set(0, baseH + 24, -d * 0.35);
          back.castShadow = true;
          group.add(back);
        } else if (isDiningChair) {
          const legH = 40;
          const legMat = oakMat;
          const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.2, legH, 6), legMat);
          leg1.position.set(-w * 0.38, legH / 2, -d * 0.38);
          const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.2, legH, 6), legMat);
          leg2.position.set(w * 0.38, legH / 2, -d * 0.38);
          const leg3 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.2, legH, 6), legMat);
          leg3.position.set(-w * 0.38, legH / 2, d * 0.38);
          const leg4 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.2, legH, 6), legMat);
          leg4.position.set(w * 0.38, legH / 2, d * 0.38);
          group.add(leg1, leg2, leg3, leg4);

          const seat = new THREE.Mesh(new THREE.BoxGeometry(w, 4, d), fabricCreamMat);
          seat.position.y = legH + 2;
          seat.castShadow = true;
          group.add(seat);

          const back = new THREE.Mesh(new THREE.BoxGeometry(w, 40, 4), oakMat);
          back.position.set(0, legH + 22, -d / 2 + 2);
          back.castShadow = true;
          group.add(back);
        }
      }

      // ==========================================
      // TABLES & DESKS
      // ==========================================
      else if (furniture.category === "table" || furniture.category === "work") {
        const isDesk = furniture.id === "desk";
        const isCoffeeTable = furniture.id === "coffee-table";
        const isSideTable = furniture.id === "side-table";
        const tableH = isCoffeeTable || isSideTable ? 40 : 75;

        const legH = tableH - 4;
        const legMat = darkWoodMat;
        const inset = 6;
        const leg1 = new THREE.Mesh(new THREE.BoxGeometry(4, legH, 4), legMat);
        leg1.position.set(-w / 2 + inset, legH / 2, -d / 2 + inset);
        const leg2 = new THREE.Mesh(new THREE.BoxGeometry(4, legH, 4), legMat);
        leg2.position.set(w / 2 - inset, legH / 2, -d / 2 + inset);
        const leg3 = new THREE.Mesh(new THREE.BoxGeometry(4, legH, 4), legMat);
        leg3.position.set(-w / 2 + inset, legH / 2, d / 2 - inset);
        const leg4 = new THREE.Mesh(new THREE.BoxGeometry(4, legH, 4), legMat);
        leg4.position.set(w / 2 - inset, legH / 2, d / 2 - inset);
        group.add(leg1, leg2, leg3, leg4);

        const topMat = oakMat;
        const top = new THREE.Mesh(new THREE.BoxGeometry(w, 4, d), topMat);
        top.position.y = tableH - 2;
        top.castShadow = true;
        group.add(top);

        // Desk Accessories (Monitor & Keyboard)
        if (isDesk) {
          const screen = new THREE.Mesh(
            new THREE.BoxGeometry(38, 24, 2),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.7 })
          );
          screen.position.set(0, tableH + 15, -d * 0.2);
          screen.castShadow = true;

          const screenStand = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 8), brassMat);
          screenStand.position.set(0, tableH + 2, -d * 0.2);

          group.add(screen, screenStand);
        }
      }

      // ==========================================
      // STORAGE (Wardrobe / Bookshelf / Nightstand / Dresser)
      // ==========================================
      else if (furniture.category === "storage") {
        const isWardrobe = furniture.id === "wardrobe";
        const isBookshelf = furniture.id === "bookshelf";
        const isNightstand = furniture.id === "nightstand";
        const isDresser = furniture.id === "dresser";

        const storeH = isWardrobe ? 170 : isBookshelf ? 150 : isDresser ? 80 : 50;
        const bodyMat = oakMat;
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, storeH, d), bodyMat);
        body.position.y = storeH / 2;
        body.castShadow = true;
        group.add(body);

        // Details: Handles / Door Seam / Books
        if (isWardrobe || isDresser) {
          const seam = new THREE.Mesh(new THREE.BoxGeometry(1, storeH - 10, 1), darkWoodMat);
          seam.position.set(0, storeH / 2, d / 2 + 0.5);

          const handle1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 16, 2), brassMat);
          handle1.position.set(-6, storeH * 0.55, d / 2 + 1.5);
          const handle2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 16, 2), brassMat);
          handle2.position.set(6, storeH * 0.55, d / 2 + 1.5);

          group.add(seam, handle1, handle2);
        } else if (isBookshelf) {
          const bookColors = [0x991b1b, 0x1e40af, 0x065f46, 0x854d0e];
          for (let s = 1; s <= 3; s++) {
            const shelfY = s * 35;
            const bookBlock = new THREE.Mesh(
              new THREE.BoxGeometry(w * 0.6, 18, d * 0.6),
              new THREE.MeshStandardMaterial({ color: bookColors[s % bookColors.length], roughness: 0.7 })
            );
            bookBlock.position.set(-w * 0.1, shelfY + 9, 2);
            group.add(bookBlock);
          }
        }
      }

      // ==========================================
      // ENTERTAINMENT (TV Stand + Screen)
      // ==========================================
      else if (furniture.category === "entertainment") {
        const standH = 45;
        const consoleBody = new THREE.Mesh(new THREE.BoxGeometry(w, standH, d), darkWoodMat);
        consoleBody.position.y = standH / 2;
        consoleBody.castShadow = true;
        group.add(consoleBody);

        const tv = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.8, 38, 3),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 })
        );
        tv.position.set(0, standH + 24, 0);
        tv.castShadow = true;

        const tvBase = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 12), brassMat);
        tvBase.position.set(0, standH + 1, 0);

        group.add(tv, tvBase);
      }

      // Default Fallback
      else {
        const box = new THREE.Mesh(new THREE.BoxGeometry(w, 50, d), oakMat);
        box.position.y = 25;
        box.castShadow = true;
        group.add(box);
      }

      // Position in room coordinates (accounting for 90°/270° rotated width/depth)
      const isRot = item.rotation === 90 || item.rotation === 270;
      const bW = isRot ? d : w;
      const bD = isRot ? w : d;
      const posX = toThreeX(item.x + bW / 2);
      const posZ = toThreeZ(item.y + bD / 2);
      group.position.set(posX, 0, posZ);

      scene.add(group);
      furnitureGroups.push(group);
    });

    furnitureGroupsRef.current = furnitureGroups;

    // Selection Ring around selected item
    if (selectedIndex !== null && layout[selectedIndex]) {
      const selItem = layout[selectedIndex];
      const selFurn = catalogMap.get(selItem.furnitureId);
      if (selFurn) {
        const custom = customDimensions[selItem.furnitureId];
        const sw = custom?.width || selFurn.width;
        const sd = custom?.depth || selFurn.depth;
        const isSelRot = selItem.rotation === 90 || selItem.rotation === 270;
        const selBW = isSelRot ? sd : sw;
        const selBD = isSelRot ? sw : sd;

        const ringGeo = new THREE.RingGeometry(Math.max(sw, sd) * 0.55, Math.max(sw, sd) * 0.62, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x059669, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(toThreeX(selItem.x + selBW / 2), 0.8, toThreeZ(selItem.y + selBD / 2));
        scene.add(ring);
        selectionRingRef.current = ring;
      }
    }

    // ==========================================
    // 10. DECORATIVE ELEMENTS (Room-Type Aware)
    // ==========================================

    // ==========================================
    // 10. DECORATIVE ELEMENTS (Carpets & Shelves)
    // ==========================================

    // Helper to generate a realistic woven carpet texture based on activeStyle
    function createCarpetTexture(styleId) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      let baseColor = "#f5f0e8";
      let borderColor = "#dfd5c5";
      let patternColor = "rgba(180, 150, 120, 0.25)";

      if (styleId === "industrial") {
        baseColor = "#3d4044";
        borderColor = "#2b2d30";
        patternColor = "rgba(180, 120, 80, 0.2)";
      } else if (styleId === "minimalist") {
        baseColor = "#eae7e1";
        borderColor = "#d5d0c7";
        patternColor = "rgba(140, 135, 125, 0.15)";
      } else if (styleId === "japandi") {
        baseColor = "#d6c19f";
        borderColor = "#63503b";
        patternColor = "rgba(100, 80, 50, 0.3)";
      }

      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, 256, 256);

      // Outer & Inner Borders
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(12, 12, 232, 232);
      ctx.lineWidth = 2;
      ctx.strokeRect(24, 24, 208, 208);

      // Geometric weave lines
      ctx.strokeStyle = patternColor;
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const off = 40 + i * 22;
        ctx.beginPath();
        ctx.moveTo(128, off);
        ctx.lineTo(256 - off, 128);
        ctx.lineTo(128, 256 - off);
        ctx.lineTo(off, 128);
        ctx.closePath();
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }

    const currentStyleId = activeStyle?.id || "scandinavian";
    const rugTexture = createCarpetTexture(currentStyleId);
    const carpetMat = new THREE.MeshStandardMaterial({ map: rugTexture, roughness: 0.95 });

    // 1. Bedside Rug (under / beside Bed)
    const bedItem = layout.find(item => {
      const f = catalogMap.get(item.furnitureId);
      return f?.category === "bed";
    });
    if (bedItem) {
      const bf = catalogMap.get(bedItem.furnitureId);
      const isRot = bedItem.rotation === 90 || bedItem.rotation === 270;
      const bw = isRot ? bf.depth : bf.width;
      const bd = isRot ? bf.width : bf.depth;

      const bedRugW = bw + 70;
      const bedRugD = bd + 50;
      const bedRug = new THREE.Mesh(new THREE.PlaneGeometry(bedRugW, bedRugD), carpetMat);
      bedRug.rotation.x = -Math.PI / 2;
      const rugCX = toThreeX(bedItem.x + bw / 2);
      const rugCZ = toThreeZ(bedItem.y + bd / 2);
      bedRug.position.set(rugCX, 0.4, rugCZ);
      bedRug.receiveShadow = true;
      scene.add(bedRug);
    }

    // 2. Lounge Area Rug (under Sofa & Coffee Table)
    const sofaItem = layout.find(item => item.furnitureId === "sofa");
    if (sofaItem) {
      const sf = catalogMap.get(sofaItem.furnitureId);
      const isRot = sofaItem.rotation === 90 || sofaItem.rotation === 270;
      const sw = isRot ? sf.depth : sf.width;
      const sd = isRot ? sf.width : sf.depth;

      const loungeRugW = Math.max(sw + 40, 180);
      const loungeRugD = 150;
      const loungeRug = new THREE.Mesh(new THREE.PlaneGeometry(loungeRugW, loungeRugD), carpetMat);
      loungeRug.rotation.x = -Math.PI / 2;

      // Position rug extending in front of the sofa
      let rCX = toThreeX(sofaItem.x + sw / 2);
      let rCZ = toThreeZ(sofaItem.y + sd / 2);
      if (sofaItem.rotation === 0) rCZ += 55;
      else if (sofaItem.rotation === 180) rCZ -= 55;
      else if (sofaItem.rotation === 90) rCX += 55;
      else if (sofaItem.rotation === 270) rCX -= 55;

      loungeRug.position.set(rCX, 0.45, rCZ);
      loungeRug.receiveShadow = true;
      scene.add(loungeRug);
    } else if (!bedItem && (roomType === "living" || roomType === "studio")) {
      // Fallback central rug for open living/studio
      const fallRug = new THREE.Mesh(new THREE.PlaneGeometry(220, 160), carpetMat);
      fallRug.rotation.x = -Math.PI / 2;
      fallRug.position.set(0, 0.4, 0);
      fallRug.receiveShadow = true;
      scene.add(fallRug);
    }

    // Flower Pots
    const potColor = new THREE.MeshStandardMaterial({ color: 0xa0522d, roughness: 0.7 });
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6 });

    function createFlowerPot(px, pz) {
      const potGroup = new THREE.Group();
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(8, 6, 16, 12), potColor);
      pot.position.y = 8;
      pot.castShadow = true;
      potGroup.add(pot);
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, 2, 12), soilMat);
      soil.position.y = 17;
      potGroup.add(soil);
      const leaf1 = new THREE.Mesh(new THREE.SphereGeometry(10, 8, 6), leafMat);
      leaf1.position.set(0, 30, 0);
      leaf1.scale.set(1, 1.2, 1);
      leaf1.castShadow = true;
      potGroup.add(leaf1);
      const leaf2 = new THREE.Mesh(new THREE.SphereGeometry(7, 8, 6), leafMat);
      leaf2.position.set(6, 36, 4);
      potGroup.add(leaf2);
      const leaf3 = new THREE.Mesh(new THREE.SphereGeometry(6, 8, 6), leafMat);
      leaf3.position.set(-5, 34, -3);
      potGroup.add(leaf3);
      potGroup.position.set(px, 0, pz);
      return potGroup;
    }

    const cornerPadding = 25;
    scene.add(createFlowerPot(-roomWidth / 2 + cornerPadding, -roomHeight / 2 + cornerPadding));
    scene.add(createFlowerPot(roomWidth / 2 - cornerPadding, -roomHeight / 2 + cornerPadding));
    scene.add(createFlowerPot(roomWidth / 2 - cornerPadding, roomHeight / 2 - cornerPadding));
    scene.add(createFlowerPot(-roomWidth / 2 + cornerPadding, roomHeight / 2 - cornerPadding));

    // Dynamic collision-free Wall Shelves
    const shelfWoodMat = new THREE.MeshStandardMaterial({ color: 0xb8956a, roughness: 0.5 });
    function createWallShelf(px, py, pz, rotY = 0) {
      const shelfGroup = new THREE.Group();
      const plank = new THREE.Mesh(new THREE.BoxGeometry(60, 3, 14), shelfWoodMat);
      plank.castShadow = true;
      shelfGroup.add(plank);
      const vase = new THREE.Mesh(new THREE.CylinderGeometry(3, 2, 10, 8), new THREE.MeshStandardMaterial({ color: 0xe8d5c4, roughness: 0.4 }));
      vase.position.set(-18, 6.5, 0);
      shelfGroup.add(vase);
      const bookStack = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 10), new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.7 }));
      bookStack.position.set(5, 5.5, 0);
      shelfGroup.add(bookStack);
      const succulentPot = new THREE.Mesh(new THREE.CylinderGeometry(4, 3, 6, 8), potColor);
      succulentPot.position.set(22, 4.5, 0);
      shelfGroup.add(succulentPot);
      const succulentLeaf = new THREE.Mesh(new THREE.SphereGeometry(5, 6, 4), leafMat);
      succulentLeaf.position.set(22, 10, 0);
      shelfGroup.add(succulentLeaf);
      shelfGroup.position.set(px, py, pz);
      shelfGroup.rotation.y = rotY;
      return shelfGroup;
    }

    // Helper to ensure wall segment is completely clear of doors, windows, and tall furniture (TV, Wardrobe)
    function isWallSegmentClear(wall, offset, halfSpan = 50) {
      for (const d of doors) {
        if (d.wall === wall) {
          const dPos = (wall === "top" || wall === "bottom") ? toThreeX(d.x) : toThreeZ(d.y);
          if (Math.abs(dPos - offset) < 70) return false;
        }
      }
      for (const w of windows) {
        if (w.wall === wall) {
          const wPos = (wall === "top" || wall === "bottom") ? toThreeX(w.x) : toThreeZ(w.y);
          if (Math.abs(wPos - offset) < 75) return false;
        }
      }
      for (const item of layout) {
        const furn = catalogMap.get(item.furnitureId);
        if (!furn) continue;
        const isTallOrTV = furn.category === "storage" || furn.id === "tv-stand";
        if (!isTallOrTV) continue;

        const custom = customDimensions[item.furnitureId];
        const iw = custom?.width || furn.width;
        const id = custom?.depth || furn.depth;
        const isRot = item.rotation === 90 || item.rotation === 270;
        const bW = isRot ? id : iw;
        const bD = isRot ? iw : id;
        const cX = toThreeX(item.x + bW / 2);
        const cZ = toThreeZ(item.y + bD / 2);

        if (wall === "top" && item.y <= 45) {
          if (Math.abs(cX - offset) < bW / 2 + halfSpan) return false;
        } else if (wall === "bottom" && item.y + bD >= roomHeight - 45) {
          if (Math.abs(cX - offset) < bW / 2 + halfSpan) return false;
        } else if (wall === "left" && item.x <= 45) {
          if (Math.abs(cZ - offset) < bD / 2 + halfSpan) return false;
        } else if (wall === "right" && item.x + bW >= roomWidth - 45) {
          if (Math.abs(cZ - offset) < bD / 2 + halfSpan) return false;
        }
      }
      return true;
    }

    const candidateShelves = [
      { wall: "top", offset: -roomWidth * 0.3, py: 105, pz: -roomHeight / 2 + 8, rotY: 0 },
      { wall: "top", offset: roomWidth * 0.3, py: 115, pz: -roomHeight / 2 + 8, rotY: 0 },
      { wall: "left", offset: -roomHeight * 0.25, py: 108, px: -roomWidth / 2 + 8, rotY: Math.PI / 2 },
      { wall: "left", offset: roomHeight * 0.25, py: 112, px: -roomWidth / 2 + 8, rotY: Math.PI / 2 },
      { wall: "right", offset: -roomHeight * 0.22, py: 110, px: roomWidth / 2 - 8, rotY: -Math.PI / 2 }
    ];

    let shelvesAdded = 0;
    for (const cand of candidateShelves) {
      if (shelvesAdded >= 2) break;
      if (isWallSegmentClear(cand.wall, cand.offset)) {
        const px = cand.px !== undefined ? cand.px : cand.offset;
        const pz = cand.pz !== undefined ? cand.pz : cand.offset;
        scene.add(createWallShelf(px, cand.py, pz, cand.rotY));
        shelvesAdded++;
      }
    }

    // Crown Molding
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xf0e6d6, roughness: 0.4 });
    const crownH = 6;
    const crownTop = new THREE.Mesh(new THREE.BoxGeometry(roomWidth + wallThick * 2, crownH, wallThick + 4), crownMat);
    crownTop.position.set(0, wallHeight - crownH / 2, -roomHeight / 2 - wallThick / 2);
    scene.add(crownTop);

    const crownLeft = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 4, crownH, roomHeight), crownMat);
    crownLeft.position.set(-roomWidth / 2 - wallThick / 2, wallHeight - crownH / 2, 0);
    scene.add(crownLeft);

    // 9. Lighting Setup (Brightened Evening + Compass Direction)
    const ambientLight = new THREE.AmbientLight(
      isNightMode ? 0x5a483c : 0xfffaf0,
      isNightMode ? 1.6 : 1.4
    );
    scene.add(ambientLight);

    // Calculate Sun position based on northFacing
    let sunX = roomWidth * 0.7;
    let sunZ = roomHeight * 0.5;
    if (northFacing === "right") { sunX = -roomWidth * 0.5; sunZ = roomHeight * 0.7; }
    else if (northFacing === "bottom") { sunX = -roomWidth * 0.7; sunZ = -roomHeight * 0.5; }
    else if (northFacing === "left") { sunX = roomWidth * 0.5; sunZ = -roomHeight * 0.7; }

    const sunLight = new THREE.DirectionalLight(
      isNightMode ? 0xe0a976 : 0xfff3db,
      isNightMode ? 1.8 : 2.2
    );
    sunLight.position.set(sunX, 750, sunZ);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 2400;
    const bound = Math.max(roomWidth, roomHeight) * 1.3;
    sunLight.shadow.camera.left = -bound;
    sunLight.shadow.camera.right = bound;
    sunLight.shadow.camera.top = bound;
    sunLight.shadow.camera.bottom = -bound;
    scene.add(sunLight);

    // Warm Interior Accent Pendant Light
    const pointLight = new THREE.PointLight(0xfef08a, isNightMode ? 2.4 : 1.4, 1400);
    pointLight.position.set(0, 180, 0);
    scene.add(pointLight);

    // Camera update function
    const updateCamera = () => {
      const { radius, theta, phi } = controlsRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 20, 0);

      // Dynamic wall transparency based on camera position
      const camPos = camera.position;
      wallsRef.current.forEach(wall => {
        const wallPos = wall.position;
        const normal = wall.userData.normal;
        // Vector from wall center to camera
        const toCam = new THREE.Vector3().subVectors(camPos, wallPos);
        const dot = toCam.dot(normal);
        // If camera is looking from behind wall toward room, make wall transparent
        if (dot < 0) {
          wall.material = wallTransparentMat;
        } else {
          wall.material = wallOpaqueMat;
        }
      });
    };

    updateCamera();

    // Mouse Interaction (Raycasting + Dragging in 3D)
    const dom = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const planeIntersection = new THREE.Vector3();

    const onMouseDown = (e) => {
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      controlsRef.current.startX = e.clientX;
      controlsRef.current.startY = e.clientY;
      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
      controlsRef.current.isDragging = true;

      // Check if clicking on a furniture item
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(furnitureGroups, true);

      if (intersects.length > 0) {
        // Find top-level furniture group
        let hitGroup = intersects[0].object;
        while (hitGroup.parent && !hitGroup.userData?.furnitureId) {
          hitGroup = hitGroup.parent;
        }

        if (hitGroup.userData?.index !== undefined) {
          const idx = hitGroup.userData.index;
          setSelectedIndex(idx);
          controlsRef.current.dragTarget = {
            type: "furniture",
            index: idx,
            startItemX: layout[idx].x,
            startItemY: layout[idx].y
          };
          return;
        }
      }

      // Default: Camera orbit
      controlsRef.current.dragTarget = "camera";
    };

    const onMouseMove = (e) => {
      if (!controlsRef.current.isDragging) return;

      const deltaX = e.clientX - controlsRef.current.prevX;
      const deltaY = e.clientY - controlsRef.current.prevY;
      const target = controlsRef.current.dragTarget;

      if (target?.type === "furniture" && onLayoutChange) {
        // Move furniture on 3D floor plane
        const rect = dom.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        if (raycaster.ray.intersectPlane(floorPlane, planeIntersection)) {
          const itemIdx = target.index;
          const item = layout[itemIdx];
          const furn = catalogMap.get(item?.furnitureId);
          if (furn && item) {
            const custom = customDimensions[item.furnitureId];
            const w = custom?.width || furn.width;
            const d = custom?.depth || furn.depth;

            // Convert Three.js coordinates to Room coordinates
            const newX = Math.round(Math.max(10, Math.min(roomWidth - w - 10, planeIntersection.x + roomWidth / 2 - w / 2)));
            const newY = Math.round(Math.max(10, Math.min(roomHeight - d - 10, planeIntersection.z + roomHeight / 2 - d / 2)));

            const updated = [...layout];
            updated[itemIdx] = { ...updated[itemIdx], x: newX, y: newY };
            onLayoutChange(updated);
          }
        }
      } else {
        // Camera orbit rotation
        controlsRef.current.theta -= deltaX * 0.007;
        controlsRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, controlsRef.current.phi - deltaY * 0.007));
        updateCamera();
      }

      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
    };

    const onMouseUp = (e) => {
      const movedDist = Math.hypot(e.clientX - controlsRef.current.startX, e.clientY - controlsRef.current.startY);
      // If clicked empty floor without moving, deselect
      if (movedDist < 5 && controlsRef.current.dragTarget === "camera") {
        setSelectedIndex(null);
      }
      controlsRef.current.isDragging = false;
      controlsRef.current.dragTarget = null;
    };

    const onWheel = (e) => {
      e.preventDefault();
      controlsRef.current.radius = Math.max(350, Math.min(2200, controlsRef.current.radius + e.deltaY * 0.8));
      updateCamera();
    };

    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    // Render loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("wheel", onWheel);
      renderer.dispose();
    };
  }, [roomWidth, roomHeight, layout, furnitureCatalog, doors, windows, isNightMode, selectedIndex, roomType, northFacing, customDimensions, activeStyle]);

  const resetCamera = () => {
    controlsRef.current.theta = Math.PI / 4;
    controlsRef.current.phi = Math.PI / 3.6;
    controlsRef.current.radius = Math.max(950, Math.max(roomWidth, roomHeight) * 1.6);
    if (cameraRef.current) {
      const { radius, theta, phi } = controlsRef.current;
      cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.position.y = radius * Math.cos(phi);
      cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.lookAt(0, 20, 0);
    }
  };

  const setTopDown = () => {
    controlsRef.current.theta = 0.001;
    controlsRef.current.phi = 0.05;
    controlsRef.current.radius = Math.max(1000, Math.max(roomWidth, roomHeight) * 1.7);
    if (cameraRef.current) {
      const { radius, theta, phi } = controlsRef.current;
      cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.position.y = radius * Math.cos(phi);
      cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const selectedItemData = selectedIndex !== null ? layout[selectedIndex] : null;
  const selectedFurnData = selectedItemData ? catalogMap.get(selectedItemData.furnitureId) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", position: "relative" }}>
      {/* 3D Controls Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: 760,
        background: "var(--bg-card)",
        padding: "8px 16px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
        fontSize: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
          <Compass size={15} color="#b47b48" />
          <span style={{ fontWeight: 700 }}>Interactive 3D BIM Studio</span>
          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
            (Click & Drag to Move Items • Drag Floor to Orbit)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {selectedItemData && (
            <>
              <button
                onClick={handleRotateSelected}
                className="btn-secondary"
                style={{ padding: "4px 8px", fontSize: "11px", color: "#b47b48" }}
              >
                <RotateCw size={12} />
                <span>Rotate 90°</span>
              </button>
              <button
                onClick={handleDeleteSelected}
                className="btn-secondary"
                style={{ padding: "4px 8px", fontSize: "11px", color: "#e11d48" }}
              >
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            </>
          )}

          <button onClick={resetCamera} className="btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }}>
            <RotateCw size={12} /><span>Reset View</span>
          </button>

          <button onClick={setTopDown} className="btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }}>
            <Maximize size={12} /><span>Top-Down</span>
          </button>

          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className="btn-secondary"
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              background: isNightMode ? "rgba(180, 123, 72, 0.15)" : "var(--bg-input)"
            }}
          >
            {isNightMode ? <Moon size={12} /> : <Sun size={12} />}
            <span>{isNightMode ? "Warm Evening" : "Bright Daylight"}</span>
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div style={{ position: "relative", width: "100%", maxWidth: 760 }}>
        <div
          ref={mountRef}
          style={{
            width: "100%",
            height: 520,
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-medium)",
            boxShadow: "var(--shadow-md)",
            overflow: "hidden",
            cursor: selectedIndex !== null ? "move" : "grab",
            background: isNightMode ? "#221c18" : "#fbf9f5"
          }}
        />

        {/* NESW Compass Overlay */}
        <div style={{
          position: "absolute",
          top: "14px",
          right: "14px",
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(6px)",
          padding: "6px 10px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--text-primary)",
          pointerEvents: "none"
        }}>
          <Compass size={14} color="#0284c7" />
          <span>North: {northFacing.toUpperCase()}</span>
        </div>

        {/* Selected 3D Object Inspector HUD */}
        {selectedItemData && selectedFurnData && (
          <div style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(8px)",
            padding: "8px 18px",
            borderRadius: "var(--radius-full)",
            border: "1px solid #059669",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "12px",
            zIndex: 10
          }}>
            <span style={{ fontWeight: 700, color: "#059669" }}>✓ Selected: {selectedFurnData.name}</span>
            <span style={{ color: "var(--text-muted)" }}>|</span>
            <span style={{ color: "var(--text-secondary)" }}>Pos: ({selectedItemData.x}, {selectedItemData.y}) cm</span>
            <span style={{ color: "var(--text-muted)" }}>|</span>
            <span style={{ color: "var(--primary)", fontWeight: 700 }}>Rot: {selectedItemData.rotation}°</span>
            <span style={{ color: "#059669", fontSize: "11px" }}>• Drag directly to move</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Room3DView;
