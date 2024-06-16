import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new mongoose.Schema(
  {
    productTitle: {
      type: String,
      required: [true, "Please Enter Product Title"],
      trim: true,
    },
    productDescription: {
      type: String,
      required: [true, "Please Enter Product Description"],
    },
    productImages: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    price: {
      type: Number,
      required: [true, "Please Enter Product Price"],
      maxlength: [8, "Price cannot exceed 8 characters"],
      //   default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, "Please Enter Product Category"],
      maxlength: [4, "Stock cannot exceed 4 characters"],
      default: 1,
    },
    category: {
      type: String,
      required: [true, "Please Enter Product Category"],
    },
    numberOfReviews: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reviewerName: {
          type: String,
          required: true,
        },
        reviewerRating: {
          type: Number,
          enum: [0, 1, 2, 3, 4, 5],
          required: true,
        },
        reviewerComment: {
          type: String,
          required: true,
        },
      },
    ],
    productCreatedByWhom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.plugin(mongooseAggregatePaginate);

export const Product = mongoose.model("Product", productSchema);
