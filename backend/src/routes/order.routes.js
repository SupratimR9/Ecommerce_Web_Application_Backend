import { Router } from "express";
import {
  authorizeRoles,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";
import {
  createNewOrder,
  deleteOrder,
  getAllOrders,
  getMyOrders,
  getSingleOrder,
  updateOrder,
} from "../controllers/order.controller.js";

const router = Router();

router.route("/new-order").post(isAuthenticated, createNewOrder);
router.route("/order/:id").get(isAuthenticated, getSingleOrder);
router.route("/my-orders").get(isAuthenticated, getMyOrders);

// Admin Routes
router
  .route("/admin/all-orders")
  .get(isAuthenticated, authorizeRoles("admin"), getAllOrders);
router
  .route("/admin/order/:id")
  .patch(isAuthenticated, authorizeRoles("admin"), updateOrder)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteOrder);

export default router;
