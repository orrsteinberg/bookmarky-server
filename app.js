const express = require("express");
const cors = require("cors");
const { logger, errorHandler, unknownEndpoint } = require("./utils/middleware");
const bookmarksRouter = require("./controllers/bookmarks");

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger());

// Routes
app.use("/api/bookmarks", bookmarksRouter);

app.use(errorHandler);
app.use(unknownEndpoint);

module.exports = app;
