import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function updateStock(id, quantity) {
  try {
    const product = await Product.findById(id);
    if (!product) {
      throw new ApiError(400, "Product not found!");
    }
    product.stock -= quantity;
    await product.save({ validateBeforeSave: false });
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
}

// Create new order
const createNewOrder = asyncHandler(async (req, res) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;
    if (shippingInfo) {
      if (
        [
          shippingInfo.address,
          shippingInfo.city,
          shippingInfo.state,
          shippingInfo.country,
          shippingInfo.pincode,
          shippingInfo.phoneNumber,
        ].some((field) => field?.trim() === "")
      ) {
        throw new ApiError(404, "All mandatory fields are required!");
      }
    } else {
      throw new ApiError(400, "Shipping information not provided!");
    }
    // Calculating price of all the items ordered
    let calculatedItemsPrice = 0;
    if (orderItems.length === 0) {
      throw new ApiError(400, "No items have been ordered!");
    } else if (orderItems.length > 0) {
      orderItems.forEach((item) => {
        calculatedItemsPrice += item.productPrice;
      });
    }
    if (paymentInfo) {
      if (!paymentInfo.paymentId || !paymentInfo.paymentStatus) {
        throw new ApiError(400, "Please enter proper payment details!");
      }
    } else {
      throw new ApiError(400, "Payment information not provided!");
    }
    // Calculating Total price to be paid by customer
    let calculatedTotalPrice = 0;
    if (calculatedItemsPrice) {
      calculatedTotalPrice = calculatedItemsPrice + taxPrice + shippingPrice;
    }
    // Creating the order
    const newOrder = await Order.create({
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice: itemsPrice || calculatedItemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice: totalPrice || calculatedTotalPrice,
      paidWhen: Date.now(),
      orderedByWhom: req.user?._id,
    });
    const createdOrder = await Order.findById(newOrder?._id);
    if (!createdOrder) {
      throw new ApiError(500, "Something went wrong while creating the order!");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          createdOrder,
          "Your order has been created sucessfully!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Get single order
const getSingleOrder = asyncHandler(async (req, res) => {
  try {
    const orderId = req.params?.id;
    const order = await Order.findById(orderId).populate(
      "orderedByWhom",
      "fullName email"
    );
    if (!order) {
      throw new ApiError(400, "Order with specified Id not found!");
    }
    return res
      .status(200)
      .json(new ApiResponse(201, order, "Here is the requested order!"));
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Get all orders of currently logged in User
const getMyOrders = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    const myOrders = await Order.find({ orderedByWhom: userId });
    if (!myOrders) {
      throw new ApiError(400, "You do not have any orders!");
    }
    return res
      .status(200)
      .json(new ApiResponse(201, myOrders, "Here are all your orders!"));
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Get all orders (Admin)
const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const allOrders = await Order.find().populate(
      "orderedByWhom",
      "fullName email"
    );
    if (!allOrders) {
      throw new ApiError(400, "No orders found in Database!");
    }
    let totalAmount = 0;
    allOrders.forEach((order) => {
      totalAmount += order.totalPrice;
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          { allOrders, totalAmount },
          "Here are all the orders!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

//Update order status (Admin)
const updateOrder = asyncHandler(async (req, res) => {
  try {
    const orderId = req.params?.id;
    const { status } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(400, "Order with specified Id not found!");
    }
    if (order.orderStatus === "Delivered") {
      throw new ApiError(400, "This order has already been delivered!");
    }
    if (!status) {
      throw new ApiError(400, "Order status is required!");
    }
    if (status === "Shipped") {
      if (order.orderItems.length > 0) {
        order.orderItems.forEach(async (item) => {
          await updateStock(item.product, item.productQuantity);
        });
      }
    }
    order.orderStatus = status;
    if (status === "Delivered") {
      order.deliveredWhen = Date.now();
    }
    await order.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          { order },
          "Order status has been updated successfully!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

// Delete order (Admin)
const deleteOrder = asyncHandler(async (req, res) => {
  try {
    const orderId = req.params?.id;
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(400, "Order with specified Id not found!");
    }
    await Order.findByIdAndDelete(order._id)
      .then((data) => {
        console.log(`Order with Id: ${data._id} has been deleted!`);
      })
      .catch((error) => {
        console.log(error);
      });
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          {},
          "Order with specified Id has been deleted successfully!"
        )
      );
  } catch (error) {
    return res.status(400).json({ error, message: error.message });
  }
});

export {
  createNewOrder,
  getSingleOrder,
  getMyOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
};
