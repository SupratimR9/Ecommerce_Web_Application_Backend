import { Router } from "express";
import {
  createNewProduct,
  createOrUpdateReview,
  deleteExistingProduct,
  deleteReview,
  getAllProducts,
  getAllProductsAdmin,
  getProductReviews,
  getSingleProduct,
  testFunction,
  updateExistingProductDetails,
  updateExistingProductImages,
} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  authorizeRoles,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/all-products").get(getAllProducts);
router.route("/product/:id").get(getSingleProduct);
router
  .route("/create/update/review/:id")
  .patch(isAuthenticated, createOrUpdateReview);
router.route("/get-product-reviews/:id").get(getProductReviews);
router.route("/delete-review").delete(isAuthenticated, deleteReview);

// Admin Routes
router
  .route("/admin/new-product")
  .post(
    isAuthenticated,
    authorizeRoles("admin"),
    upload.array("productImages", 4),
    createNewProduct
  );
router
  .route("/admin/update-product-details/:id")
  .patch(
    isAuthenticated,
    authorizeRoles("admin"),
    updateExistingProductDetails
  );
router
  .route("/admin/update-product-images/:id")
  .patch(
    isAuthenticated,
    authorizeRoles("admin"),
    upload.array("productImages", 4),
    updateExistingProductImages
  );
router
  .route("/admin/delete-product/:id")
  .delete(isAuthenticated, authorizeRoles("admin"), deleteExistingProduct);
router
  .route("/admin/product/all")
  .get(isAuthenticated, authorizeRoles("admin"), getAllProductsAdmin);

// router
//   .route("/test-function")
//   .post(
//     isAuthenticated,
//     authorizeRoles("admin"),
//     upload.array("productImages", 4),
//     testFunction
//   );

export default router;
