const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { SECRET } = require("../utils/config");
const Bookmark = require("../models/Bookmark");
const User = require("../models/User");

// Read many
router.get("/", async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: ["username", "fullName"],
      });

    return res.json(bookmarks.map((b) => b.toJSON()));
  } catch (err) {
    next(err);
  }
});

// Read one
router.get("/:id", async (req, res, next) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id).populate({
      path: "user",
      select: ["username", "fullName"],
    });

    if (!bookmark) {
      return next({ name: "NotFoundError" });
    }

    return res.json(bookmark.toJSON());
  } catch (err) {
    next(err);
  }
});

// Create one
router.post("/", async (req, res, next) => {
  const { title, url, description, token } = req.body;

  try {
    const decodedToken = jwt.verify(token, SECRET);

    if (!token || !decodedToken.id) {
      return next({ name: "JsonWebTokenError" });
    }

    // If the user doesn't exist anymore mongoose will not validate
    // on Bookmark.create()

    const savedBookmark = await Bookmark.create({
      title,
      url,
      description,
      user: decodedToken.id,
    });

    // Add new bookmark to user's bookmarks list
    await User.findByIdAndUpdate(decodedToken.id, {
      $push: { bookmarks: savedBookmark._id },
    });

    await savedBookmark
      .populate({
        path: "user",
        select: ["username", "fullName"],
      })
      .execPopulate();

    return res.status(201).json(savedBookmark.toJSON());
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

    const bookmarkToRemove = await Bookmark.findById(req.params.id);

    if (!bookmarkToRemove) {
      return next({ name: "NotFoundError" });
    }

    const belongsToUser = bookmarkToRemove.user.toString() === decodedToken.id;

    if (!belongsToUser) {
      return next({ name: "ForbiddenError" });
    }

    // Delete bookmark
    await bookmarkToRemove.remove();

    // Remove bookmark from user's list of bookmarks
    await User.findByIdAndUpdate(decodedToken.id, {
      $pull: { bookmarks: bookmarkToRemove._id },
    });

    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Update one

// - toggle like
router.put("/:id/toggleLike", async (req, res, next) => {
  const { token } = req.body;

  try {
    const decodedToken = jwt.verify(token, SECRET);

    if (!token || !decodedToken.id) {
      return next({ name: "JsonWebTokenError" });
    }

    const bookmarkToUpdate = await Bookmark.findById(req.params.id);

    if (!bookmarkToUpdate) {
      return next({ name: "NotFoundError" });
    }

    let updatedBookmark;

    // If the user hasn't already liked the bookmark
    if (!bookmarkToUpdate.likes.includes(decodedToken.id)) {
      // Add like
      bookmarkToUpdate.likes.push(decodedToken.id);
      bookmarkToUpdate.likesCount++;
      updatedBookmark = await bookmarkToUpdate.save();
    } else {
      // Remove like
      bookmarkToUpdate.likes = bookmarkToUpdate.likes.filter(
        (id) => id.toString() !== decodedToken.id
      );
      bookmarkToUpdate.likesCount--;
      updatedBookmark = await bookmarkToUpdate.save();
    }

    await updatedBookmark
      .populate({
        path: "user",
        select: ["username", "fullName"],
      })
      .execPopulate();

    return res.status(200).json(updatedBookmark.toJSON());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
