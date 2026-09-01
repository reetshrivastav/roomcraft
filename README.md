# RoomCraft — AI-Powered Architectural Room Layout Generator

**RoomCraft** is an intelligent interior design and layout optimization application that utilizes **Multi-Objective Genetic Algorithms (NSGA-II / Pareto Optimization)** to generate high-quality, ergonomic, and aesthetic furniture arrangements in 2D blueprint and interactive 3D views.

---

## 🌟 Key Features

- **Multi-Objective Genetic Algorithm (Pareto Front)**: Optimizes furniture placement across four independent spatial criteria without permanently collapsing them into a single loss function:
  1. **Traffic Flow**: Evaluates unobstructed walking corridors between doors and central circulation pathways.
  2. **Light Exposure**: Aligns light-preferring furniture (e.g. Desks) with natural window sunlight while shielding glare-sensitive items.
  3. **Clearance & Wall Placement**: Prevents collisions, enforces 70cm doorway swing clearance, and anchors designated furniture along walls.
  4. **Functional Clustering**: Coordinates spatial proximity for complementary furniture pairs (Bed + Nightstand, Desk + Office Chair, Sofa + Coffee Table).
- **Dual Visualizer (2D & 3D)**:
  - **Architectural 2D Blueprint**: Scaled canvas with floorplan grid, door swing arcs, window sunlight rays, and clearance halos.
  - **Interactive 3D Orbit View**: Real-time Three.js scene with custom materials, ambient and directional sunlight shadows, and intuitive orbit controls.
- **Dynamic Multi-Opening Builder**: Add multiple doors and windows across any room wall with real-time coordinate validation.
- **Authoritative Backend Flow**: Room specifications and confirmed layouts are stored and tracked in MongoDB.

---

## 🏗️ Architecture & Pipeline

```
Room Setup (Client)
       ↓
POST /rooms (Validation & Persistence)
       ↓
POST /rooms/:roomId/generate
       ↓
Genetic Algorithm (Population → Fitness → Pareto Dominance → Crossover → Mutation)
       ↓
Global Pareto Front Extraction & Deduplication
       ↓
GET /rooms/:roomId/layouts (Layout View)
       ↓
2D Blueprint & 3D Interactive Orbit Inspection
       ↓
POST /rooms/:roomId/layouts/:layoutId/confirm
       ↓
Room.selectedLayoutId Updated in MongoDB
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB instance running locally or via MongoDB Atlas

### 1. Backend Server Setup
```bash
cd server
npm install
# Create .env with MONGO_URI and PORT
npm run dev
```

### 2. Frontend Client Setup
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📐 Shared Contract (`schema.md`)
- **Units**: Centimeters (cm)
- **Origin**: `(0, 0)` at top-left corner
- **Rotations**: `0°`, `90°`, `180°`, `270°`
- **Catalog**: Referenced by `furnitureId` via `furnitureCatalog.json`.
