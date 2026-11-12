import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { registerSchema, loginSchema } from "../validators/auth.js";

const fail = (res, status, code, message) =>
  res.status(status).json({ error: { code, message } });

const firstIssue = (parsed) => {
  const issue = parsed.error.issues[0];
  return `${issue.path.join(".")}: ${issue.message}`;
};

const signToken = (user) =>
  jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });

// Compared against when the email is unknown, so "no such user" and
// "wrong password" take about the same time.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", firstIssue(parsed));

    const { name, email, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    try {
      user = await User.create({ name, email, passwordHash, consentAt: new Date() });
    } catch (err) {
      if (err.code === 11000)
        return fail(res, 409, "EMAIL_EXISTS", "An account with this email already exists.");
      throw err;
    }

    res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", firstIssue(parsed));

    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

    if (!user || !ok) return fail(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");

    res.json({ user, token: signToken(user) });
  } catch (err) {
    next(err);
  }
}