const morgan = require("morgan");

function errorHandler(error, req, res, next) {
  switch (error.name) {
  case "ValidationError": {
    // If there are multiple validation errors...
    if (error.errors) {
      // Return error object with paths as keys and their messages as values
      const errorMessages = Object.values(error.errors).reduce((obj, e) => {
        return {
          ...obj,
          [e.path]: e.message,
        };
      }, {});
      return res.status(400).json({ error: errorMessages });
    }
    // Otherwise return single error message
    return res.status(400).json({ error: error.message });
  }

  case "CastError": {
    // If there are multiple validation errors...
    if (error.errors) {
      // Return error object with paths as keys and their messages as values
      const errorMessages = Object.values(error.errors).reduce((obj, e) => {
        return {
          ...obj,
          [e.path]: e.message,
        };
      }, {});
      return res.status(400).json({ error: errorMessages });
    }
    // Otherwise return single error message
    return res.status(400).json({ error: error.message });
  }

  case "NotFoundError": {
    return res.status(404).json({ error: "Not found" });
  }

  case "UnauthorizedError": {
    return res.status(401).json({ error: error.message });
  }

  case "JsonWebTokenError": {
    return res.status(400).json({ error: "Invalid token" });
  }

  default: {
    return res.status(error.status).json({ error: error.message });
  }
  }
}

function unknownEndpoint(req, res) {
  res.status(404).send({ error: "Unknown endpoint" });
}

function logger() {
  morgan.token("body", (req) => JSON.stringify(req.body));
  return morgan(
    ":method :url :status :res[content-length] - :response-time ms :body"
  );
}

module.exports = {
  errorHandler,
  unknownEndpoint,
  logger,
};
