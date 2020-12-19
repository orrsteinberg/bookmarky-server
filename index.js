const app = require("./app");
const config = require("./utils/config");
const db = require("./utils/db");

app.listen(config.PORT, () => {
  console.log("Server running on port", config.PORT);
  db.connect();
});
