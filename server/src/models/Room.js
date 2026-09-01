const mongoose = require("mongoose");

const doorSchema = new mongoose.Schema(
  {
    x: {
      type: Number,
      required: true,
      min: 0
    },

    y: {
      type: Number,
      required: true,
      min: 0
    },

    wall: {
      type: String,
      required: true,
      enum: ["top", "right", "bottom", "left"]
    }
  },
  {
    _id: false
  }
);

const windowSchema = new mongoose.Schema(
  {
    x: {
      type: Number,
      required: true,
      min: 0
    },

    y: {
      type: Number,
      required: true,
      min: 0
    },

    wall: {
      type: String,
      required: true,
      enum: ["top", "right", "bottom", "left"]
    }
  },
  {
    _id: false
  }
);

const roomSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },

    width: {
      type: Number,
      required: true,
      min: 1
    },

    height: {
      type: Number,
      required: true,
      min: 1
    },

    doors: {
      type: [doorSchema],
      default: []
    },

    windows: {
      type: [windowSchema],
      default: []
    },

    furnitureSelection: {
      type: [String],
      default: []
    },

    selectedLayoutId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

roomSchema.index({ userId: 1 });

module.exports = mongoose.model(
  "Room",
  roomSchema
);