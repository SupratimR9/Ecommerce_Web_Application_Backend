import { Router } from "express";
import {
  activateUser,
  changeCurrentPassword,
  deleteUser,
  forgotPassword,
  getAllUsers,
  getCurrentUser,
  getSingleUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  registerUserWithEmailValidation,
  resetPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserRole,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  authorizeRoles,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";

const router = Router();

// router.route("/register").post(
//   upload.fields([
//     {
//       name: "avatar",
//       maxCount: 1,
//     },
//   ]),
//   registerUser
// );
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  registerUserWithEmailValidation
);
router.route("/activation/:token").post(activateUser);
router.route("/login").post(loginUser);
router.route("/logout").post(isAuthenticated, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").put(resetPassword);
router.route("/change-password").post(isAuthenticated, changeCurrentPassword);
router.route("/current-user").get(isAuthenticated, getCurrentUser);
router.route("/update-account").patch(isAuthenticated, updateAccountDetails);
router
  .route("/update-avatar")
  .patch(isAuthenticated, upload.single("avatar"), updateUserAvatar);

//Admin Routes
router
  .route("/admin/all-users")
  .get(isAuthenticated, authorizeRoles("admin"), getAllUsers);
router
  .route("/admin/user/:id")
  .get(isAuthenticated, authorizeRoles("admin"), getSingleUser)
  .patch(isAuthenticated, authorizeRoles("admin"), updateUserRole)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteUser);

export default router;
