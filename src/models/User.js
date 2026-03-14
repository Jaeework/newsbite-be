const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");

const userSchema = Schema(
  {
    nickname: {
      type: String,
      required: true,
      trim: true,
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
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    }
  },
  { timestamps: true },
);
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.del_flag;
    return ret;
  }
});

userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

const User = mongoose.model("User", userSchema);

module.exports = User;
