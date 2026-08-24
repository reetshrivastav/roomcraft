const ALLOWED_WALLS = ["top", "right", "bottom", "left"];

function validateRoom(room) {
  const errors = {};

  if (!room || typeof room !== "object") {
    return {
      valid: false,
      errors: {
        room: "Room data is required."
      }
    };
  }

  // -------------------------
  // Room dimensions
  // -------------------------

  if (
    room.width === undefined ||
    room.width === null ||
    room.width === ""
  ) {
    errors.width = "Room width is required.";
  } else if (typeof room.width !== "number" || room.width <= 0) {
    errors.width = "Room width must be a positive number.";
  }

  if (
    room.height === undefined ||
    room.height === null ||
    room.height === ""
  ) {
    errors.height = "Room height is required.";
  } else if (typeof room.height !== "number" || room.height <= 0) {
    errors.height = "Room height must be a positive number.";
  }

  // -------------------------
  // Doors
  // -------------------------

  if (!Array.isArray(room.doors)) {
    errors.doors = "Doors must be an array.";
  } else {
    const doorErrors = [];

    room.doors.forEach((door, index) => {
      const currentErrors = {};

      if (!door || typeof door !== "object") {
        doorErrors[index] = "Invalid door.";
        return;
      }

      if (
        door.x === undefined ||
        door.x === null ||
        door.x === ""
      ) {
        currentErrors.x = "Door x-coordinate is required.";
      } else if (typeof door.x !== "number" || door.x < 0) {
        currentErrors.x = "Door x-coordinate must be a non-negative number.";
      }

      if (
        door.y === undefined ||
        door.y === null ||
        door.y === ""
      ) {
        currentErrors.y = "Door y-coordinate is required.";
      } else if (typeof door.y !== "number" || door.y < 0) {
        currentErrors.y = "Door y-coordinate must be a non-negative number.";
      }

      if (!ALLOWED_WALLS.includes(door.wall)) {
        currentErrors.wall =
          'Door wall must be "top", "right", "bottom", or "left".';
      }

      if (Object.keys(currentErrors).length > 0) {
        doorErrors[index] = currentErrors;
      }
    });

    if (doorErrors.length > 0) {
      errors.doors = doorErrors;
    }
  }

  // -------------------------
  // Windows
  // -------------------------

  if (!Array.isArray(room.windows)) {
    errors.windows = "Windows must be an array.";
  } else {
    const windowErrors = [];

    room.windows.forEach((window, index) => {
      const currentErrors = {};

      if (!window || typeof window !== "object") {
        windowErrors[index] = "Invalid window.";
        return;
      }

      if (
        window.x === undefined ||
        window.x === null ||
        window.x === ""
      ) {
        currentErrors.x = "Window x-coordinate is required.";
      } else if (typeof window.x !== "number" || window.x < 0) {
        currentErrors.x =
          "Window x-coordinate must be a non-negative number.";
      }

      if (
        window.y === undefined ||
        window.y === null ||
        window.y === ""
      ) {
        currentErrors.y = "Window y-coordinate is required.";
      } else if (typeof window.y !== "number" || window.y < 0) {
        currentErrors.y =
          "Window y-coordinate must be a non-negative number.";
      }

      if (!ALLOWED_WALLS.includes(window.wall)) {
        currentErrors.wall =
          'Window wall must be "top", "right", "bottom", or "left".';
      }

      if (Object.keys(currentErrors).length > 0) {
        windowErrors[index] = currentErrors;
      }
    });

    if (windowErrors.length > 0) {
      errors.windows = windowErrors;
    }
  }

  // -------------------------
  // Furniture selection
  // -------------------------

  if (!Array.isArray(room.furnitureSelection)) {
    errors.furnitureSelection =
      "Furniture selection must be an array.";
  } else {
    const invalidFurniture = room.furnitureSelection.some(
      (id) => typeof id !== "string" || id.trim() === ""
    );

    if (invalidFurniture) {
      errors.furnitureSelection =
        "Furniture selection must contain valid furniture IDs.";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export default validateRoom; 