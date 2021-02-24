const morgan = require("morgan");

function tokenExtractor(req, res, next) {
  if (
    req.headers.authorization &&
    req.headers.authorization.toLowerCase().startsWith("bearer ")
  ) {
    // Extract the token itself, omit the initial 'bearer '
    const token = req.headers.authorization.split(" ")[1];
    req.body.token = token;
  } else {
    req.body.token = null;
  }

  next();
}

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
    return res.status(401).json({ error: "Token is missing or invalid" });
  }

  case "ForbiddenError": {
    return res
      .status(403)
      .json({ error: "Missing permission for modifying this resource" });
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
  tokenExtractor,
  errorHandler,
  unknownEndpoint,
  logger,
};
