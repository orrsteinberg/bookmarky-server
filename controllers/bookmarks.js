const router = require("express").Router();
const Bookmark = require("../models/Bookmark");

// Read many
router.get("/", async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({});
    return res.json(bookmarks.map((b) => b.toJSON()));
  } catch (err) {
    next(err);
  }
});

// Read one
router.get("/:id", async (req, res, next) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id);
    if (!bookmark) {
      return next({
        name: "NotFoundError",
      });
    }
    return res.json(bookmark.toJSON());
  } catch (err) {
    next(err);
  }
});

// Create one
router.post("/", async (req, res, next) => {
  const { title, url, description, date } = req.body;
  try {
    const newBookmark = await Bookmark.create({
      title,
      url,
      description,
      date,
    });

    return res.status(201).json(newBookmark.toJSON());
  } catch (err) {
    next(err);
  }
});

// Delete one
router.delete("/:id", async (req, res, next) => {
  try {
    const deletedBookmark = await Bookmark.findByIdAndRemove(req.params.id);
    if (!deletedBookmark) {
      return next({
        name: "NotFoundError",
      });
    }
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Update one -- TODO

// - toggle like
router.put("/:id/like", async (req, res, next) => {
  return res.send(`Add like to ${req.params.id}`);
});

// - edit bookmark
router.put("/:id/like", async (req, res, next) => {
  return res.send(`Remove like from ${req.params.id}`);
});

module.exports = router;
