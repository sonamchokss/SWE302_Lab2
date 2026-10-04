/**
 * Authentication & authorisation for the CST SMS.
 *
 *  - Passwords are stored as salted scrypt hashes (Node's built-in crypto).
 *  - Login issues a random bearer token kept in memory with an expiry.
 *  - requireAuth / requireRole protect routes; "self or admin" checks are
 *    done with isSelfOrAdmin().
 */
const crypto = require("crypto");

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const candidate = crypto.scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

// ---- In-memory account store (demo accounts) ----
const users = new Map(); // studentId -> { studentId, passwordHash, role, fullName }

function addUser({ studentId, password, role = "student", fullName = "" }) {
  users.set(studentId, { studentId, passwordHash: hashPassword(password), role, fullName });
}

function findUser(studentId) {
  return users.get(studentId);
}

function authenticate(studentId, password) {
  const user = users.get(studentId);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  return user;
}

// ---- Sessions ----
const sessions = new Map(); // token -> { studentId, role, fullName, expiresAt }

function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    studentId: user.studentId,
    role: user.role,
    fullName: user.fullName,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  return token;
}

function destroySession(token) {
  sessions.delete(token);
}

function getSession(token) {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function extractToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

// ---- Middleware ----
function requireAuth(req, res, next) {
  const token = extractToken(req);
  const session = token && getSession(token);
  if (!session) return res.status(401).json({ message: "Please log in to continue" });
  req.token = token;
  req.user = session;
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: "You do not have permission to do this" });
    }
    next();
  };
}

function isSelfOrAdmin(user, studentId) {
  return user.role === "admin" || user.studentId === studentId;
}

module.exports = {
  addUser,
  findUser,
  authenticate,
  createSession,
  destroySession,
  getSession,
  requireAuth,
  requireRole,
  isSelfOrAdmin,
};
