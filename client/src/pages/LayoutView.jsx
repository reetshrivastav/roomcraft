import { useState } from "react";
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

  // Fake generated layouts for now.
  // Later these will come from the backend / genetic algorithm.
  const generatedLayouts = [
    {
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
    },

    {
      roomId: "room123",

      layout: [
        {
          furnitureId: "double-bed",
          x: 50,
          y: 50,
          rotation: 90,
        },
        {
          furnitureId: "wardrobe",
          x: 350,
          y: 40,
          rotation: 0,
        },
        {
          furnitureId: "desk",
          x: 280,
          y: 270,
          rotation: 90,
        },
        {
          furnitureId: "office-chair",
          x: 340,
          y: 300,
          rotation: 0,
        },
      ],

      scores: {
        trafficFlow: 0.78,
        lightExposure: 0.88,
        clearance: 0.84,
        clustering: 0.82,
      },

      isParetoOptimal: true,
      createdAt: "2026-08-24T00:00:00.000Z",
    },

    {
      roomId: "room123",

      layout: [
        {
          furnitureId: "double-bed",
          x: 80,
          y: 150,
          rotation: 0,
        },
        {
          furnitureId: "wardrobe",
          x: 350,
          y: 40,
          rotation: 90,
        },
        {
          furnitureId: "desk",
          x: 280,
          y: 260,
          rotation: 0,
        },
        {
          furnitureId: "office-chair",
          x: 310,
          y: 330,
          rotation: 0,
        },
      ],

      scores: {
        trafficFlow: 0.91,
        lightExposure: 0.76,
        clearance: 0.87,
        clustering: 0.89,
      },

      isParetoOptimal: true,
      createdAt: "2026-08-24T00:00:00.000Z",
    },
  ];

  const [selectedLayoutIndex, setSelectedLayoutIndex] = useState(0);

  const selectedLayout = generatedLayouts[selectedLayoutIndex];

  return (
    <div>
      <h1>Generated Layouts</h1>

      <h2>Select a Layout</h2>

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "30px",
        }}
      >
        {generatedLayouts.map((generatedLayout, index) => (
          <div
            key={index}
            style={{
              border:
                selectedLayoutIndex === index
                  ? "3px solid blue"
                  : "1px solid #999",
              padding: "15px",
              width: "250px",
              textAlign: "center",
              borderRadius: "8px",
            }}
          >
            <h3>Layout {index + 1}</h3>

            <p>
              Traffic Flow:{" "}
              {generatedLayout.scores.trafficFlow}
            </p>

            <p>
              Light Exposure:{" "}
              {generatedLayout.scores.lightExposure}
            </p>

            <p>
              Clearance:{" "}
              {generatedLayout.scores.clearance}
            </p>

            <p>
              Clustering:{" "}
              {generatedLayout.scores.clustering}
            </p>

            <p>
              Pareto Optimal:{" "}
              {generatedLayout.isParetoOptimal ? "Yes" : "No"}
            </p>

            <button
              onClick={() => setSelectedLayoutIndex(index)}
            >
              Select Layout
            </button>
          </div>
        ))}
      </div>

      <h2>Selected Layout</h2>

      <RoomCanvas
        roomWidth={roomWidth}
        roomHeight={roomHeight}
        layout={selectedLayout.layout}
        furnitureCatalog={furnitureCatalog}
        doors={doors}
        windows={windows}
      />
      <button
         onClick={() => {
            console.log("Confirmed layout:", selectedLayout);
            alert(`Layout ${selectedLayoutIndex + 1} confirmed!`);
      }}
   >
     Confirm Layout
   </button>
    </div>
  );
}

export default LayoutView;