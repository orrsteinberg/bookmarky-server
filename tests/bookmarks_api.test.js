const supertest = require("supertest");

const app = require("../app");
const db = require("../utils/db");
const Bookmark = require("../models/Bookmark");

const api = supertest(app);

const BASE_URL = "/api/bookmarks";

const initialBookmarks = [
  {
    title: "Test title",
    url: "https://www.test.com",
    description: "Test description",
    date: new Date().toISOString(),
  },
  {
    title: "Another test title",
    url: "https://www.test.com",
    description: "Another description",
    date: new Date().toISOString(),
  },
];

const newBookmark = {
  title: "New bookmark",
  url: "https://www.test.com",
  description: "Bookmark description",
  date: new Date().toISOString(),
};

beforeAll(() => {
  db.connect();
});

beforeEach(async () => {
  await Bookmark.deleteMany({});
  await Promise.all(initialBookmarks.map((b) => Bookmark.create(b)));
});

describe("Bookmarks", () => {
  test("are returned in JSON format", async () => {
    const response = await api
      .get(BASE_URL)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].id).toBeDefined();
    expect(response.body[0]._id).not.toBeDefined();
  });

  test("can be viewed individually", async () => {
    const request = await api.get(BASE_URL);
    const bookmarkId = request.body[0].id;

    const { body: exisitngBookmark } = await api
      .get(`${BASE_URL}/${bookmarkId}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(exisitngBookmark.title).toEqual(request.body[0].title);
  });

  test("return 404 error when id not found", async () => {
    const nonExistingButValidId = "5fde640d1f70ec0a85b6296b";
    const response = await api
      .get(`${BASE_URL}/${nonExistingButValidId}`)
      .expect(404);

    expect(response.body.error).toEqual("Not found");
  });

  test("return 400 status code and error when param id is invalid", async () => {
    const response = await api.get(`${BASE_URL}/${123}`).expect(400);

    expect(response.body.error).toBeDefined();
  });

  test("can be created successfully", async () => {
    const { body: savedBookmark } = await api
      .post(BASE_URL)
      .send(newBookmark)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const { body: bookmarksAtEnd } = await api.get(BASE_URL);

    expect(savedBookmark.title).toEqual(newBookmark.title);
    expect(bookmarksAtEnd).toHaveLength(initialBookmarks.length + 1);
  });

  test("creating a bookmark fails with invalid data", async () => {
    const response = await api
      .post(BASE_URL)
      .send({
        ...newBookmark,
        title: "123",
        date: undefined,
        url: "www.what",
      })
      .expect(400);

    const { body: bookmarksAtEnd } = await api.get(BASE_URL);

    expect(response.body.error).toBeDefined();
    expect(bookmarksAtEnd).toHaveLength(initialBookmarks.length);
  });

  test("can be deleted successfully", async () => {
    const { body: bookmarksAtStart } = await api.get(BASE_URL);
    const bookmarkId = bookmarksAtStart[0].id;

    await api.delete(`${BASE_URL}/${bookmarkId}`).expect(204);

    const { body: bookmarksAtEnd } = await api.get(BASE_URL);

    expect(bookmarksAtEnd).toHaveLength(bookmarksAtStart.length - 1);
    expect(bookmarksAtEnd[0].id).not.toEqual(bookmarksAtStart[0].id);
  });
});

afterAll(() => {
  db.disconnect();
});
