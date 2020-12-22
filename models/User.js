const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const bcrypt = require("bcrypt");

const containsValidChars = (string) => /^\w+$/.test(string);

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    minlength: [4, "Username must be at least 4 characters"],
    maxlength: [20, "Username must be less than 20 characters"],
    validate: {
      validator: containsValidChars,
      message:
        "Username can only contain English letters, numbers or underscores",
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [4, "Password must be at least 4 characters"],
    maxlength: [30, "Password must be less than 30 characters"],
    validate: {
      validator: containsValidChars,
      message:
        "Password can only contain English letters, numbers or underscores",
    },
  },
  joinDate: {
    type: Date,
    required: [true, "Date of joining is required"],
  },
  firstName: {
    type: String,
    required: [true, "First name is required"],
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
  },
  fullName: {
    type: String,
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
userSchema.plugin(uniqueValidator, { message: "Username is already taken" });

// Hash password
userSchema.pre("save", async function (next) {
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

// Capitalize names and set full name before saving
userSchema.pre("save", function () {
  const user = this;
  user.firstName =
    user.firstName.charAt(0).toUpperCase() +
    user.firstName.slice(1).toLowerCase();
  user.lastName =
    user.lastName.charAt(0).toUpperCase() +
    user.lastName.slice(1).toLowerCase();
  user.fullName = user.firstName + " " + user.lastName;
});

// Add passwordCompare method to User instance
userSchema.methods.comparePassword = function (passwordToTest) {
  return bcrypt.compare(passwordToTest, this.password);
};

// Cleanup JSON response with .toJSON() method
userSchema.set("toJSON", {
  transform: (_document, returnedObj) => {
    returnedObj.id = returnedObj._id.toString();
    delete returnedObj._id;
    delete returnedObj.__v;
    // Remove password
    delete returnedObj.password;
  },
});

module.exports = mongoose.model("User", userSchema);
