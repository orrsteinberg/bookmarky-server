const db = require("../utils/db");
const User = require("../models/User");

const dummyUser = {
  username: "testuser",
  password: "secret",
  firstName: "john",
  lastName: "doe",
};

beforeAll(async () => {
  db.connect();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe("User model validation", () => {
  describe("Username", () => {
    test("is required", async () => {
      let error;

      try {
        const user = new User({
          ...dummyUser,
          username: undefined,
        });
        await user.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["username"].message).toBe("Username is required");
    });

    test("must be at least 4 characters", async () => {
      let error;

      try {
        // Less than 4 chars
        const userShortUsername = new User({
          ...dummyUser,
          username: "0",
        });

        await userShortUsername.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["username"].message).toBe(
        "Username must be at least 4 characters"
      );
    });

    test("must be less than 20 characters", async () => {
      let error;
      try {
        // More than 20 chars
        const userLongUsername = new User({
          ...dummyUser,
          username: "A very long username" + Array(20).fill(".").join(""),
        });
        await userLongUsername.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["username"].message).toBe(
        "Username must be less than 20 characters"
      );
    });

    test("must contain only valid characters", async () => {
      let error;

      try {
        // Invalid characters
        const userLongUsername = new User({
          ...dummyUser,
          username: "%&^@#Hey",
        });
        await userLongUsername.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["username"].message).toBe(
        "Username can only contain English letters, numbers or underscores"
      );
    });

    test("must be unique", async () => {
      let error;
      let firstUser;
      let secondUser;

      try {
        firstUser = await User.create(dummyUser);
        secondUser = await User.create(dummyUser);
      } catch (err) {
        error = err;
      }

      expect(firstUser).toBeDefined();
      expect(secondUser).not.toBeDefined();
      expect(error.errors["username"].message).toBe(
        "Username is already taken"
      );
    });
  });

  describe("password", () => {
    test("is required", async () => {
      let error;

      try {
        const user = new User({
          ...dummyUser,
          password: undefined,
        });
        await user.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["password"].message).toBe("Password is required");
    });

    test("must be at least 4 characters", async () => {
      let error;

      try {
        // Less than 4 chars
        const userShortPassword = new User({
          ...dummyUser,
          password: "0",
        });

        await userShortPassword.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["password"].message).toBe(
        "Password must be at least 4 characters"
      );
    });

    test("must be less than 30 characters", async () => {
      let error;
      try {
        // More than 30 chars
        const userLongPassword = new User({
          ...dummyUser,
          password: "A very long password" + Array(30).fill(".").join(""),
        });
        await userLongPassword.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["password"].message).toBe(
        "Password must be less than 30 characters"
      );
    });

    test("must contain only valid characters", async () => {
      let error;

      try {
        // Invalid characters
        const userLongPassword = new User({
          ...dummyUser,
          password: "%&^@#Hey",
        });
        await userLongPassword.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["password"].message).toBe(
        "Password can only contain English letters, numbers or underscores"
      );
    });
  });

  describe("first and last names", () => {
    test("are required", async () => {
      let error;

      try {
        const user = new User({
          ...dummyUser,
          firstName: undefined,
          lastName: undefined,
        });
        await user.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["firstName"].message).toBe("First name is required");
      expect(error.errors["lastName"].message).toBe("Last name is required");
    });
  });

  describe("on save", () => {
    test("names are capiatlized and joined to virtual full name attribute", async () => {
      const newUser = await User.create(dummyUser);
      expect(newUser.firstName).toBe("John");
      expect(newUser.lastName).toBe("Doe");
      expect(newUser.fullName).toBe("John Doe");
    });

    test("should have a valid createdAt property", async () => {
      const newUser = await User.create(dummyUser);

      expect(new Date(newUser.createdAt)).toBeDefined();
    });
  });

  describe("after save", () => {
    test("password is hashed", async () => {
      const newUser = await User.create(dummyUser);

      expect(newUser.password).not.toBe(dummyUser.password);
    });

    test("has a working comparePassword method", async () => {
      const newUser = await User.create(dummyUser);
      expect(newUser.comparePassword).toBeDefined();

      // With correct password
      let isCorrectPassword = await newUser.comparePassword(dummyUser.password);
      expect(isCorrectPassword).toBe(true);

      // With incorrect password
      isCorrectPassword = await newUser.comparePassword("wrong_password");
      expect(isCorrectPassword).toBe(false);
    });

    test("password is hidden with the toJSON method", async () => {
      let savedUser = await User.create({
        ...dummyUser,
      });
      savedUser = savedUser.toJSON();

      expect(savedUser.id).toBeDefined();
      expect(savedUser._id).not.toBeDefined();
      expect(savedUser.__v).not.toBeDefined();
      // Password is hidden
      expect(savedUser.password).not.toBeDefined();
    });
  });
});

afterAll(() => {
  db.disconnect();
});
