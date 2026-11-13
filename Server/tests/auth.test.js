import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./helpers/db.js";

const validUser = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  acceptedPrivacyNote: true,
};

const registerUser = (overrides = {}) =>
  request(app).post("/api/auth/register").send({ ...validUser, ...overrides });

beforeAll(async () => {
  await connectTestDB();
  await User.init(); // make sure the unique email index exists
});
afterEach(clearTestDB);
afterAll(closeTestDB);

describe("POST /api/auth/register", () => {
  it("creates a user and returns a token without the password hash", async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("stores a bcrypt hash, never the plain password", async () => {
    await registerUser();
    const user = await User.findOne({ email: "test@example.com" });
    expect(user.passwordHash).not.toBe("password123");
    expect(user.passwordHash.startsWith("$2")).toBe(true);
  });

  it("rejects registration without consent", async () => {
    const res = await registerUser({ acceptedPrivacyNote: false });
    expect(res.status).toBe(400);
  });

  it("rejects a short password", async () => {
    const res = await registerUser({ password: "abc" });
    expect(res.status).toBe(400);
  });

  it("returns 409 for a duplicate email, even with different letter case", async () => {
    await registerUser();
    const res = await registerUser({ email: "TEST@Example.com" });
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token for correct credentials", async () => {
    await registerUser();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
  });

  it("gives the same 401 for a wrong password and an unknown email", async () => {
    await registerUser();
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "wrong-password" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

describe("protected routes and account deletion", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the user with a valid token", async () => {
    const { body } = await registerUser();
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("test@example.com");
  });

  it("returns 401 for a tampered token", async () => {
    const { body } = await registerUser();
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${body.token}x`);
    expect(res.status).toBe(401);
  });

  it("returns 401 for an expired token", async () => {
    const { body } = await registerUser();
    const expired = jwt.sign({ sub: body.user.id }, process.env.JWT_SECRET, {
      expiresIn: -10,
    });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it("deletes the account, and the old token stops working", async () => {
    const { body } = await registerUser();
    const auth = { Authorization: `Bearer ${body.token}` };

    const del = await request(app).delete("/api/auth/me").set(auth);
    expect(del.status).toBe(204);
    expect(await User.countDocuments()).toBe(0);

    const after = await request(app).get("/api/auth/me").set(auth);
    expect(after.status).toBe(401);
  });
});