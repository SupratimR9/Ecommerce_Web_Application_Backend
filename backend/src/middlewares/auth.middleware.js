import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Whether User is authenticated or not
export const isAuthenticated = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorized access request!");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid Access Token!");
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Whether User is normal user or Admin user
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    try {
      const role = req.user?.role;
      if (!roles.includes(role)) {
        throw new ApiError(
          403,
          `Role: ${role} is not allowed to access this resource!`
        );
      }
      next();
    } catch (error) {
      return res.status(400).json({ error, message: error.message });
    }
  };
};
