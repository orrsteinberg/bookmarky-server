const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const bcrypt = require("bcrypt");

const containsValidChars = (string) => /^\w+$/.test(string);

const userShemca = mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: [true, "Username is already taken"],
    minlength: [4, "Username must be at least 4 characters long"],
    maxlength: [20, "Username must be less than 20 characters long"],
    validate: {
      validator: containsValidChars,
      message:
        "Username can only contain English letters, numbers or underscores",
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    select: false, // Exclude from queries
    minlength: [4, "Password must be at least 4 characters long"],
    maxlength: [30, "Password must be less than 30 characters long"],
    validate: {
      validator: containsValidChars,
      message:
        "Password can only contain English letters, numbers or underscores",
    },
  },
  joinDate: {
    type: Date,
    required: [true, "Date is required"],
  },
  firstName: {
    type: String,
    required: [true, "First name is required"],
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
  },
  bookmarks: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bookmark",
      },
    ],
  },
});

// Unique validation for username
userShemca.plugin(uniqueValidator);

// Hash password
userShemca.pre("save", async function (next) {
  const user = this;
  const saltRounds = 10;

  try {
    const passwordHash = await bcrypt.hash(user.password, saltRounds);
    user.password = passwordHash;
  } catch (err) {
    return next(err);
  }
  next();
});

// Capitalize names and add full name before saving
userShemca.pre("save", function () {
  const user = this;
  user.firstName =
    user.firstName.charAt(0).toUpperCase() +
    user.firstName.slice(1).toLowerCase();
  user.lastName =
    user.firstName.charAt(0).toUpperCase() +
    user.firstName.slice(1).toLowerCase();
  user.fullName = user.firstName + " " + user.lastName;
});

// Add passwordCompare method to User instance
userShemca.methods.comparePassword = function (passwordToTest) {
  bcrypt.compare(passwordToTest, this.password, (err, res) => {
    if (err) throw err;
    return res; // True or false
  });
};

// Cleanup JSON response with .toJSON() method
userShemca.set("toJSON", {
  transform: (_document, returnedObj) => {
    returnedObj.id = returnedObj._id.toString();
    delete returnedObj._id;
    delete returnedObj.__v;
  },
});

module.exports = mongoose.model("User", userShemca);
