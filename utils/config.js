require("dotenv").config();

const PORT = process.env.PORT;
const SECRET = process.env.SECRET;

let MONGODB_URI;

if (process.env.NODE_ENV === "test") {
  MONGODB_URI = process.env.TEST_MONGODB_URI;
} else {
  MONGODB_URI = process.env.MONGODB_URI;
}

module.exports = { PORT, MONGODB_URI, SECRET };
