import express from "express";
import cors from "cors";
import { connectToDatabase } from "./db.js";
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
  return token;
};

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "smart-spend-backend", date: new Date().toISOString() });
});

app.get("/api/dashboard", async (_req, res) => {
  const token = getAuthorizedUser(_req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(await getDashboard(user.id));
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || !email.includes("@") || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Email or password is invalid" });
  }

  const created = await registerUser({ email, password });
  if (!created) {
    return res.status(409).json({ error: "Email already exists" });
  }

  return res.status(201).json(created);
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email or password is invalid" });
  }

  const auth = await loginUser({ email, password });
  if (!auth) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  return res.json(auth);
});

app.get("/api/auth/me", async (req, res) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json({ user });
});

app.post("/api/auth/logout", async (req, res) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await logoutSession(token);
  return res.status(204).send();
});

app.get("/api/transactions", async (_req, res) => {
  const token = getAuthorizedUser(_req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ items: await getTransactions(user.id) });
});

app.post("/api/transactions", async (req, res) => {
  const token = getAuthorizedUser(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { name, amount, category, source } = req.body ?? {};

  if (typeof name !== "string" || !name.trim() || typeof amount !== "number" || Number.isNaN(amount)) {
    return res.status(400).json({ error: "Invalid transaction payload" });
  }

  const created = await addTransaction(user.id, {
    name: name.trim(),
    amount,
    category,
    source,
  });

  return res.status(201).json(created);
});

app.get("/api/rewards", async (_req, res) => {
  const token = getAuthorizedUser(_req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(await getRewards(user.id));
});

app.get("/api/reminders", async (_req, res) => {
  const token = getAuthorizedUser(_req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ items: await getReminders(user.id) });
});

app.post("/api/reminders", async (req, res) => {
  const token = getAuthorizedUser(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { title, amount, dueDate } = req.body ?? {};

  if (typeof title !== "string" || !title.trim() || typeof amount !== "number" || Number.isNaN(amount)) {
    return res.status(400).json({ error: "Invalid reminder payload" });
  }

  const created = await addReminder(user.id, { title: title.trim(), amount, dueDate });
  return res.status(201).json(created);
});

app.patch("/api/reminders/:id/toggle", async (req, res) => {
  const token = getAuthorizedUser(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid reminder id" });
  }

  const updated = await toggleReminder(user.id, id);
  if (!updated) {
    return res.status(404).json({ error: "Reminder not found" });
  }

  return res.json(updated);
});

app.delete("/api/reminders/:id", async (req, res) => {
  const token = getAuthorizedUser(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid reminder id" });
  }

  const removed = await deleteReminder(user.id, id);
  if (!removed) {
    return res.status(404).json({ error: "Reminder not found" });
  }

  return res.status(204).send();
});

const startServer = async () => {
  await connectToDatabase();
  app.listen(port, () => {
    console.log(`Smart Spend backend running on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
