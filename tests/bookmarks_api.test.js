const supertest = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../utils/db");
const { SECRET } = require("../utils/config");
const Bookmark = require("../models/Bookmark");
const User = require("../models/User");

const api = supertest(app);

// Helpers
const BASE_URL = "/api/bookmarks";
let authorizedToken;
let unauthorizedToken;

const initialUsers = [
  {
    username: "testuser1",
    password: "secret",
    firstName: "john",
    lastName: "doe",
    joinDate: new Date().toISOString(),
  },
  {
    username: "testuser2",
    password: "verysecret",
    firstName: "jane",
    lastName: "doe",
    joinDate: new Date().toISOString(),
  },
];

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
  // Clear DB
  await Bookmark.deleteMany({});
  await User.deleteMany({});

  // Create users
  const users = await Promise.all(initialUsers.map((u) => User.create(u)));

  const userWithBookmarks = {
    id: users[0]._id.toString(),
    username: users[0].username,
  };

  const userWithoutBookmarks = {
    id: users[1]._id.toString(),
    username: users[1].username,
  };

  authorizedToken = jwt.sign(userWithBookmarks, SECRET);
  unauthorizedToken = jwt.sign(userWithoutBookmarks, SECRET);

  // Create bookmarks and assign them all to userWithBookmarks
  await Promise.all(
    initialBookmarks.map((bookmark) =>
      Bookmark.create({
        ...bookmark,
        user: userWithBookmarks.id,
      })
    )
  );
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

    expect(exisitngBookmark.title).toBe(request.body[0].title);
  });

  test("return 404 error when id not found", async () => {
    const nonExistingButValidId = "5fde640d1f70ec0a85b6296b";
    const response = await api
      .get(`${BASE_URL}/${nonExistingButValidId}`)
      .expect(404);

    expect(response.body.error).toBe("Not found");
  });

  test("return 400 status code and error when param id is invalid", async () => {
    const response = await api.get(`${BASE_URL}/${123}`).expect(400);

    expect(response.body.error).toBeDefined();
  });

  test("can be created with authorized token", async () => {
    const response = await api
      .post(BASE_URL)
      .send(newBookmark)
      .set("Authorization", `Bearer ${authorizedToken}`)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const { body: bookmarksAtEnd } = await api.get(BASE_URL);

    expect(response.body.error).not.toBeDefined();
    expect(response.body.title).toBe(newBookmark.title);
    expect(bookmarksAtEnd).toHaveLength(initialBookmarks.length + 1);
  });

  test("creating a bookmark fails (401) with unauthorized token", async () => {
    const response = await api
      .post(BASE_URL)
      .send(newBookmark)
      .expect(401)
      .expect("Content-Type", /application\/json/);

    expect(response.body.error).toBe("Token is missing or invalid");
  });

  test("creating a bookmark fails (400) with invalid data", async () => {
    const response = await api
      .post(BASE_URL)
      .send({
        ...newBookmark,
        title: "123",
        date: undefined,
        url: "www.what",
      })
      .set("Authorization", `Bearer ${authorizedToken}`)
      .expect(400);

    const { body: bookmarksAtEnd } = await api.get(BASE_URL);

    expect(response.body.error).toBeDefined();
    expect(bookmarksAtEnd).toHaveLength(initialBookmarks.length);
  });

  test("can be deleted with authorized token", async () => {
    const { body: bookmarksAtStart } = await api.get(BASE_URL);
    const bookmarkId = bookmarksAtStart[0].id;

    await api
      .delete(`${BASE_URL}/${bookmarkId}`)
      .set("Authorization", `Bearer ${authorizedToken}`)
      .expect(204);

    const { body: bookmarksAtEnd } = await api.get(BASE_URL);

    expect(bookmarksAtEnd).toHaveLength(bookmarksAtStart.length - 1);
    expect(bookmarksAtEnd[0].id).not.toBe(bookmarksAtStart[0].id);
  });

  test("fails to be deleted (401) without a token", async () => {
    const { body: bookmarksAtStart } = await api.get(BASE_URL);
    const bookmarkId = bookmarksAtStart[0].id;

    await api.delete(`${BASE_URL}/${bookmarkId}`).expect(401);

    const { body: bookmarksAtEnd } = await api.get(BASE_URL);

    expect(bookmarksAtEnd).toHaveLength(bookmarksAtStart.length);
  });

  test("fails to be deleted (403) with wrong token", async () => {
    const { body: bookmarksAtStart } = await api.get(BASE_URL);
    const bookmarkId = bookmarksAtStart[0].id;

    await api
      .delete(`${BASE_URL}/${bookmarkId}`)
      .set("Authorization", `Bearer ${unauthorizedToken}`)
      .expect(403);

    const { body: bookmarksAtEnd } = await api.get(BASE_URL);

    expect(bookmarksAtEnd).toHaveLength(bookmarksAtStart.length);
  });

  test("likes can be toggled with authorized token", async () => {
    const { body: bookmarksAtStart } = await api.get(BASE_URL);
    const bookmarkId = bookmarksAtStart[0].id;
    const decodedToken = jwt.verify(authorizedToken, SECRET);

    let response;

    // Add like
    response = await api
      .put(`${BASE_URL}/${bookmarkId}/toggleLike`)
      .send(newBookmark)
      .set("Authorization", `Bearer ${authorizedToken}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body.error).not.toBeDefined();
    expect(response.body.likesCount).toBe(1);
    expect(response.body.likes).toContain(decodedToken.id);

    // Remove like
    response = await api
      .put(`${BASE_URL}/${bookmarkId}/toggleLike`)
      .send(newBookmark)
      .set("Authorization", `Bearer ${authorizedToken}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body.error).not.toBeDefined();
    expect(response.body.likesCount).toBe(0);
    expect(response.body.likes).not.toContain(decodedToken.id);
  });

  test("liking a bookmark fails (401) with unauthorized token", async () => {
    const response = await api
      .post(BASE_URL)
      .send(newBookmark)
      .expect(401)
      .expect("Content-Type", /application\/json/);

    expect(response.body.error).toBe("Token is missing or invalid");
  });
});

afterAll(() => {
  db.disconnect();
});
