const supertest = require("supertest");

const app = require("../app");
const db = require("../utils/db");
const User = require("../models/User");

const api = supertest(app);

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

    expect(existingUser.title).toEqual(request.body[0].title);
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

  test("can be created", async () => {
    const { body: savedUser } = await api
      .post(BASE_URL)
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const { body: usersAtEnd } = await api.get(BASE_URL);

    expect(savedUser.title).toEqual(newUser.title);
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

  test("can be deleted", async () => {
    const { body: usersAtStart } = await api.get(BASE_URL);
    const userId = usersAtStart[0].id;

    await api.delete(`${BASE_URL}/${userId}`).expect(204);

    const { body: usersAtEnd } = await api.get(BASE_URL);

    expect(usersAtEnd).toHaveLength(usersAtStart.length - 1);
    expect(usersAtEnd[0].id).not.toEqual(usersAtStart[0].id);
  });
});

afterAll(() => {
  db.disconnect();
});
