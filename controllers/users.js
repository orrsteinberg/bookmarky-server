const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { SECRET } = require("../utils/config");
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
    const user = await User.findById(req.params.id).populate({
      path: "bookmarks",
      select: ["title", "date", "likesCount"],
    });

    if (!user) {
      return next({ name: "NotFoundError" });
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

    // Send back a token
    const token = jwt.sign(
      {
        id: newUser._id,
        username: newUser.username,
        firstname: newUser.firstName,
      },
      SECRET
    );

    return res.status(201).json({
      ...newUser,
      token,
    });
  } catch (err) {
    next(err);
  }
});

// Delete one
router.delete("/:id", async (req, res, next) => {
  const { token } = req.body;
  try {
    const decodedToken = jwt.verify(token, SECRET);

    if (!token || !decodedToken.id) {
      return next({ name: "JsonWebTokenError" });
    }

    const userToRemove = await User.findById(req.params.id);

    if (!userToRemove) {
      return next({ name: "NotFoundError" });
    }

    const sameUser = userToRemove._id.toString() === decodedToken.id;

    if (!sameUser) {
      return next({ name: "ForbiddenError" });
    }

    await userToRemove.remove();
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Update one
// TODO

module.exports = router;
