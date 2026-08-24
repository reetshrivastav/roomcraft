import RoomCanvas from "../components/RoomCanvas";
import furnitureCatalog from "../furnitureCatalog.json";

function LayoutView() {
  const roomWidth = 500;
  const roomHeight = 400;
  const doors = [
  {
    x: 250,
    y: 0,
    wall: "top",
  },
];

const windows = [
  {
    x: 400,
    y: 0,
    wall: "top",
  },
];

  const generatedLayout = {
  roomId: "room123",

  layout: [
    {
      furnitureId: "double-bed",
      x: 50,
      y: 50,
      rotation: 0,
    },
    {
      furnitureId: "wardrobe",
      x: 350,
      y: 40,
      rotation: 0,
    },
    {
      furnitureId: "desk",
      x: 300,
      y: 280,
      rotation: 0,
    },
    {
      furnitureId: "office-chair",
      x: 330,
      y: 340,
      rotation: 0,
    },
  ],

  scores: {
    trafficFlow: 0.86,
    lightExposure: 0.72,
    clearance: 0.91,
    clustering: 0.78,
  },

  isParetoOptimal: true,

  createdAt: "2026-08-24T00:00:00.000Z",
};

  return (
    <div>
      <h1>Generated Layout</h1>
      <div>
      <h2>Layout Scores</h2>

        <p>Traffic Flow: {generatedLayout.scores.trafficFlow}</p>
        <p>Light Exposure: {generatedLayout.scores.lightExposure}</p>
        <p>Clearance: {generatedLayout.scores.clearance}</p>
        <p>Clustering: {generatedLayout.scores.clustering}</p>

        <p>
            Pareto Optimal:{" "}
            {generatedLayout.isParetoOptimal ? "Yes" : "No"}
        </p>
      </div>

      <RoomCanvas
        roomWidth={roomWidth}
        roomHeight={roomHeight}
        layout={generatedLayout.layout}
        furnitureCatalog={furnitureCatalog}
        doors={doors}
        windows={windows}
    />
    </div>
  );
}

export default LayoutView;