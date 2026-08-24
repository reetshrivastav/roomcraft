import { useState } from "react";
import furnitureCatalog from "../furnitureCatalog.json";

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
  const [window, setWindow] = useState({
  x: "",
  y: "",
  wall: "top",
});

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
      [name]: name === "wall" ? value : value === "" ? "" : Number(value),
    }));
  };
  const handleWindowChange = (e) => {
  const { name, value } = e.target;

  setWindow((prev) => ({
    ...prev,
    [name]: name === "wall" ? value : value === "" ? "" : Number(value),
  }));
};
  const handleFurnitureChange = (furnitureId) => {
  setRoom((prev) => {
    const alreadySelected = prev.furnitureSelection.includes(furnitureId);

    return {
      ...prev,
      furnitureSelection: alreadySelected
        ? prev.furnitureSelection.filter((id) => id !== furnitureId)
        : [...prev.furnitureSelection, furnitureId],
    };
  });
};

  const handleSubmit = (e) => {
    e.preventDefault();

   const roomData = {
  ...room,
  doors: [door],
  windows: [window],
    };

    console.log("Room data:", roomData);
  };

  return (
    <div>
      <h1>Room Setup</h1>

      <form onSubmit={handleSubmit}>
        <h2>Room Dimensions</h2>

        <div>
          <label htmlFor="width">Room Width (cm)</label>
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
          <label htmlFor="height">Room Height (cm)</label>
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
          <label htmlFor="door-wall">Wall</label>
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
          <label htmlFor="door-x">X Position (cm)</label>
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
          <label htmlFor="door-y">Y Position (cm)</label>
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
  <label htmlFor="window-wall">Wall</label>
  <select
    id="window-wall"
    name="wall"
    value={window.wall}
    onChange={handleWindowChange}
  >
    <option value="top">Top</option>
    <option value="right">Right</option>
    <option value="bottom">Bottom</option>
    <option value="left">Left</option>
  </select>
</div>

<div>
  <label htmlFor="window-x">X Position (cm)</label>
  <input
    id="window-x"
    name="x"
    type="number"
    min="0"
    value={window.x}
    onChange={handleWindowChange}
    required
  />
</div>

<div>
  <label htmlFor="window-y">Y Position (cm)</label>
  <input
    id="window-y"
    name="y"
    type="number"
    min="0"
    value={window.y}
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
        checked={room.furnitureSelection.includes(furniture.id)}
        onChange={() => handleFurnitureChange(furniture.id)}
      />

      {furniture.name} ({furniture.width} x {furniture.depth} cm)
    </label>
  ))}
</div>
        <button type="submit">Create Room</button>
      </form>
    </div>
  );
}

export default RoomSetup;