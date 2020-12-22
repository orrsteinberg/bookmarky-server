const supertest = require("supertest");

const app = require("../app");
const db = require("../utils/db");
const User = require("../models/User");

const api = supertest(app);

const BASE_URL = "/api/login";

const initialUser = {
  username: "testuser",
  password: "secret",
  firstName: "test",
  lastName: "user",
  joinDate: new Date().toISOString(),
};

beforeAll(async () => {
  db.connect();
  await User.deleteMany({});
  await User.create(initialUser);
});

describe("Login", () => {
  test("is successful with valid credentials", async () => {
    const { username, password } = initialUser; // valid login data

    const response = await api
      .post(BASE_URL)
      .send({ username, password })
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body).toBeDefined();
    expect(response.body.token).toBeDefined();
    expect(response.body.username).toBe(initialUser.username);
  });

  test("fails with invalid username", async () => {
    const response = await api
      .post(BASE_URL)
      .send({ username: "wrongUsername", password: initialUser.password })
      .expect(401)
      .expect("Content-Type", /application\/json/);

    expect(response.body.error).toBe("Invalid username or password");
  });

  test("fails with invalid password", async () => {
    const response = await api
      .post(BASE_URL)
      .send({ username: initialUser.username, password: "incorrect" })
      .expect(401)
      .expect("Content-Type", /application\/json/);

    expect(response.body.error).toBe("Invalid username or password");
  });
});

afterAll(() => {
  db.disconnect();
});
