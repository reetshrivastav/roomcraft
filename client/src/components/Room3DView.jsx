import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCw, Maximize, Sun, Moon, Compass, Sparkles } from "lucide-react";

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
  windows = []
}) {
  const mountRef = useRef(null);
  const [isNightMode, setIsNightMode] = useState(false);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    theta: Math.PI / 4,
    phi: Math.PI / 3.6,
    radius: 950
  });

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 760;
    const height = 520;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNightMode ? 0x181412 : 0xfbf9f5);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 5000);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    const toThreeX = (x) => x - roomWidth / 2;
    const toThreeZ = (y) => y - roomHeight / 2;

    // Materials Palette
    const woodTex = createOakWoodTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.45,
      metalness: 0.05
    });

    const oakMat = new THREE.MeshStandardMaterial({ color: 0xc49a6c, roughness: 0.5 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x6e472a, roughness: 0.6 });
    const fabricCreamMat = new THREE.MeshStandardMaterial({ color: 0xfdfbf7, roughness: 0.85 });
    const fabricGreyMat = new THREE.MeshStandardMaterial({ color: 0xd4cdc5, roughness: 0.8 });
    const leatherBrownMat = new THREE.MeshStandardMaterial({ color: 0x9c6536, roughness: 0.6 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 1.2
    });
    const wallPlasterMat = new THREE.MeshStandardMaterial({
      color: 0xf5efe6,
      roughness: 0.85,
      transparent: true,
      opacity: 0.55
    });

    // 4. Floor Plane
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 5. Walls with cutouts & Baseboard Molding
    const wallHeight = 150;
    const wallThick = 10;

    // Top Wall (Back)
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth + wallThick * 2, wallHeight, wallThick), wallPlasterMat);
    topWall.position.set(0, wallHeight / 2, -roomHeight / 2 - wallThick / 2);
    topWall.receiveShadow = true;
    scene.add(topWall);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, roomHeight), wallPlasterMat);
    leftWall.position.set(-roomWidth / 2 - wallThick / 2, wallHeight / 2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Baseboards along back and left wall
    const baseboardTop = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 8, 2), oakMat);
    baseboardTop.position.set(0, 4, -roomHeight / 2 + 1);
    scene.add(baseboardTop);

    const baseboardLeft = new THREE.Mesh(new THREE.BoxGeometry(2, 8, roomHeight), oakMat);
    baseboardLeft.position.set(-roomWidth / 2 + 1, 4, 0);
    scene.add(baseboardLeft);

    // 6. 3D Doors & Frames
    doors.forEach((door) => {
      const doorGroup = new THREE.Group();
      const doorW = 80;
      const doorH = 140;

      // Outer Frame
      const frameMat = darkWoodMat;
      const frameL = new THREE.Mesh(new THREE.BoxGeometry(4, doorH, 12), frameMat);
      frameL.position.set(-doorW / 2, doorH / 2, 0);
      const frameR = new THREE.Mesh(new THREE.BoxGeometry(4, doorH, 12), frameMat);
      frameR.position.set(doorW / 2, doorH / 2, 0);
      const frameT = new THREE.Mesh(new THREE.BoxGeometry(doorW + 4, 4, 12), frameMat);
      frameT.position.set(0, doorH, 0);
      doorGroup.add(frameL, frameR, frameT);

      // Wooden Door Panel
      const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(doorW - 4, doorH - 2, 5), oakMat);
      doorPanel.position.set(0, doorH / 2, 0);
      doorPanel.castShadow = true;
      doorGroup.add(doorPanel);

      // Brass Handle
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 10), brassMat);
      handle.rotation.z = Math.PI / 2;
      handle.position.set(doorW / 2 - 12, doorH * 0.48, 4);
      doorGroup.add(handle);

      // Positioning door on respective wall
      if (door.wall === "top") {
        doorGroup.position.set(toThreeX(door.x), 0, -roomHeight / 2);
      } else if (door.wall === "bottom") {
        doorGroup.position.set(toThreeX(door.x), 0, roomHeight / 2);
        doorGroup.rotation.y = Math.PI;
      } else if (door.wall === "left") {
        doorGroup.position.set(-roomWidth / 2, 0, toThreeZ(door.y));
        doorGroup.rotation.y = Math.PI / 2;
      } else {
        doorGroup.position.set(roomWidth / 2, 0, toThreeZ(door.y));
        doorGroup.rotation.y = -Math.PI / 2;
      }

      scene.add(doorGroup);
    });

    // 7. 3D Windows & Sunlight Illumination
    windows.forEach((win) => {
      const winGroup = new THREE.Group();
      const winW = 80;
      const winH = 80;
      const winElevation = 50;

      // Window Frame
      const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(winW, winH, 12), oakMat);
      frameMesh.position.set(0, winElevation + winH / 2, 0);

      // Glass Pane
      const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(winW - 8, winH - 8), glassMat);
      glassPane.position.set(0, winElevation + winH / 2, 0);

      // Cross-bars
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(winW - 6, 2, 6), darkWoodMat);
      crossH.position.set(0, winElevation + winH / 2, 0);
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(2, winH - 6, 6), darkWoodMat);
      crossV.position.set(0, winElevation + winH / 2, 0);

      winGroup.add(frameMesh, glassPane, crossH, crossV);

      // Light glow
      const sunBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(15, 60, 160, 16, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide
        })
      );
      sunBeam.rotation.x = Math.PI / 3;
      sunBeam.position.set(0, winElevation + winH / 2 - 30, 60);
      winGroup.add(sunBeam);

      if (win.wall === "top") {
        winGroup.position.set(toThreeX(win.x), 0, -roomHeight / 2);
      } else if (win.wall === "bottom") {
        winGroup.position.set(toThreeX(win.x), 0, roomHeight / 2);
        winGroup.rotation.y = Math.PI;
      } else if (win.wall === "left") {
        winGroup.position.set(-roomWidth / 2, 0, toThreeZ(win.y));
        winGroup.rotation.y = Math.PI / 2;
      } else {
        winGroup.position.set(roomWidth / 2, 0, toThreeZ(win.y));
        winGroup.rotation.y = -Math.PI / 2;
      }

      scene.add(winGroup);
    });

    // 8. Procedural Realistic Furniture 3D Models
    const catalogMap = new Map(furnitureCatalog.map((f) => [f.id, f]));

    layout.forEach((item) => {
      const furniture = catalogMap.get(item.furnitureId);
      if (!furniture) return;

      const isRotated = item.rotation === 90 || item.rotation === 270;
      const w = isRotated ? furniture.depth : furniture.width;
      const d = isRotated ? furniture.width : furniture.depth;

      const group = new THREE.Group();

      // ==========================================
      // BED MODEL (Double / Single Bed)
      // ==========================================
      if (furniture.category === "bed") {
        // Wooden Base Frame
        const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(w, 20, d), oakMat);
        bedFrame.position.y = 10;
        bedFrame.castShadow = true;
        group.add(bedFrame);

        // Upholstered Headboard
        const headH = 80;
        const headboard = new THREE.Mesh(new THREE.BoxGeometry(w + 4, headH, 10), leatherBrownMat);
        headboard.position.set(0, headH / 2, -d / 2 + 5);
        headboard.castShadow = true;
        group.add(headboard);

        // Mattress
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(w - 6, 22, d - 14), fabricCreamMat);
        mattress.position.set(0, 26, 3);
        mattress.castShadow = true;
        group.add(mattress);

        // Duvet Blanket Cover
        const duvet = new THREE.Mesh(new THREE.BoxGeometry(w - 4, 8, d * 0.65), fabricGreyMat);
        duvet.position.set(0, 38, d * 0.15);
        group.add(duvet);

        // Pillows
        const pillowW = w > 120 ? (w - 20) / 2 : w - 20;
        const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(pillowW, 8, 28), fabricCreamMat);
        pillow1.position.set(w > 120 ? -pillowW / 2 - 2 : 0, 39, -d / 2 + 25);
        group.add(pillow1);

        if (w > 120) {
          const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(pillowW, 8, 28), fabricCreamMat);
          pillow2.position.set(pillowW / 2 + 2, 39, -d / 2 + 25);
          group.add(pillow2);
        }
      }

      // ==========================================
      // SOFA / SEATING MODEL
      // ==========================================
      else if (furniture.category === "seating" && item.furnitureId.includes("sofa")) {
        const seatH = 42;

        // Seat Cushion Block
        const seat = new THREE.Mesh(new THREE.BoxGeometry(w, 20, d * 0.8), fabricGreyMat);
        seat.position.set(0, 22, d * 0.05);
        seat.castShadow = true;
        group.add(seat);

        // Backrest Cushion
        const backrest = new THREE.Mesh(new THREE.BoxGeometry(w, 45, d * 0.25), fabricGreyMat);
        backrest.position.set(0, 42, -d * 0.35);
        backrest.castShadow = true;
        group.add(backrest);

        // Armrests
        const armL = new THREE.Mesh(new THREE.BoxGeometry(12, 32, d), leatherBrownMat);
        armL.position.set(-w / 2 + 6, 26, 0);
        const armR = new THREE.Mesh(new THREE.BoxGeometry(12, 32, d), leatherBrownMat);
        armR.position.set(w / 2 - 6, 26, 0);
        group.add(armL, armR);

        // 4 Tapered Wooden Legs
        const legGeo = new THREE.CylinderGeometry(2, 1.2, 12);
        const legMat = darkWoodMat;
        const legPos = [
          [-w / 2 + 8, -d / 2 + 8],
          [w / 2 - 8, -d / 2 + 8],
          [-w / 2 + 8, d / 2 - 8],
          [w / 2 - 8, d / 2 - 8]
        ];
        legPos.forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, legMat);
          leg.position.set(lx, 6, lz);
          group.add(leg);
        });
      }

      // ==========================================
      // CHAIR MODEL (Dining / Office / Armchair)
      // ==========================================
      else if (furniture.category === "seating") {
        const isOffice = item.furnitureId.includes("office");
        const seatH = 45;

        // Seat
        const seat = new THREE.Mesh(new THREE.BoxGeometry(w - 4, 6, d - 4), isOffice ? leatherBrownMat : oakMat);
        seat.position.y = seatH;
        seat.castShadow = true;
        group.add(seat);

        // Backrest
        const back = new THREE.Mesh(new THREE.BoxGeometry(w - 6, 40, 4), isOffice ? leatherBrownMat : oakMat);
        back.position.set(0, seatH + 20, -d / 2 + 4);
        group.add(back);

        // Legs
        if (isOffice) {
          // Central post + star base
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, seatH), brassMat);
          stem.position.y = seatH / 2;
          group.add(stem);
        } else {
          // 4 wooden legs
          const legGeo = new THREE.CylinderGeometry(1.8, 1.2, seatH);
          [[-w / 2 + 4, -d / 2 + 4], [w / 2 - 4, -d / 2 + 4], [-w / 2 + 4, d / 2 - 4], [w / 2 - 4, d / 2 - 4]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(legGeo, darkWoodMat);
            leg.position.set(lx, seatH / 2, lz);
            group.add(leg);
          });
        }
      }

      // ==========================================
      // DESK & TABLE MODELS
      // ==========================================
      else if (furniture.category === "work" || furniture.category === "table") {
        const tableH = item.furnitureId.includes("coffee") || item.furnitureId.includes("side") ? 45 : 75;

        // Top Slab
        const tableTop = new THREE.Mesh(new THREE.BoxGeometry(w, 5, d), oakMat);
        tableTop.position.y = tableH;
        tableTop.castShadow = true;
        group.add(tableTop);

        // 4 Legs
        const legRadius = item.furnitureId.includes("coffee") ? 1.8 : 2.5;
        const legGeo = new THREE.CylinderGeometry(legRadius, legRadius * 0.8, tableH);
        [[-w / 2 + 6, -d / 2 + 6], [w / 2 - 6, -d / 2 + 6], [-w / 2 + 6, d / 2 - 6], [w / 2 - 6, d / 2 - 6]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, darkWoodMat);
          leg.position.set(lx, tableH / 2, lz);
          leg.castShadow = true;
          group.add(leg);
        });

        // Desk Accessories (Monitor & Keyboard)
        if (furniture.category === "work") {
          const monitor = new THREE.Mesh(new THREE.BoxGeometry(36, 22, 2), darkWoodMat);
          monitor.position.set(0, tableH + 16, -d / 2 + 12);
          const monStand = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 6), brassMat);
          monStand.position.set(0, tableH + 3, -d / 2 + 12);
          group.add(monitor, monStand);
        }
      }

      // ==========================================
      // STORAGE (Wardrobe, Dresser, Nightstand, Bookshelf)
      // ==========================================
      else if (furniture.category === "storage") {
        const isWardrobe = item.furnitureId.includes("wardrobe");
        const isBookshelf = item.furnitureId.includes("bookshelf");
        const isDresser = item.furnitureId.includes("dresser");
        const storeH = isWardrobe ? 170 : isBookshelf ? 150 : isDresser ? 80 : 50;

        // Main Cabinet Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, storeH, d), oakMat);
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
          // Open shelves with colorful 3D book blocks
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

        // TV Widescreen on Top
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

      // Position in room coordinates
      const posX = toThreeX(item.x + w / 2);
      const posZ = toThreeZ(item.y + d / 2);
      group.position.set(posX, 0, posZ);

      scene.add(group);
    });

    // 9. Lighting Setup
    const ambientLight = new THREE.AmbientLight(
      isNightMode ? 0x2e2318 : 0xfffaf0,
      isNightMode ? 0.9 : 1.4
    );
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      isNightMode ? 0xb47b48 : 0xfff3db,
      isNightMode ? 1.0 : 2.2
    );
    sunLight.position.set(roomWidth * 0.7, 750, roomHeight * 0.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 2200;
    const bound = Math.max(roomWidth, roomHeight) * 1.2;
    sunLight.shadow.camera.left = -bound;
    sunLight.shadow.camera.right = bound;
    sunLight.shadow.camera.top = bound;
    sunLight.shadow.camera.bottom = -bound;
    scene.add(sunLight);

    // Warm Interior Accent Pendant Light
    const pointLight = new THREE.PointLight(0xfef08a, 1.4, 1200);
    pointLight.position.set(0, 180, 0);
    scene.add(pointLight);

    // Camera updates
    const updateCamera = () => {
      const { radius, theta, phi } = controlsRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 20, 0);
    };

    updateCamera();

    // Mouse Interaction
    const dom = renderer.domElement;

    const onMouseDown = (e) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!controlsRef.current.isDragging) return;
      const deltaX = e.clientX - controlsRef.current.prevX;
      const deltaY = e.clientY - controlsRef.current.prevY;

      controlsRef.current.theta -= deltaX * 0.007;
      controlsRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, controlsRef.current.phi - deltaY * 0.007));

      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
      updateCamera();
    };

    const onMouseUp = () => {
      controlsRef.current.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      controlsRef.current.radius = Math.max(350, Math.min(1900, controlsRef.current.radius + e.deltaY * 0.8));
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
  }, [roomWidth, roomHeight, layout, furnitureCatalog, doors, windows, isNightMode]);

  const resetCamera = () => {
    controlsRef.current.theta = Math.PI / 4;
    controlsRef.current.phi = Math.PI / 3.6;
    controlsRef.current.radius = 950;
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
    controlsRef.current.radius = 980;
    if (cameraRef.current) {
      const { radius, theta, phi } = controlsRef.current;
      cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.position.y = radius * Math.cos(phi);
      cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
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
          <span style={{ fontWeight: 700 }}>Interactive 3D BIM Orbit View</span>
          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
            (Drag to Rotate • Scroll to Zoom)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={resetCamera}
            className="btn-secondary"
            style={{ padding: "4px 8px", fontSize: "11px" }}
          >
            <RotateCw size={12} />
            <span>Reset Angle</span>
          </button>

          <button
            onClick={setTopDown}
            className="btn-secondary"
            style={{ padding: "4px 8px", fontSize: "11px" }}
          >
            <Maximize size={12} />
            <span>Top-Down</span>
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
            <span>{isNightMode ? "Evening Light" : "Warm Daylight"}</span>
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        style={{
          width: "100%",
          maxWidth: 760,
          height: 520,
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-medium)",
          boxShadow: "var(--shadow-md)",
          overflow: "hidden",
          cursor: "grab",
          background: "#fbf9f5"
        }}
      />
    </div>
  );
}

export default Room3DView;
