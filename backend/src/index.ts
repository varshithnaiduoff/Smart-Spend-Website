import express from "express";
import cors from "cors";
import {
  addReminder,
  addTransaction,
  deleteReminder,
  getDashboard,
  getReminders,
  getRewards,
  getTransactions,
  getUserFromToken,
  loginUser,
  logoutSession,
  registerUser,
  toggleReminder,
} from "./store.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

const getBearerToken = (header: string | undefined) => {
  if (!header) return null;
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
};

const getAuthorizedUser = (authorization: string | undefined) => {
  const token = getBearerToken(authorization);
  if (!token) return null;
  const user = getUserFromToken(token);
  if (!user) return null;
  return user;
};

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "smart-spend-backend", date: new Date().toISOString() });
});

app.get("/api/dashboard", (_req, res) => {
  const user = getAuthorizedUser(_req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(getDashboard(user.id));
});

app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || !email.includes("@") || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Email or password is invalid" });
  }

  const created = registerUser({ email, password });
  if (!created) {
    return res.status(409).json({ error: "Email already exists" });
  }

  return res.status(201).json(created);
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email or password is invalid" });
  }

  const auth = loginUser({ email, password });
  if (!auth) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  return res.json(auth);
});

app.get("/api/auth/me", (req, res) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json({ user });
});

app.post("/api/auth/logout", (req, res) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  logoutSession(token);
  return res.status(204).send();
});

app.get("/api/transactions", (_req, res) => {
  const user = getAuthorizedUser(_req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ items: getTransactions(user.id) });
});

app.post("/api/transactions", (req, res) => {
  const user = getAuthorizedUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { name, amount, category, source } = req.body ?? {};

  if (typeof name !== "string" || !name.trim() || typeof amount !== "number" || Number.isNaN(amount)) {
    return res.status(400).json({ error: "Invalid transaction payload" });
  }

  const created = addTransaction(user.id, {
    name: name.trim(),
    amount,
    category,
    source,
  });

  return res.status(201).json(created);
});

app.get("/api/rewards", (_req, res) => {
  const user = getAuthorizedUser(_req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(getRewards(user.id));
});

app.get("/api/reminders", (_req, res) => {
  const user = getAuthorizedUser(_req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ items: getReminders(user.id) });
});

app.post("/api/reminders", (req, res) => {
  const user = getAuthorizedUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { title, amount, dueDate } = req.body ?? {};

  if (typeof title !== "string" || !title.trim() || typeof amount !== "number" || Number.isNaN(amount)) {
    return res.status(400).json({ error: "Invalid reminder payload" });
  }

  const created = addReminder(user.id, { title: title.trim(), amount, dueDate });
  return res.status(201).json(created);
});

app.patch("/api/reminders/:id/toggle", (req, res) => {
  const user = getAuthorizedUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid reminder id" });
  }

  const updated = toggleReminder(user.id, id);
  if (!updated) {
    return res.status(404).json({ error: "Reminder not found" });
  }

  return res.json(updated);
});

app.delete("/api/reminders/:id", (req, res) => {
  const user = getAuthorizedUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid reminder id" });
  }

  const removed = deleteReminder(user.id, id);
  if (!removed) {
    return res.status(404).json({ error: "Reminder not found" });
  }

  return res.status(204).send();
});

app.listen(port, () => {
  console.log(`Smart Spend backend running on http://localhost:${port}`);
});
