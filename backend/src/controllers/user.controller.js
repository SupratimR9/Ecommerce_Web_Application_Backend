import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

// Generate Activation Token
const createActivationToken = async (user) => {
  return jwt.sign(user, process.env.ACTIVATION_TOKEN_SECRET, {
    expiresIn: "5m",
  });
};

// Generate Access and Refresh Tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found!");
    }
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    if (!accessToken || !refreshToken) {
      throw new ApiError(
        500,
        "Something went wrong while generating Access and Refresh tokens!"
      );
    }
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
};

// Register User
const registerUser = asyncHandler(async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if ([fullName, email, password].some((field) => field?.trim() === "")) {
      throw new ApiError(404, "All fields are required!");
    }
    const existedUser = await User.findOne({ email });
    if (existedUser) {
      throw new ApiError(409, "User with this email already exists!");
    }
    // console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log(avatarLocalPath);
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required!");
    }
    const avatar = await uploadOnCloudinary(
      avatarLocalPath,
      "Ecommerce1/Users/Avatars"
    );
    // console.log(avatar);
    if (!avatar) {
      throw new ApiError(400, "Avatar file is required!");
    }
    const user = await User.create({
      fullName,
      avatar: { public_id: avatar.public_id, url: avatar.secure_url },
      email,
      password,
    });
    const createdUser = await User.findById(user?._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the User!"
      );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          createdUser,
          "User has been registered successfuly!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// If registerUserWithEmailValidation() is in use then registerUser() is not required. Which one to run can be chosen in the user route file.

