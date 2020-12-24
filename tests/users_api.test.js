const supertest = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../utils/db");
const { SECRET } = require("../utils/config");
const User = require("../models/User");

const api = supertest(app);

// Helpers
const BASE_URL = "/api/users";

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

const newUser = {
  username: "testuser",
  password: "secret",
  firstName: "test",
  lastName: "user",
  joinDate: new Date().toISOString(),
};

beforeAll(() => {
  db.connect();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Promise.all(initialUsers.map((u) => User.create(u)));
});

describe("Users", () => {
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
    const userId = request.body[0].id;

    const { body: existingUser } = await api
      .get(`${BASE_URL}/${userId}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(existingUser.title).toBe(request.body[0].title);
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

  test("return a token along with new user data on creation", async () => {
    const { body: savedUser } = await api
      .post(BASE_URL)
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const { body: usersAtEnd } = await api.get(BASE_URL);

    expect(savedUser.token).toBeDefined();
    expect(savedUser.title).toBe(newUser.title);
    expect(usersAtEnd).toHaveLength(initialUsers.length + 1);
  });

  test("creating a user fails with invalid data", async () => {
    const response = await api
      .post(BASE_URL)
      .send({
        ...newUser,
        username: "123",
        joinDate: undefined,
      })
      .expect(400);

    const { body: usersAtEnd } = await api.get(BASE_URL);

    expect(response.body.error).toBeDefined();
    expect(usersAtEnd).toHaveLength(initialUsers.length);
  });

  test("can be deleted with authorized token", async () => {
    const { body: usersAtStart } = await api.get(BASE_URL);
    const userId = usersAtStart[0].id;
    const authorizedToken = jwt.sign(
      {
        id: userId,
      },
      SECRET
    );

    await api
      .delete(`${BASE_URL}/${userId}`)
      .set("Authorization", `Bearer ${authorizedToken}`)
      .expect(204);

    const { body: usersAtEnd } = await api.get(BASE_URL);

    expect(usersAtEnd).toHaveLength(usersAtStart.length - 1);
    expect(usersAtEnd[0].id).not.toBe(usersAtStart[0].id);
  });

  test("deleting a user fails (401) without a token", async () => {
    const { body: usersAtStart } = await api.get(BASE_URL);
    const userId = usersAtStart[0].id;

    await api.delete(`${BASE_URL}/${userId}`).expect(401);

    const { body: usersAtEnd } = await api.get(BASE_URL);

    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });

  test("deleting a user fails (403) with the wrong token", async () => {
    const { body: usersAtStart } = await api.get(BASE_URL);
    const userId = usersAtStart[0].id;
    const unauthorizedToken = jwt.sign(
      {
        id: usersAtStart[1], // not the same user as the one we're trying to delete
      },
      SECRET
    );

    await api
      .delete(`${BASE_URL}/${userId}`)
      .set("Authorization", `Bearer ${unauthorizedToken}`)
      .expect(403);

    const { body: usersAtEnd } = await api.get(BASE_URL);

    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });
});

afterAll(() => {
  db.disconnect();
});
