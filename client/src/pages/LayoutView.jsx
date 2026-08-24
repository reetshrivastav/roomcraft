import { useEffect, useState } from "react";

import RoomCanvas from "../components/RoomCanvas";
import furnitureCatalog from "../furnitureCatalog.json";
import { getRoomLayouts } from "../services/room";

function LayoutView() {
  const [room, setRoom] = useState(null);
  const [generatedLayouts, setGeneratedLayouts] =
    useState([]);

  const [selectedLayoutIndex, setSelectedLayoutIndex] =
    useState(0);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadLayouts = async () => {
      try {
        setIsLoading(true);
        setError("");

        // --------------------------------
        // Get room ID from URL
        // --------------------------------

        const params = new URLSearchParams(
          window.location.search
        );

        const roomId = params.get("roomId");

        if (!roomId) {
          throw new Error(
            "No room ID was provided."
          );
        }

        console.log(
          "Loading layouts for room:",
          roomId
        );

        // --------------------------------
        // Get stored room information
        // --------------------------------

        const storedRoom =
          sessionStorage.getItem(
            "roomcraft-current-room"
          );

        if (!storedRoom) {
          throw new Error(
            "Room information could not be found."
          );
        }

        const roomData =
          JSON.parse(storedRoom);

        if (roomData._id !== roomId) {
          throw new Error(
            "Stored room does not match the requested room."
          );
        }

        setRoom(roomData);

        // --------------------------------
        // Fetch layouts from backend
        // --------------------------------

        const response =
          await getRoomLayouts(roomId);

        console.log(
          "Fetched generated layouts:",
          response
        );

        setGeneratedLayouts(
          response.layouts || []
        );
      } catch (err) {
        console.error(
          "Failed to load layouts:",
          err
        );

        setError(
          err.message ||
            "Failed to load generated layouts."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadLayouts();
  }, []);

  // --------------------------------
  // Loading state
  // --------------------------------

  if (isLoading) {
    return (
      <div>
        <h1>Generated Layouts</h1>
        <p>
          Loading generated layouts...
        </p>
      </div>
    );
  }

  // --------------------------------
  // Error state
  // --------------------------------

  if (error) {
    return (
      <div>
        <h1>Generated Layouts</h1>

        <p style={{ color: "red" }}>
          {error}
        </p>
      </div>
    );
  }

  // --------------------------------
  // No room
  // --------------------------------

  if (!room) {
    return (
      <div>
        <h1>Generated Layouts</h1>

        <p>
          Room information is unavailable.
        </p>
      </div>
    );
  }

  // --------------------------------
  // No layouts
  // --------------------------------

  if (generatedLayouts.length === 0) {
    return (
      <div>
        <h1>Generated Layouts</h1>

        <p>
          No generated layouts were found
          for this room.
        </p>
      </div>
    );
  }

  const selectedLayout =
    generatedLayouts[
      selectedLayoutIndex
    ];

  return (
    <div>
      <h1>Generated Layouts</h1>

      <p>
        Room: {room.width} ×{" "}
        {room.height} cm
      </p>

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
        {generatedLayouts.map(
          (generatedLayout, index) => (
            <div
              key={
                generatedLayout._id ||
                index
              }
              style={{
                border:
                  selectedLayoutIndex ===
                  index
                    ? "3px solid blue"
                    : "1px solid #999",

                padding: "15px",
                width: "250px",
                textAlign: "center",
                borderRadius: "8px",
              }}
            >
              <h3>
                Layout {index + 1}
              </h3>

              <p>
                Traffic Flow:{" "}
                {
                  generatedLayout
                    .scores.trafficFlow
                }
              </p>

              <p>
                Light Exposure:{" "}
                {
                  generatedLayout
                    .scores.lightExposure
                }
              </p>

              <p>
                Clearance:{" "}
                {
                  generatedLayout
                    .scores.clearance
                }
              </p>

              <p>
                Clustering:{" "}
                {
                  generatedLayout
                    .scores.clustering
                }
              </p>

              <p>
                Pareto Optimal:{" "}
                {generatedLayout.isParetoOptimal
                  ? "Yes"
                  : "No"}
              </p>

              <button
                onClick={() =>
                  setSelectedLayoutIndex(
                    index
                  )
                }
              >
                Select Layout
              </button>
            </div>
          )
        )}
      </div>

      <h2>Selected Layout</h2>

      <RoomCanvas
        roomWidth={room.width}
        roomHeight={room.height}
        layout={selectedLayout.layout}
        furnitureCatalog={
          furnitureCatalog
        }
        doors={room.doors}
        windows={room.windows}
      />

      <button
        onClick={() => {
          console.log(
            "Confirmed layout:",
            selectedLayout
          );

          alert(
            `Layout ${
              selectedLayoutIndex + 1
            } confirmed!`
          );
        }}
      >
        Confirm Layout
      </button>
    </div>
  );
}

export default LayoutView;