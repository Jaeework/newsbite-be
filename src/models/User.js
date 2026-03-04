const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nickname: {
    type: String,
    required: true
  },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ["A2", "B1", "B2", "C1"],
      default: "A2",
    },
    del_flag: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
