import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Define the schema for the user model

const userSchema = new Schema(
  {
    // username of the user
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Email of the user
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Full name of the user
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // Avatar URL of the user (Cloudinary URL)
    avatar: {
      type: String,
      required: true,
    },
    // Cover image URL of the user (Cloudinary URL)
    coverImage: {
      type: String,
    },
    // Reference to the watch history of the user (Video model)
    watchHistory: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    // Password of the user (encrypted)
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    // Refresh token for user authentication
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true } // Timestamps for creation and update
);

// Middleware to run before saving user data, encrypts the password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);

  next();
});

// Method to check if the entered password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to generate access token for user authentication
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Method to generate refresh token for user authentication
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// Create and export the User model
export const User = mongoose.model("User", userSchema);
