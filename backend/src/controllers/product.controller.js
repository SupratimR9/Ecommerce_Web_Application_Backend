import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/apiError.js";
import ApiFeatures from "../utils/apiFeatures.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

// Test Function
const testFunction = asyncHandler(async (req, res) => {
  try {
    // console.log(req.body);
    const { productTitle, productDescription, price, stock, category } =
      req.body;
    if (
      [productTitle, productDescription, price, stock, category].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(404, "All mandatory fields are required!");
    }
    // console.log(req.files);
    const productImagesLocalPath = req.files?.path;
    // console.log(productImagesLocalPath);
    if (!productImagesLocalPath) {
      throw new ApiError(400, "Atleast one image of the Product is required!");
    }
    const productImages = await uploadOnCloudinary(
      productImagesLocalPath,
      "Ecommerce1/Users/Products"
    );
    // console.log(productImages);
    if (!productImages) {
      throw new ApiError(400, "Product images are required!");
    }
    const newProduct = await Product.create({
      productTitle, // means productTitle: productTitle,
      productDescription,
      price,
      stock,
      category,
    });
    const createdProduct = await Product.findById(newProduct._id).select(
      "-productImages"
    );
    // console.log(createdProduct);
    if (!createdProduct) {
      throw new ApiError(
        501,
        "Something went wrong while registering the Product!"
      );
      // return next(
      //   new ApiError(500, "Something went wrong while registering the Product")
      // );
      // return res
      //   .status(501)
      //   .json(
      //     new ApiError(500, "Something went wrong while registering the Product")
      //   );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          createdProduct,
          "Product has been registered successfully!"
        )
      );
  } catch (error) {
    // console.log(error.name);
    return res.status(500).json({ error, message: error.message });
  }
});