// Register User with Email Validation using Activation Token
const registerUserWithEmailValidation = asyncHandler(async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if ([fullName, email, password].some((field) => field?.trim() === "")) {
      throw new ApiError(404, "All fields are required!");
    }
    const existedUser = await User.findOne({ email });
    if (existedUser) {
      throw new ApiError(409, "User with this email already exists!");
    }
    // console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log(avatarLocalPath);
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required!");
    }
    const prematureUser = {
      fullName,
      email,
      password,
      avatarLocalPath,
    };
    const activationToken = await createActivationToken(prematureUser);
    const activationUrl = `${req.protocol}://${req.get(
      "host"
    )}/activation/${activationToken}`;
    const emailBody = `Hello ${prematureUser.fullName},\nPlease click on the link below to activate your account.\n\nAccount activation link: ${activationUrl}\n\n\nPlease do not reply to this email.`;
    try {
      await sendEmail({
        email: prematureUser.email,
        subject: "Subarna Mega Store: Account activation",
        emailBody,
      });
      return res
        .status(200)
        .json(
          new ApiResponse(
            201,
            {},
            `Account activation email sent to ${prematureUser.email} successfully!`
          )
        );
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Activate and Create User
const activateUser = asyncHandler(async (req, res) => {
  try {
    const activationToken = req.params?.token;
    if (!activationToken) {
      throw new ApiError(400, "Invalid Token!");
    }
    const decodedToken = jwt.verify(
      activationToken,
      process.env.ACTIVATION_TOKEN_SECRET
    );
    if (!decodedToken) {
      throw new ApiError(400, "Token could not be decoded!");
    }
    const checkExistingUser = await User.findOne({ email: decodedToken.email });
    if (checkExistingUser) {
      throw new ApiError(400, "User with this email already exists!");
    }
    const avatar = await uploadOnCloudinary(
      decodedToken.avatarLocalPath,
      "Ecommerce1/Users/Avatars"
    );
    if (!avatar) {
      throw new ApiError(400, "Avatar file is required!");
    }
    const newUser = await User.create({
      fullName: decodedToken.fullName,
      avatar: { public_id: avatar.public_id, url: avatar.secure_url },
      email: decodedToken.email,
      password: decodedToken.password,
    });
    const createdUser = await User.findById(newUser?._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the User!"
      );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          createdUser,
          "User has been registered successfuly!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  try {
    // console.log(req.body);
    const { email, password } = req.body;
    // console.log(email);
    // console.log(password);
    if (!email || !password) {
      throw new ApiError(404, "Please enter email and password!");
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, "User does not exist!");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid User credentials!");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          201,
          { user: loggedInUser, accessToken, refreshToken },
          "User logged in successfully!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Logout User
const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $unset: {
          refreshToken: 1, // this removes the field from the document
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully!"));
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request!");
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token!");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token has expired!");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          201,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(404, "Email is required!");
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(400, "User not found!");
    }
    const resetToken = await user.getResetPasswordToken(); // Get Token for resetting Password
    await user.save({ validateBeforeSave: false });
    const resetPasswordUrl = `${req.protocol}://${req.get(
      "host"
    )}/reset-password/${resetToken}`;
    const emailBody = `Your Password reset token is: -\n\n${resetPasswordUrl}\n\nIf you have not requested for Password reset then please ignore this email.\n\n\nPlease do not reply to this email.`;
    try {
      await sendEmail({
        email: user.email,
        subject: "Subarna Mega Store: Password Recovery",
        emailBody,
      });
      return res
        .status(200)
        .json(
          new ApiResponse(
            201,
            {},
            `Password reset email sent to ${user.email} successfully!`
          )
        );
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { newPassword, confirmNewPassword } = req.body;
    if (!newPassword || !confirmNewPassword) {
      throw new ApiError(404, "All fields are required!");
    }
    if (newPassword !== confirmNewPassword) {
      throw new ApiError(400, "Password does not match!");
    }
    const resetToken = req.params?.token;
    const encryptedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const user = await User.findOne({
      resetPasswordToken: encryptedResetToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      throw new ApiError(400, "User not found!");
    }
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(201, {}, "Password reset has been successful!"));
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Change Password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      throw new ApiError(404, "All fields are required!");
    }
    const user = await User.findById(req.user?._id);
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
      throw new ApiError(400, "Old Password is incorrect!");
    }
    if (newPassword !== confirmNewPassword) {
      throw new ApiError(400, "Password does not match!");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(201, {}, "Password changed successfully!"));
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Get Current User Details
const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(400, "User not found!");
    }
    return res
      .status(200)
      .json(new ApiResponse(201, user, "Current User details fetched!"));
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Update Account Details
const updateAccountDetails = asyncHandler(async (req, res) => {
  try {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
      throw new ApiError(404, "All fields are required!");
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          email: email,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -refreshToken");
    return res
      .status(200)
      .json(
        new ApiResponse(201),
        user,
        "Account details updated successfully!"
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Update Avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    const oldAvatarFilePublicId = req.user?.avatar?.public_id;
    if (!oldAvatarFilePublicId) {
      throw new ApiError(400, "Previous Avatar file is missing!");
    }
    const newAvatarLocalPath = req.file?.path;
    if (!newAvatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing!");
    }
    const oldAvatarFileDeletedFromCloudinary = await deleteFromCloudinary(
      oldAvatarFilePublicId
    );
    console.log(oldAvatarFileDeletedFromCloudinary);
    const avatar = await uploadOnCloudinary(
      newAvatarLocalPath,
      "Ecommerce1/Users/Avatars"
    );
    if (!avatar) {
      throw new ApiError(400, "Error while trying to update Avatar file!");
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: { public_id: avatar.public_id, url: avatar.secure_url },
        },
      },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");
    return res
      .status(200)
      .json(new ApiResponse(201, user, "Avatar image updated successfully!"));
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Get all Users (admin)
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshToken");
    if (!users) {
      throw new ApiError(400, "No User found in Database!");
    }
    return res
      .status(200)
      .json(new ApiResponse(201, users, "Here are all the Users!"));
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Get Single User (admin)
const getSingleUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.params?.id;
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(400, "User not found!");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(201, user, "Here is the requested User's details!")
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Update User's Role (Admin)
const updateUserRole = asyncHandler(async (req, res) => {
  try {
    const userId = req.params?.id;
    const { role } = req.body;
    if (!role) {
      throw new ApiError(400, "No Role is specified!");
    }
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          role: role,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -refreshToken");
    return res
      .status(200)
      .json(new ApiResponse(201, user, "User's Role updated successfully!"));
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Delete User (Admin)
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.params?.id;
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(400, "User not found!");
    }
    const avatarPublicId = user.avatar.public_id;
    const avatarFileDeletedFromCloudinary = await deleteFromCloudinary(
      avatarPublicId
    );
    console.log(avatarFileDeletedFromCloudinary);
    await User.findByIdAndDelete(user._id)
      .then((data) => {
        console.log(
          `User with id: '${data._id}' and email: '${data.email}' has been deleted!`
        );
      })
      .catch((error) => {
        console.log(error);
      });
    return res
      .status(200)
      .json(new ApiResponse(201, {}, "User has been deleted successfully!"));
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

export {
  registerUser,
  registerUserWithEmailValidation,
  activateUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  getAllUsers,
  getSingleUser,
  updateUserRole,
  deleteUser,
};
