import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";

// Middleware function to verify JSON Web Tokens
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // Retrieve token from cookies or authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // If token is not present, throw unauthorized error
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // Verify the token using the secret key
    const decodedToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    // Find user associated with the decoded token
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // If user is not found, throw invalid access token error
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    // Attach user object to the request
    req.user = user;
    next(); // Call the next middleware
  } catch (error) {
    // If any error occurs, throw a standardized unauthorized error
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
