import { useState } from "react";

import furnitureCatalog from "../furnitureCatalog.json";
import validateRoom from "../utils/validateRoom";
import { createRoom, generateLayouts } from "../services/room";

function RoomSetup() {
  const [room, setRoom] = useState({
    width: "",
    height: "",
    doors: [],
    windows: [],
    furnitureSelection: [],
  });

  const [door, setDoor] = useState({
    x: "",
    y: "",
    wall: "top",
  });

  const [windowData, setWindowData] = useState({
    x: "",
    y: "",
    wall: "top",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoomChange = (e) => {
    const { name, value } = e.target;

    setRoom((prev) => ({
      ...prev,
      [name]: value === "" ? "" : Number(value),
    }));
  };

  const handleDoorChange = (e) => {
    const { name, value } = e.target;

    setDoor((prev) => ({
      ...prev,
      [name]:
        name === "wall"
          ? value
          : value === ""
            ? ""
            : Number(value),
    }));
  };

  const handleWindowChange = (e) => {
    const { name, value } = e.target;

    setWindowData((prev) => ({
      ...prev,
      [name]:
        name === "wall"
          ? value
          : value === ""
            ? ""
            : Number(value),
    }));
  };

  const handleFurnitureChange = (furnitureId) => {
    setRoom((prev) => {
      const alreadySelected =
        prev.furnitureSelection.includes(furnitureId);

      return {
        ...prev,
        furnitureSelection: alreadySelected
          ? prev.furnitureSelection.filter(
              (id) => id !== furnitureId
            )
          : [...prev.furnitureSelection, furnitureId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const roomData = {
      ...room,
      doors: [door],
      windows: [windowData],
    };

    const validation = validateRoom(roomData);

    if (!validation.valid) {
      setError("Please fix the room data before continuing.");
      console.log(
        "Validation errors:",
        validation.errors
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // --------------------------------
      // Step 1: Create the room
      // --------------------------------

      const roomResponse = await createRoom(roomData);

      console.log(
        "Room created successfully:",
        roomResponse
      );

      const roomId = roomResponse.room?._id;

      if (!roomId) {
        throw new Error(
          "Room was created but no room ID was returned."
        );
      }

      console.log("Created room ID:", roomId);

      // --------------------------------
      // Step 2: Generate a layout
      // --------------------------------

      const layoutResponse = await generateLayouts(roomId);

      console.log(
        "Layout generated successfully:",
        layoutResponse
      );

      // --------------------------------
      // Step 3: Save room information
      // --------------------------------

      sessionStorage.setItem(
        "roomcraft-current-room",
        JSON.stringify({
          _id: roomId,
          width: roomResponse.room.width,
          height: roomResponse.room.height,
          doors: roomResponse.room.doors,
          windows: roomResponse.room.windows,
          furnitureSelection:
            roomResponse.room.furnitureSelection,
        })
      );

      console.log(
        "Opening generated layouts for room:",
        roomId
      );

      // --------------------------------
      // Step 4: Open LayoutView
      // --------------------------------

      window.location.href = `/layout?roomId=${roomId}`;
    } catch (err) {
      console.error(
        "Room setup failed:",
        err
      );

      setError(
        err.message ||
          "Failed to create room."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Room Setup</h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

        {success && (
          <p style={{ color: "green" }}>
            {success}
          </p>
        )}

        <h2>Room Dimensions</h2>

        <div>
          <label htmlFor="width">
            Room Width (cm)
          </label>

          <input
            id="width"
            name="width"
            type="number"
            min="1"
            value={room.width}
            onChange={handleRoomChange}
            required
          />
        </div>

        <div>
          <label htmlFor="height">
            Room Height (cm)
          </label>

          <input
            id="height"
            name="height"
            type="number"
            min="1"
            value={room.height}
            onChange={handleRoomChange}
            required
          />
        </div>

        <h2>Door</h2>

        <div>
          <label htmlFor="door-wall">
            Wall
          </label>

          <select
            id="door-wall"
            name="wall"
            value={door.wall}
            onChange={handleDoorChange}
          >
            <option value="top">Top</option>
            <option value="right">Right</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
          </select>
        </div>

        <div>
          <label htmlFor="door-x">
            X Position (cm)
          </label>

          <input
            id="door-x"
            name="x"
            type="number"
            min="0"
            value={door.x}
            onChange={handleDoorChange}
            required
          />
        </div>

        <div>
          <label htmlFor="door-y">
            Y Position (cm)
          </label>

          <input
            id="door-y"
            name="y"
            type="number"
            min="0"
            value={door.y}
            onChange={handleDoorChange}
            required
          />
        </div>

        <h2>Window</h2>

        <div>
          <label htmlFor="window-wall">
            Wall
          </label>

          <select
            id="window-wall"
            name="wall"
            value={windowData.wall}
            onChange={handleWindowChange}
          >
            <option value="top">Top</option>
            <option value="right">Right</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
          </select>
        </div>

        <div>
          <label htmlFor="window-x">
            X Position (cm)
          </label>

          <input
            id="window-x"
            name="x"
            type="number"
            min="0"
            value={windowData.x}
            onChange={handleWindowChange}
            required
          />
        </div>

        <div>
          <label htmlFor="window-y">
            Y Position (cm)
          </label>

          <input
            id="window-y"
            name="y"
            type="number"
            min="0"
            value={windowData.y}
            onChange={handleWindowChange}
            required
          />
        </div>

        <h2>Furniture</h2>

        <div>
          {furnitureCatalog.map((furniture) => (
            <label key={furniture.id}>
              <input
                type="checkbox"
                checked={room.furnitureSelection.includes(
                  furniture.id
                )}
                onChange={() =>
                  handleFurnitureChange(
                    furniture.id
                  )
                }
              />

              {furniture.name} (
              {furniture.width} x{" "}
              {furniture.depth} cm)
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Creating Room..."
            : "Create Room"}
        </button>
      </form>
    </div>
  );
}

export default RoomSetup;