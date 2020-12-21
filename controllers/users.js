const router = require("express").Router();
const User = require("../models/User");

// Read many
router.get("/", async (req, res, next) => {
  try {
    const users = await User.find({});
    return res.json(users.map((u) => u.toJSON()));
  } catch (err) {
    next(err);
  }
});

// Read one
router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next({
        name: "NotFoundError",
      });
    }
    return res.json(user.toJSON());
  } catch (err) {
    next(err);
  }
});

// Create one
router.post("/", async (req, res, next) => {
  const { username, password, firstName, lastName, joinDate } = req.body;

  try {
    // Mongoose takes care of password hashing and validation
    const newUser = await User.create({
      username,
      password,
      firstName,
      lastName,
      joinDate,
    });

    return res.status(201).json(newUser.toJSON());
  } catch (err) {
    next(err);
  }
});

// Delete one
router.delete("/:id", async (req, res, next) => {
  try {
    const deletedUser = await User.findByIdAndRemove(req.params.id);
    if (!deletedUser) {
      return next({
        name: "NotFoundError",
      });
    }
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Update one
// TODO

module.exports = router;
