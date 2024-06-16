// import { ApiError } from "../utils/apiError.js";

// export default (err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.message = err.message || "Internal Server Error";

//   res.status(err.statusCode).json({
//     success: false,
//     error: err,
//   });
// };

// Errors yet to handle: -
// CastError -- Handled (using try catch in product.controller.js)
// ValidationError -- Handled (using try catch in product.controller.js)
// MongoParseError -- Handled (using process.exit(1) in databaseConnection.js)

// Rough: -
// let a=10, b=20;
// let obj = {a, b};
// console.log(obj); // { a: 10, b: 20 }
// const {a:x, b:y} = obj;
// console.log(y); // 20
// console.log(x); // 10
