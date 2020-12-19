const morgan = require("morgan");

function unknownEndpoint(req, res) {
  res.status(404).json({ error: "Unknown endpoint" }).end();
}

function logger() {
  morgan.token("body", (req) => JSON.stringify(req.body));
  return morgan(
    ":method :url :status :res[content-length] - :response-time ms :body"
  );
}

module.exports = {
  unknownEndpoint,
  logger,
};
