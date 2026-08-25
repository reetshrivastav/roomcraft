import { useEffect, useState } from "react";

import RoomCanvas from "../components/RoomCanvas";
import furnitureCatalog from "../furnitureCatalog.json";

import {
  getRoomLayouts,
  confirmLayout,
} from "../services/room";

function LayoutView() {
  const [room, setRoom] = useState(null);
  const [generatedLayouts, setGeneratedLayouts] = useState([]);
  const [selectedLayoutIndex, setSelectedLayoutIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadLayouts = async () => {
      try {
        setIsLoading(true);
        setError("");
        setSuccess("");

        const params = new URLSearchParams(window.location.search);
        const roomId = params.get("roomId");

        if (!roomId) {
          throw new Error("No room ID was provided.");
        }

        console.log("Loading layouts for room:", roomId);

        /*
         * Load room information from sessionStorage.
         */
        const storedRoom = sessionStorage.getItem(
          "roomcraft-current-room"
        );

        if (!storedRoom) {
          throw new Error(
            "Room information could not be found."
          );
        }

        const roomData = JSON.parse(storedRoom);

        if (roomData._id !== roomId) {
          throw new Error(
            "Stored room does not match the requested room."
          );
        }

        setRoom(roomData);

        /*
         * Fetch the actual generated layouts
         * from the backend.
         */
        const response = await getRoomLayouts(roomId);

        console.log(
          "Fetched generated layouts:",
          response
        );

        const layouts = response.layouts || [];

        setGeneratedLayouts(layouts);

        /*
         * If the room already has a confirmed layout,
         * automatically select it.
         */
        if (roomData.selectedLayoutId) {
          const confirmedIndex = layouts.findIndex(
            (layout) =>
              layout._id === roomData.selectedLayoutId
          );

          if (confirmedIndex !== -1) {
            setSelectedLayoutIndex(confirmedIndex);
          }
        }
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

  const handleSelectLayout = (index) => {
    setSelectedLayoutIndex(index);
    setError("");
    setSuccess("");
  };

  const handleConfirmLayout = async () => {
    try {
      setError("");
      setSuccess("");
      setIsConfirming(true);

      const params = new URLSearchParams(
        window.location.search
      );

      const roomId = params.get("roomId");

      if (!roomId) {
        throw new Error(
          "No room ID was provided."
        );
      }

      const selectedLayout =
        generatedLayouts[selectedLayoutIndex];

      if (!selectedLayout?._id) {
        throw new Error(
          "Selected layout has no ID."
        );
      }

      /*
       * Confirm the selected layout through the backend.
       */
      const response = await confirmLayout(
        roomId,
        selectedLayout._id
      );

      console.log(
        "Layout confirmed:",
        response
      );

      /*
       * Update local room state.
       */
      const updatedRoom = {
        ...room,
        selectedLayoutId: selectedLayout._id,
      };

      setRoom(updatedRoom);

      /*
       * Keep sessionStorage synchronized with
       * the backend state.
       */
      sessionStorage.setItem(
        "roomcraft-current-room",
        JSON.stringify(updatedRoom)
      );

      setSuccess(
        `Layout ${
          selectedLayoutIndex + 1
        } confirmed successfully!`
      );
    } catch (err) {
      console.error(
        "Failed to confirm layout:",
        err
      );

      setError(
        err.message ||
          "Failed to confirm layout."
      );
    } finally {
      setIsConfirming(false);
    }
  };

  /*
   * Loading state
   */
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

  /*
   * Fatal error before room information was loaded.
   */
  if (error && !room) {
    return (
      <div>
        <h1>Generated Layouts</h1>

        <p
          style={{
            color: "red",
          }}
        >
          {error}
        </p>
      </div>
    );
  }

  /*
   * No room available.
   */
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

  /*
   * Backend returned no layouts.
   */
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
    generatedLayouts[selectedLayoutIndex];

  return (
    <div>
      <h1>Generated Layouts</h1>

      <p>
        Room: {room.width} × {room.height} cm
      </p>

      {error && (
        <p
          style={{
            color: "red",
          }}
        >
          {error}
        </p>
      )}

      {success && (
        <p
          style={{
            color: "green",
          }}
        >
          {success}
        </p>
      )}

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
                  selectedLayoutIndex === index
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
                {generatedLayout.scores?.trafficFlow}
              </p>

              <p>
                Light Exposure:{" "}
                {generatedLayout.scores?.lightExposure}
              </p>

              <p>
                Clearance:{" "}
                {generatedLayout.scores?.clearance}
              </p>

              <p>
                Clustering:{" "}
                {generatedLayout.scores?.clustering}
              </p>

              <p>
                Pareto Optimal:{" "}
                {generatedLayout.isParetoOptimal
                  ? "Yes"
                  : "No"}
              </p>

              {room.selectedLayoutId ===
                generatedLayout._id && (
                <p
                  style={{
                    color: "green",
                    fontWeight: "bold",
                  }}
                >
                  Confirmed Layout
                </p>
              )}

              <button
                onClick={() =>
                  handleSelectLayout(index)
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
        furnitureCatalog={furnitureCatalog}
        doors={room.doors}
        windows={room.windows}
      />

      <button
        onClick={handleConfirmLayout}
        disabled={isConfirming}
      >
        {isConfirming
          ? "Confirming..."
          : "Confirm Layout"}
      </button>
    </div>
  );
}

export default LayoutView;