import jwt from "jsonwebtoken";
import User from "../models/User.js";

const unauthorized = (res) =>
  res.status(401).json({
    error: { code: "UNAUTHORIZED", message: "Please log in to continue." },
  });

export async function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) return unauthorized(res);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return unauthorized(res); // bad signature, tampered, or expired
  }

  try {
    const user = await User.findById(payload.sub);
    if (!user) return unauthorized(res); // account was deleted
    req.user = user;
    next();
  } catch (err) {
    next(err); // a real database problem, not the user's fault
  }
}