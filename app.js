const express = require("express");
const cors = require("cors");

const {
  logger,
  tokenExtractor,
  errorHandler,
  unknownEndpoint,
} = require("./utils/middleware");
const bookmarksRouter = require("./controllers/bookmarks");
const usersRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger());
app.use(tokenExtractor);

// Routes
app.use("/api/bookmarks", bookmarksRouter);
app.use("/api/users", usersRouter);
app.use("/api/login", loginRouter);

app.use(errorHandler);
app.use(unknownEndpoint);

module.exports = app;
