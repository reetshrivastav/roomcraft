import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCw, Maximize, Sun, Moon, Compass } from "lucide-react";

const CATEGORY_COLORS = {
  bed: 0x6366f1,
  storage: 0x64748b,
  work: 0xd97706,
  seating: 0x059669,
  table: 0xe11d48,
  entertainment: 0x0891b2,
  default: 0x8b5cf6
};

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
  const [cameraView, setCameraView] = useState("isometric"); // "isometric" | "top" | "perspective"

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef({ isDragging: false, prevX: 0, prevY: 0, theta: Math.PI / 4, phi: Math.PI / 4, radius: 800 });

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 760;
    const height = 520;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNightMode ? 0x070a12 : 0x0b0f17);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // Coordinate conversion helper (Three.js center is 0,0, room origin is top-left)
    const toThreeX = (x) => x - roomWidth / 2;
    const toThreeZ = (y) => y - roomHeight / 2;

    // 1. Floor
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor Grid Tile Lines
    const gridHelper = new THREE.GridHelper(Math.max(roomWidth, roomHeight), 20, 0x4f46e5, 0x334155);
    gridHelper.position.y = 0.5;
    scene.add(gridHelper);

    // 2. Baseboard / Floor Edge Trim
    const wallHeight = 160;
    const wallThick = 8;

    // Outer Walls (Transparent / Back-facing visible)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      transparent: true,
      opacity: 0.65
    });

    // Top Wall
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth + wallThick * 2, wallHeight, wallThick), wallMat);
    topWall.position.set(0, wallHeight / 2, -roomHeight / 2 - wallThick / 2);
    scene.add(topWall);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, roomHeight), wallMat);
    leftWall.position.set(-roomWidth / 2 - wallThick / 2, wallHeight / 2, 0);
    scene.add(leftWall);

    // 3. Furniture 3D Meshes
    const catalogMap = new Map(furnitureCatalog.map((f) => [f.id, f]));

    layout.forEach((item) => {
      const furniture = catalogMap.get(item.furnitureId);
      if (!furniture) return;

      const isRotated = item.rotation === 90 || item.rotation === 270;
      const w = isRotated ? furniture.depth : furniture.width;
      const d = isRotated ? furniture.width : furniture.depth;
      const h = furniture.category === "bed" ? 45 :
                furniture.category === "storage" ? 140 :
                furniture.category === "work" ? 75 :
                furniture.category === "seating" ? 70 : 50;

      const group = new THREE.Group();

      const baseColor = CATEGORY_COLORS[furniture.category] || CATEGORY_COLORS.default;
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.4,
        metalness: 0.2
      });

      const bodyGeo = new THREE.BoxGeometry(w, h, d);
      const bodyMesh = new THREE.Mesh(bodyGeo, mat);
      bodyMesh.position.y = h / 2;
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      group.add(bodyMesh);

      // Top Highlight detail for Beds & Desks
      if (furniture.category === "bed") {
        const pillowGeo = new THREE.BoxGeometry(w * 0.7, 10, d * 0.25);
        const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
        const pillow = new THREE.Mesh(pillowGeo, pillowMat);
        pillow.position.set(0, h + 5, -d * 0.3);
        group.add(pillow);
      } else if (furniture.category === "work") {
        const topPlate = new THREE.Mesh(
          new THREE.BoxGeometry(w + 4, 4, d + 4),
          new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 })
        );
        topPlate.position.y = h + 2;
        group.add(topPlate);
      }

      // Position in room coordinates
      const posX = toThreeX(item.x + w / 2);
      const posZ = toThreeZ(item.y + d / 2);
      group.position.set(posX, 0, posZ);

      scene.add(group);
    });

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(
      isNightMode ? 0x1e1b4b : 0xffffff,
      isNightMode ? 0.7 : 0.85
    );
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      isNightMode ? 0x6366f1 : 0xfffbeb,
      isNightMode ? 0.8 : 1.6
    );
    sunLight.position.set(roomWidth * 0.6, 600, roomHeight * 0.6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 2000;
    const d = Math.max(roomWidth, roomHeight);
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // Warm Room Accent Light
    const pointLight = new THREE.PointLight(0x06b6d4, 1.2, 1000);
    pointLight.position.set(0, 200, 0);
    scene.add(pointLight);

    // Update Camera Position based on view
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

      controlsRef.current.theta -= deltaX * 0.008;
      controlsRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, controlsRef.current.phi - deltaY * 0.008));

      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
      updateCamera();
    };

    const onMouseUp = () => {
      controlsRef.current.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      controlsRef.current.radius = Math.max(300, Math.min(1800, controlsRef.current.radius + e.deltaY * 0.8));
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
    controlsRef.current.phi = Math.PI / 3.5;
    controlsRef.current.radius = 850;
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
    controlsRef.current.radius = 900;
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
        background: "rgba(17, 24, 39, 0.7)",
        padding: "8px 16px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        fontSize: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
          <Compass size={14} color="#06b6d4" />
          <span style={{ fontWeight: 600 }}>Interactive 3D Orbit View</span>
          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
            (Drag to Rotate • Scroll to Zoom)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={resetCamera}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-medium)",
              fontSize: "11px"
            }}
          >
            <RotateCw size={12} />
            <span>Reset Angle</span>
          </button>

          <button
            onClick={setTopDown}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-medium)",
              fontSize: "11px"
            }}
          >
            <Maximize size={12} />
            <span>Top-Down</span>
          </button>

          <button
            onClick={() => setIsNightMode(!isNightMode)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              background: isNightMode ? "rgba(99, 102, 241, 0.2)" : "rgba(245, 158, 11, 0.2)",
              color: isNightMode ? "#a5b4fc" : "#fbbf24",
              border: "1px solid var(--border-medium)",
              fontSize: "11px"
            }}
          >
            {isNightMode ? <Moon size={12} /> : <Sun size={12} />}
            <span>{isNightMode ? "Night Mode" : "Daylight"}</span>
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
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(6, 182, 212, 0.1)",
          overflow: "hidden",
          cursor: "grab"
        }}
      />
    </div>
  );
}

export default Room3DView;
