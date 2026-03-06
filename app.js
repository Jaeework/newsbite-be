require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const indexRouter = require("./src/routes/index");
const errorHandler = require("./src/utils/errorHandler");
const scheduler = require("./src/utils/scheduler");

const app = express();

scheduler();
connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", indexRouter);
app.use(errorHandler);

module.exports = app;
