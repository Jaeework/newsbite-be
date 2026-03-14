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
    isVerified: {type: Boolean, default: false},
    verificationToken: {type: String},
    verificationTokenExpiresAt: {type: Date},
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
    delete ret.isVerified;
    delete ret.verificationToken;
    delete ret.verificationTokenExpiresAt;
    return ret;
  }
});

userSchema.index(
  { verificationTokenExpiresAt: 1 },
  { expireAfterSeconds: 0 }
);

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
