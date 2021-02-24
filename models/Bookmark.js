const mongoose = require("mongoose");
const User = require("./User");

const bookmarkSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [120, "Bookmark title must be less than 120 characters"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
    validate: {
      validator: async (userId) => {
        // Check that the user exists
        const existingUser = await User.findById(userId);
        return Boolean(existingUser);
      },
      message: "Invalid user ID: user doesn't exist",
    },
  },
  url: {
    type: String,
    required: [true, "URL is required"],
    trim: true,
    validate: {
      validator: (urlString) => {
        return Boolean(new URL(urlString));
      },
    },
  },
  description: {
    type: String,
    maxlength: [2000, "Bookmark description must be less than 2000 characters"],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: {
    // Array of user IDs who liked the bookmark
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  likesCount: {
    type: Number,
    default: 0,
  },
});

// Capitalize title before saving
bookmarkSchema.pre("save", function () {
  this.title = this.title.charAt(0).toUpperCase() + this.title.slice(1);
});

// Cleanup JSON response with .toJSON() method
bookmarkSchema.set("toJSON", {
  transform: (_document, returnedObj) => {
    returnedObj.id = returnedObj._id.toString();
    delete returnedObj._id;
    delete returnedObj.__v;
  },
});

module.exports = mongoose.model("Bookmark", bookmarkSchema);
