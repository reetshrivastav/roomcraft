const mongoose = require("mongoose");

const layoutItemSchema = new mongoose.Schema(
  {
    furnitureId: {
      type: String,
      required: true
    },

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

    rotation: {
      type: Number,
      required: true,
      enum: [0, 90, 180, 270]
    }
  },
  {
    _id: false
  }
);

const scoreVectorSchema = new mongoose.Schema(
  {
    trafficFlow: {
      type: Number,
      required: true
    },

    lightExposure: {
      type: Number,
      required: true
    },

    clearance: {
      type: Number,
      required: true
    },

    clustering: {
      type: Number,
      required: true
    }
  },
  {
    _id: false
  }
);

const generatedLayoutSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true
    },

    layout: {
      type: [layoutItemSchema],
      required: true,
      default: []
    },

    scores: {
      type: scoreVectorSchema,
      required: true
    },

    isParetoOptimal: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

generatedLayoutSchema.index({ roomId: 1 });

module.exports = mongoose.model(
  "GeneratedLayout",
  generatedLayoutSchema
);