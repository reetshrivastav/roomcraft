const mongoose = require("mongoose");
const express = require("express");
const Room = require("../models/Room");
const GeneratedLayout = require("../models/GeneratedLayout");
const generateLayouts = require("../ga/generateLayouts");
const { runGeneticAlgorithm } = require("../ga/runGA");
const router = express.Router();

const ALLOWED_WALLS = [
  "top",
  "right",
  "bottom",
  "left"
];

function validateRoom(room) {
  const errors = {};

  if (
    room.width === undefined ||
    room.width === null ||
    typeof room.width !== "number" ||
    room.width <= 0
  ) {
    errors.width =
      "Width must be a positive number.";
  }

  if (
    room.height === undefined ||
    room.height === null ||
    typeof room.height !== "number" ||
    room.height <= 0
  ) {
    errors.height =
      "Height must be a positive number.";
  }

  if (!Array.isArray(room.doors)) {
    errors.doors =
      "Doors must be an array.";
  } else {
    room.doors.forEach((door, index) => {
      if (!door || typeof door !== "object") {
        errors[`doors.${index}`] =
          "Invalid door.";
        return;
      }

      if (
        typeof door.x !== "number" ||
        door.x < 0
      ) {
        errors[`doors.${index}.x`] =
          "Door x must be a non-negative number.";
      }

      if (
        typeof door.y !== "number" ||
        door.y < 0
      ) {
        errors[`doors.${index}.y`] =
          "Door y must be a non-negative number.";
      }

      if (
        !ALLOWED_WALLS.includes(
          door.wall
        )
      ) {
        errors[`doors.${index}.wall`] =
          'Door wall must be "top", "right", "bottom", or "left".';
      }
    });
  }

  if (!Array.isArray(room.windows)) {
    errors.windows =
      "Windows must be an array.";
  } else {
    room.windows.forEach(
      (window, index) => {
        if (
          !window ||
          typeof window !== "object"
        ) {
          errors[`windows.${index}`] =
            "Invalid window.";
          return;
        }

        if (
          typeof window.x !== "number" ||
          window.x < 0
        ) {
          errors[`windows.${index}.x`] =
            "Window x must be a non-negative number.";
        }

        if (
          typeof window.y !== "number" ||
          window.y < 0
        ) {
          errors[`windows.${index}.y`] =
            "Window y must be a non-negative number.";
        }

        if (
          !ALLOWED_WALLS.includes(
            window.wall
          )
        ) {
          errors[`windows.${index}.wall`] =
            'Window wall must be "top", "right", "bottom", or "left".';
        }
      }
    );
  }

  if (
    !Array.isArray(
      room.furnitureSelection
    )
  ) {
    errors.furnitureSelection =
      "Furniture selection must be an array.";
  } else {
    const invalidFurniture =
      room.furnitureSelection.some(
        (id) =>
          typeof id !== "string" ||
          id.trim() === ""
      );

    if (invalidFurniture) {
      errors.furnitureSelection =
        "Furniture selection must contain valid furniture IDs.";
    }
  }

  return errors;
}

// -----------------------------------------
// POST /rooms
// -----------------------------------------

router.post("/", async (req, res) => {
  try {
    const roomData = req.body;

    const errors =
      validateRoom(roomData);

    if (
      Object.keys(errors).length > 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid room data.",
        errors
      });
    }

    const userId =
      "development-user";

    const room = await Room.create({
      userId,
      width: roomData.width,
      height: roomData.height,
      doors: roomData.doors,
      windows: roomData.windows,
      furnitureSelection:
        roomData.furnitureSelection
    });

    return res.status(201).json({
      success: true,
      message:
        "Room created successfully.",
      room
    });
  } catch (error) {
    console.error(
      "Create room error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create room."
    });
  }
});

// -----------------------------------------
// POST /rooms/:id/generate
// -----------------------------------------

router.post("/:id/generate", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the room
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found."
      });
    }

    // Run the genetic algorithm
    const gaResult = runGeneticAlgorithm(
      {
        width: room.width,
        height: room.height,
        doors: room.doors,
        windows: room.windows,
        furnitureSelection: room.furnitureSelection
      },
      {
        populationSize: 10,
        generations: 20,
        parentCount: 4,
        mutationRate: 0.2,
        positionMutationAmount: 50
      }
    );

    // Remove previously generated layouts
    // for this room before saving the new results.
    await GeneratedLayout.deleteMany({
      roomId: room._id.toString()
    });

    // Save every Pareto-optimal layout
    const generatedLayouts =
      await GeneratedLayout.insertMany(
        gaResult.paretoFront.map((candidate) => ({
          roomId: room._id.toString(),

          layout: candidate.chromosome,

          scores: candidate.scores,

          isParetoOptimal: true
        }))
      );

    return res.status(201).json({
      success: true,
      message: "Layouts generated successfully.",
      layouts: generatedLayouts
    });
  } catch (error) {
    console.error(
      "Generate layouts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to generate layouts."
    });
  }
});

// -----------------------------------------
// GET /rooms/:id/layouts
// -----------------------------------------

router.get(
  "/:id/layouts",
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid room ID."
        });
      }

      const room =
        await Room.findById(id);

      if (!room) {
        return res.status(404).json({
          success: false,
          message:
            "Room not found."
        });
      }

      const layouts =
        await GeneratedLayout.find({
          roomId: room._id.toString()
        }).sort({
          createdAt: -1
        });

      return res.status(200).json({
        success: true,
        layouts
      });
    } catch (error) {
      console.error(
        "Get room layouts error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch room layouts."
      });
    }
  }
);

// -----------------------------------------
// POST /rooms/:roomId/layouts/:layoutId/confirm
// -----------------------------------------

router.post(
  "/:roomId/layouts/:layoutId/confirm",
  async (req, res) => {
    try {
      const {
        roomId,
        layoutId
      } = req.params;

      // Validate IDs

      if (
        !mongoose.Types.ObjectId.isValid(
          roomId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid room ID."
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          layoutId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid layout ID."
        });
      }

      // Find room

      const room =
        await Room.findById(
          roomId
        );

      if (!room) {
        return res.status(404).json({
          success: false,
          message:
            "Room not found."
        });
      }

      // Find layout

      const layout =
        await GeneratedLayout.findById(
          layoutId
        );

      if (!layout) {
        return res.status(404).json({
          success: false,
          message:
            "Layout not found."
        });
      }

      // Make sure the layout
      // belongs to this room

      if (
        layout.roomId !==
        room._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Layout does not belong to this room."
        });
      }

      // Persist selected layout

      room.selectedLayoutId =
        layout._id.toString();

      await room.save();

      return res.status(200).json({
        success: true,
        message:
          "Layout confirmed successfully.",
        room,
        layout
      });
    } catch (error) {
      console.error(
        "Confirm layout error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to confirm layout."
      });
    }
  }
);

module.exports = router;