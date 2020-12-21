const mongoose = require("mongoose");

const config = require("./config");

function connect() {
  console.log("Connecting to MongoDB...");

  mongoose
    .connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB:", err.message);
    });
}

function disconnect() {
  mongoose.connection.close();
}

module.exports = { connect, disconnect };
