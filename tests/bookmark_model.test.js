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
  test("should throw error with missing title", async () => {
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

    expect(error.errors["title"].message).toEqual("Title is required");
  });

  test("should throw correct error with invalid title", async () => {
    let error;

    try {
      // Less than 5 chars
      const bookmarkShortTitle = new Bookmark({
        ...dummyBookmark,
        title: "Short",
      });

      await bookmarkShortTitle.validate();
    } catch (err) {
      error = err;
    }

    expect(error.errors["title"].message).toEqual(
      "Bookmark title must be at least 10 characters"
    );

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

    expect(error.errors["title"].message).toEqual(
      "Bookmark title must be less than 120 characters"
    );
  });

  test("should trim and capitalize title", async () => {
    const bookmark = new Bookmark({
      ...dummyBookmark,
      title: "      test title  ",
    });

    const savedBookmark = await bookmark.save();
    expect(savedBookmark.title).toEqual("Test title");
  });

  test("should throw error with missing URL", async () => {
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

    expect(error.errors["url"].message).toEqual("URL is required");
  });

  test("should throw correct error with invalid URL", async () => {
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

    expect(error.errors["url"].message).toEqual("Invalid URL: " + invalidUrl);
  });

  test("should not require description", async () => {
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

  test("should throw correct error with invalid description", async () => {
    let error;

    try {
      // More than 2000 chars
      const bookmarkInvalidUrl = new Bookmark({
        ...dummyBookmark,
        description: "Very long description" + Array(2000).fill("."),
      });

      await bookmarkInvalidUrl.validate();
    } catch (err) {
      error = err;
    }

    expect(error.errors["description"].message).toEqual(
      "Bookmark description must be less than 2000 characters"
    );
  });
  test("should throw error with missing date", async () => {
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

    expect(error.errors["date"].message).toEqual("Date is required");
  });

  test("should initialize with 0 likes", async () => {
    let savedBookmark = await Bookmark.create({
      ...dummyBookmark,
    });

    expect(savedBookmark.likesCount).toBe(0);
  });

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

afterAll(() => {
  db.disconnect();
});
