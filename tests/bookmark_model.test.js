const db = require("../utils/db");
const Bookmark = require("../models/Bookmark");

const dummyBookmark = {
  title: "Test title",
  url: "https://www.test.com",
  description: "Test description",
  date: new Date().toISOString(),
};

beforeAll(async () => {
  db.connect();
  await Bookmark.deleteMany({});
});

describe("Bookmark model validation", () => {
  describe("Title", () => {
    test("is requried", async () => {
      let error;

      try {
        const bookmark = new Bookmark({
          ...dummyBookmark,
          title: undefined,
        });
        await bookmark.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["title"].message).toBe("Title is required");
    });

    test("must be less than 120 characters", async () => {
      let error;

      try {
        // More than 120 chars
        const bookmarkLongTitle = new Bookmark({
          ...dummyBookmark,
          title: "A very long title" + Array(120).fill(".").join(""),
        });
        await bookmarkLongTitle.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["title"].message).toBe(
        "Bookmark title must be less than 120 characters"
      );
    });

    test("is trimmed and capitalized", async () => {
      const bookmark = new Bookmark({
        ...dummyBookmark,
        title: "      test title  ",
      });

      const savedBookmark = await bookmark.save();
      expect(savedBookmark.title).toBe("Test title");
    });
  });

  describe("URL", () => {
    test("is required", async () => {
      let error;

      try {
        const bookmark = new Bookmark({
          ...dummyBookmark,
          url: undefined,
        });
        await bookmark.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["url"].message).toBe("URL is required");
    });

    test("must be a valid URL", async () => {
      let error;
      const invalidUrl = "www.invalid";

      try {
        // Less than 5 chars
        const bookmarkInvalidUrl = new Bookmark({
          ...dummyBookmark,
          url: invalidUrl,
        });

        await bookmarkInvalidUrl.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["url"].message).toBe("Invalid URL: " + invalidUrl);
    });
  });

  describe("Description", () => {
    test("is not required", async () => {
      let error;

      try {
        const bookmark = new Bookmark({
          ...dummyBookmark,
          description: undefined,
        });
        await bookmark.validate();
      } catch (err) {
        error = err;
      }

      expect(error).not.toBeDefined();
    });

    test("must be less than 2000 characters", async () => {
      let error;

      try {
        // More than 2000 chars
        const bookmarkInvalidUrl = new Bookmark({
          ...dummyBookmark,
          description: "Very long description" + Array(2000).fill(".").join(""),
        });

        await bookmarkInvalidUrl.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["description"].message).toBe(
        "Bookmark description must be less than 2000 characters"
      );
    });
  });

  describe("date", () => {
    test("is required", async () => {
      let error;

      try {
        const bookmark = new Bookmark({
          ...dummyBookmark,
          date: undefined,
        });
        await bookmark.validate();
      } catch (err) {
        error = err;
      }

      expect(error.errors["date"].message).toBe("Date is required");
    });
  });

  describe("on save", () => {
    test("should initialize with 0 likes", async () => {
      let savedBookmark = await Bookmark.create({
        ...dummyBookmark,
      });

      expect(savedBookmark.likesCount).toBe(0);
    });
  });

  describe("after save", () => {
    test("should return cleaned up JSON object with the toJSON method", async () => {
      let savedBookmark = await Bookmark.create({
        ...dummyBookmark,
      });
      savedBookmark = savedBookmark.toJSON();

      expect(savedBookmark.id).toBeDefined();
      expect(savedBookmark._id).not.toBeDefined();
      expect(savedBookmark.__v).not.toBeDefined();
    });
  });
});

afterAll(() => {
  db.disconnect();
});
