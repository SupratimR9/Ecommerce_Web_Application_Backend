import dotenv from "dotenv";
import connectDB from "./db/databaseConnection.js";
import app from "./app.js";

dotenv.config({
  path: "backend/config/config.env",
});

// let server;
// server = app.listen();

// Handling Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`\nShutting down the server due to Uncaught Exception !!!`);
  process.exit(1);
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

// console.log(youtube);

// // Unhandled Promise Rejection
// process.on("unhandledRejection", (err) => {
//   console.log(`Error: ${err.message}`);
//   console.log(`Shutting down the server due to Unhandled Promise Rejection`);
//   server.close(() => {
//     process.exit(1);
//   });
// });
