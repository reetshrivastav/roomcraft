const mongoose = require("mongoose");

const furnitureSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true
    },

    name: {
      type: String,
      required: true
    },

    width: {
      type: Number,
      required: true,
      min: 1
    },

    depth: {
      type: Number,
      required: true,
      min: 1
    },

    category: {
      type: String,
      required: true
    },

    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Furniture", furnitureSchema);