// Create New Product (Admin)
const createNewProduct = asyncHandler(async (req, res) => {
  try {
    const { productTitle, productDescription, price, stock, category } =
      req.body;
    if (
      [productTitle, productDescription, price, stock, category].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(404, "All mandatory fields are required!");
    }
    // console.log(req.files);
    const rawProductImagesArray = req.files;
    if (rawProductImagesArray.length === 0) {
      throw new ApiError(400, "Atleast one image of the Product is required!");
    }
    let productImages = [];
    for (let i = 0; i < rawProductImagesArray.length; i++) {
      if (rawProductImagesArray[i]?.path) {
        const image = await uploadOnCloudinary(
          rawProductImagesArray[i].path,
          "Ecommerce1/Products"
        );
        productImages.push({
          public_id: image?.public_id,
          url: image?.secure_url,
        });
      }
    }
    productImages.reverse();
    if (productImages.length === 0) {
      throw new ApiError(400, "Atleast one image of the Product is required!");
    }
    const newProduct = await Product.create({
      productTitle, // means productTitle: productTitle,
      productDescription,
      productImages,
      price,
      stock,
      category,
      productCreatedByWhom: req.user?._id,
    });
    const createdProduct = await Product.findById(newProduct?._id).select(
      "-productImages"
    );
    if (!createdProduct) {
      throw new ApiError(
        500,
        "Something went wrong while registering the Product!"
      );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          createdProduct,
          "Product has been registered successfully!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Update Existing Product details (Admin)
const updateExistingProductDetails = asyncHandler(async (req, res, next) => {
  try {
    const { productTitle, productDescription, price, stock, category } =
      req.body;
    if (!productTitle || !productDescription || !price || !stock || !category) {
      throw new ApiError(404, "All mandatory fields are required!");
    }
    const existingProduct = await Product.findById(req.params?.id);
    if (!existingProduct) {
      // return res.status(500).json({
      //   success: false,
      //   message: "Product not found",
      // });
      throw new ApiError(404, "Product not found!");
      // return next(new ApiError(404, "Product not found"));
      // return res.status(400).json(new ApiError(404, "Product not found"));
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      existingProduct._id,
      {
        $set: {
          productTitle,
          productDescription,
          price,
          stock,
          category,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-productImages");
    return res.status(200).json(
      // {
      //   success: true,
      //   updatedProduct,
      // }
      new ApiResponse(
        201,
        updatedProduct,
        "Product details have been updated successfully!"
      )
    );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Update Existing Product images (Admin)
const updateExistingProductImages = asyncHandler(async (req, res) => {
  try {
    const rawProductImagesArray = req.files;
    if (rawProductImagesArray.length === 0) {
      throw new ApiError(400, "Atleast one image of the Product is required!");
    }
    const existingProduct = await Product.findById(req.params?.id);
    if (!existingProduct) {
      throw new ApiError(404, "Product not found!");
    }
    const existingProductImages = existingProduct.productImages;
    if (existingProductImages.length !== 0) {
      for (let i = 0; i < existingProductImages.length; i++) {
        await deleteFromCloudinary(existingProductImages[i]?.public_id);
      }
    }
    let productImages = [];
    for (let i = 0; i < rawProductImagesArray.length; i++) {
      if (rawProductImagesArray[i]?.path) {
        const image = await uploadOnCloudinary(
          rawProductImagesArray[i].path,
          "Ecommerce1/Products"
        );
        productImages.push({
          public_id: image?.public_id,
          url: image?.secure_url,
        });
      }
    }
    productImages.reverse();
    if (productImages.length === 0) {
      throw new ApiError(400, "Atleast one image of the Product is required!");
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      existingProduct._id,
      {
        $set: {
          productImages,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-productImages");
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          updatedProduct,
          "Product images have been updated successfully!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Create new review or Update existing review of a User
const createOrUpdateReview = asyncHandler(async (req, res) => {
  try {
    const productId = req.params?.id;
    const { rating, comment } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(400, "Product not found!");
    }
    const review = {
      reviewer: req.user?._id,
      reviewerName: req.user?.fullName,
      reviewerRating: rating ? rating : 0,
      reviewerComment: comment ? comment : "No comment.",
    };
    const isReviewed = product.reviews.find(
      (rev) => rev?.reviewer?.toString() === req.user?._id?.toString()
    );
    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev?.reviewer?.toString() === req.user?._id?.toString()) {
          rev.reviewerRating = rating ? rating : 0;
          rev.reviewerComment = comment ? comment : "No comment.";
        }
      });
    } else {
      product.reviews.push(review);
      product.numberOfReviews = product.reviews.length;
    }
    await product.save({ validateBeforeSave: false }); // Saving the review of the user in the database
    let totalNumberOfRating = 0;
    product.reviews.forEach((rev) => {
      totalNumberOfRating += rev?.reviewerRating;
    });
    // Calculating average rating of the Product
    product.rating = totalNumberOfRating / product.reviews.length;
    await product.save({ validateBeforeSave: false }); // Saving the average rating of the Product in database
    const updatedProduct = await Product.findById(product._id).select(
      "-productImages"
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          updatedProduct,
          "Product reviews have been updated accordingly!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Get all reviews of a Product
const getProductReviews = asyncHandler(async (req, res) => {
  try {
    const productId = req.params?.id;
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(400, "Product not found!");
    }
    const reviews = product.reviews;
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          reviews,
          "Here are all the reviews for the Product!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Delete review of a User
const deleteReview = asyncHandler(async (req, res) => {
  try {
    const productId = req.query?.productId;
    const reviewId = req.query?.reviewId;
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(400, "Product not found!");
    }
    if (product.reviews.length === 0) {
      throw new ApiError(400, "No reviews available!");
    }
    const newSetOfReviews = product.reviews.filter(
      (rev) => rev?._id?.toString() !== reviewId?.toString()
    );
    let totalNumberOfRating = 0;
    newSetOfReviews.forEach((rev) => {
      totalNumberOfRating += rev?.rating;
    });
    let rating = 0;
    if (newSetOfReviews.length === 0) {
      rating = 0;
    } else {
      rating = totalNumberOfRating / newSetOfReviews.length; // Calculating new average rating of the Product after filtering out the product.reviews array
    }
    const numberOfReviews = newSetOfReviews.length;
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      {
        $set: {
          rating,
          numberOfReviews,
          reviews: newSetOfReviews,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-productImages");
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          updatedProduct,
          "Specified review associated with the Product has been deleted!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Delete Existing Product (Admin)
const deleteExistingProduct = asyncHandler(async (req, res) => {
  try {
    const existingProduct = await Product.findById(req.params?.id);
    if (!existingProduct) {
      throw new ApiError(404, "Product not found!");
      // return next(new ApiError(404, "Product not found"));
      // return res.status(400).json(new ApiError(404, "Product not found"));
    }
    const existingProductImages = existingProduct.productImages;
    let productImagesOnCloudinaryToBeDeleted = [];
    if (existingProductImages.length !== 0) {
      for (let i = 0; i < existingProductImages.length; i++) {
        productImagesOnCloudinaryToBeDeleted.push(
          existingProductImages[i]?.public_id
        );
      }
    }
    if (productImagesOnCloudinaryToBeDeleted.length === 0) {
      throw new ApiError(400, "No Product images exist!");
    }
    await Product.findByIdAndDelete(existingProduct._id)
      .then((data) => {
        console.log(
          `Product with Product id: '${data._id}' and Product Title: '${data.productTitle}' has been deleted!`
        );
      })
      .catch((error) => {
        console.log(error);
      });
    for (let i = 0; i < productImagesOnCloudinaryToBeDeleted.length; i++) {
      await deleteFromCloudinary(productImagesOnCloudinaryToBeDeleted[i]);
    }
    return res
      .status(200)
      .json(new ApiResponse(201, {}, "Product has been deleted successfully!"));
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Get a single product with specified id
const getSingleProduct = asyncHandler(async (req, res, next) => {
  try {
    // console.log(req.params);
    let singleProduct = await Product.findById(req.params?.id);

    if (!singleProduct) {
      throw new ApiError(404, "Product not found!");
      // return next(new ApiError(404, "Product not found"));
      // return res.status(400).json(new ApiError(404, "Product not found"));
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          singleProduct,
          "Here is the Product requested by you!"
        )
      );
  } catch (error) {
    // console.log(error.name);
    return res.status(400).json({ error, message: error.message });
  }
});

// Get all Products
const getAllProducts = asyncHandler(async (req, res, next) => {
  try {
    const resultPerPage = 8;
    const productsCount = await Product.countDocuments();
    const apiFeature = new ApiFeatures(Product.find(), req.query)
      .search()
      .filter();
    let products = await apiFeature.query.clone();
    let filteredProductsCount = products.length;
    apiFeature.pagination(resultPerPage);
    // const allProducts = await Product.find();
    products = await apiFeature.query;
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          { products, productsCount, resultPerPage, filteredProductsCount },
          "All Products fetched!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Get all Products (Admin)
const getAllProductsAdmin = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find().populate(
      "productCreatedByWhom",
      "email fullName"
    );
    if (!products) {
      throw new ApiError(400, "No Products found in Database!");
    }
    return res
      .status(200)
      .json(new ApiResponse(201, products, "Here are all the Products!"));
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

export {
  getAllProducts,
  getSingleProduct,
  createNewProduct,
  updateExistingProductDetails,
  updateExistingProductImages,
  createOrUpdateReview,
  getProductReviews,
  deleteReview,
  deleteExistingProduct,
  testFunction,
  getAllProductsAdmin,
};
