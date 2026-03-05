const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const newsSchema = Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: [String],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    published_at: {
      type: Date,
      required: true,
    },
    level: {
      type: String,
      enum: ["A2", "B1", "B2", "C1"],
      required: true,
    },
    source: {
      type: String,
    },
    translated_content: {
      type: [String],
    },
  },
  { timestamps: true },
);

const News = mongoose.model("News", newsSchema);

module.exports = News;
