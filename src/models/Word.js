const mongoose = require("mongoose");
const Schema = mongoose.Schema;

require("./NewsWord");
require("./News");

const wordSchema = Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    meaning: {
      type: String,
    },
    example: {
      type: String,
    },
    example_meaning: {
      type: String,
    },
    type: {
      type: String,
      enum: ["word", "idiom"],
    },
    tts_url: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

wordSchema.virtual("news", {
  ref: "NewsWord",
  localField: "_id",
  foreignField: "word",
});

const Word = mongoose.model("Word", wordSchema);

module.exports = Word;
