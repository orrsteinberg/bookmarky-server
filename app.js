const express = require("express");
const cors = require("cors");
const { logger, unknownEndpoint } = require("./utils/middleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger());

// Routes
// ...

app.use("/ping", (req, res) => res.send("Pong!"));

// Handle unknown endpoints
app.use(unknownEndpoint);

module.exports = app;
