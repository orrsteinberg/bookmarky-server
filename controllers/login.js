const router = require("express").Router();
const jwt = require("jsonwebtoken");

const { SECRET } = require("../utils/config");
const User = require("../models/User");

router.post("/", async (req, res, next) => {
  const { body } = req;

  const user = await User.findOne({ username: body.username });

  const correctPassword = !user
    ? false
    : await user.comparePassword(body.password);

  if (!user || !correctPassword) {
    return next({
      name: "UnauthorizedError",
      message: "Invalid username or password",
    });
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  };

  const token = jwt.sign(userForToken, SECRET);

  res
    .status(200)
    .json({ token, username: user.username, fullName: user.fullName });
});

module.exports = router;
