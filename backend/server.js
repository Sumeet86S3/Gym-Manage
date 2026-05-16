import http from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? "fitsphere-local-dev-secret";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const DAY_MS = 1000 * 60 * 60 * 24;

const roles = ["admin", "trainer", "client"];
const trainerStatuses = ["Pending", "Approved", "Rejected"];
const clientStatuses = ["Active", "Inactive"];
const paymentStatuses = ["Paid", "Due", "Overdue"];
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const difficulties = ["Easy", "Moderate", "Hard"];
const energyLevels = ["Low", "Normal", "High"];
const issues = ["No issue", "Joint pain", "Muscle soreness", "Other"];

function createSeedData() {
  const now = Date.now();
  const users = [
    createUser("admin-1", "Avery Stone", "admin@fitsphere.com", "admin", "Approved", "password123"),
    createUser("trainer-1", "Alex Rivera", "trainer@fitsphere.com", "trainer", "Approved", "password123", "t1"),
    createUser("client-1", "Olivia Bennett", "client@fitsphere.com", "client", "Approved", "password123", "c1"),
    createUser("trainer-t2", "Priya Shah", "priya@fitstudio.com", "trainer", "Approved", "password123", "t2"),
    createUser("trainer-t3", "Marcus Lee", "marcus@fitstudio.com", "trainer", "Pending", "password123", "t3"),
    createUser("trainer-t4", "Elena Costa", "elena@fitstudio.com", "trainer", "Pending", "password123", "t4"),
    createUser("trainer-t5", "Jordan Kim", "jordan@fitstudio.com", "trainer", "Rejected", "password123", "t5"),
    createUser("trainer-t6", "Sam Patel", "sam@fitstudio.com", "trainer", "Approved", "password123", "t6"),
  ];

  return {
    meta: {
      createdAt: new Date().toISOString(),
      version: 1,
    },
    users,
    trainers: [
      { id: "t1", userId: "trainer-1", name: "Alex Rivera", email: "alex@fitstudio.com", status: "Approved", joinedAt: "2024-08-12", clients: 14 },
      { id: "t2", userId: "trainer-t2", name: "Priya Shah", email: "priya@fitstudio.com", status: "Approved", joinedAt: "2024-09-04", clients: 9 },
      { id: "t3", userId: "trainer-t3", name: "Marcus Lee", email: "marcus@fitstudio.com", status: "Pending", joinedAt: "2025-04-18", clients: 0 },
      { id: "t4", userId: "trainer-t4", name: "Elena Costa", email: "elena@fitstudio.com", status: "Pending", joinedAt: "2025-04-21", clients: 0 },
      { id: "t5", userId: "trainer-t5", name: "Jordan Kim", email: "jordan@fitstudio.com", status: "Rejected", joinedAt: "2025-03-30", clients: 0 },
      { id: "t6", userId: "trainer-t6", name: "Sam Patel", email: "sam@fitstudio.com", status: "Approved", joinedAt: "2024-11-01", clients: 22 },
    ],
    clients: [
      { id: "c1", trainerId: "t1", name: "Olivia Bennett", email: "olivia@example.com", goal: "Weight loss", status: "Active", lastVisit: "Today", joinedAt: "2024-12-10", streak: 5, plan: "Premium Quarterly", paymentStatus: "Paid", dueDate: "2025-07-10" },
      { id: "c2", trainerId: "t1", name: "Liam Carter", email: "liam@example.com", goal: "Muscle gain", status: "Active", lastVisit: "Yesterday", joinedAt: "2025-01-22", streak: 12, plan: "Standard Monthly", paymentStatus: "Due", dueDate: "2025-04-28" },
      { id: "c3", trainerId: "t1", name: "Sophia Nguyen", email: "sophia@example.com", goal: "Endurance", status: "Active", lastVisit: "2 days ago", joinedAt: "2024-10-05", streak: 3, plan: "Premium Monthly", paymentStatus: "Paid", dueDate: "2025-05-05" },
      { id: "c4", trainerId: "t1", name: "Noah Williams", email: "noah@example.com", goal: "Strength", status: "Inactive", lastVisit: "9 days ago", joinedAt: "2024-07-19", streak: 0, plan: "Standard Monthly", paymentStatus: "Overdue", dueDate: "2025-04-12" },
      { id: "c5", trainerId: "t1", name: "Ava Rodriguez", email: "ava@example.com", goal: "Flexibility", status: "Active", lastVisit: "Today", joinedAt: "2025-02-14", streak: 8, plan: "Premium Quarterly", paymentStatus: "Paid", dueDate: "2025-08-14" },
      { id: "c6", trainerId: "t1", name: "Ethan Brooks", email: "ethan@example.com", goal: "Weight loss", status: "Active", lastVisit: "3 days ago", joinedAt: "2024-09-30", streak: 2, plan: "Standard Monthly", paymentStatus: "Due", dueDate: "2025-04-30" },
      { id: "c7", trainerId: "t1", name: "Mia Thompson", email: "mia@example.com", goal: "Muscle gain", status: "Inactive", lastVisit: "14 days ago", joinedAt: "2024-06-11", streak: 0, plan: "Standard Monthly", paymentStatus: "Overdue", dueDate: "2025-04-08" },
    ],
    workouts: [
      {
        id: "w1",
        trainerId: "t1",
        clientId: "c1",
        name: "Upper Body Strength",
        type: "Strength",
        durationMinutes: 45,
        exercises: [
          { id: "e1", name: "Barbell Bench Press", type: "Compound", equipment: "Barbell", sets: 4, reps: 8, weight: 60 },
          { id: "e2", name: "Pull-ups", type: "Compound", equipment: "Bodyweight", sets: 4, reps: 10, weight: 0 },
          { id: "e3", name: "Dumbbell Shoulder Press", type: "Compound", equipment: "Dumbbells", sets: 3, reps: 12, weight: 18 },
          { id: "e4", name: "Barbell Row", type: "Compound", equipment: "Barbell", sets: 4, reps: 10, weight: 50 },
          { id: "e5", name: "Tricep Rope Pushdown", type: "Isolation", equipment: "Cable", sets: 3, reps: 15, weight: 25 },
          { id: "e6", name: "Bicep Curl", type: "Isolation", equipment: "Dumbbells", sets: 3, reps: 12, weight: 14 },
        ],
      },
    ],
    exerciseLibrary: [
      { id: "lib1", name: "Squat", type: "Compound", equipment: "Barbell", sets: 4, reps: 8, weight: 80 },
      { id: "lib2", name: "Deadlift", type: "Compound", equipment: "Barbell", sets: 3, reps: 5, weight: 100 },
      { id: "lib3", name: "Lunges", type: "Compound", equipment: "Dumbbells", sets: 3, reps: 12, weight: 16 },
      { id: "lib4", name: "Plank", type: "Core", equipment: "Bodyweight", sets: 3, reps: 60, weight: 0 },
      { id: "lib5", name: "Russian Twist", type: "Core", equipment: "Medicine Ball", sets: 3, reps: 20, weight: 6 },
      { id: "lib6", name: "Treadmill Run", type: "Cardio", equipment: "Treadmill", sets: 1, reps: 30, weight: 0 },
    ],
    workoutCompletions: [],
    feedback: [
      { id: "f1", clientName: "Olivia Bennett", clientId: "c1", workoutId: "w1", workoutName: "Upper Body Strength", exerciseId: "e1", date: "Today, 9:14 AM", difficulty: "Hard", energy: "Low", issue: "Joint pain", notes: "Right shoulder felt tight during bench press.", createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString() },
      { id: "f2", clientName: "Liam Carter", clientId: "c2", workoutId: "w1", workoutName: "Lower Body Power", exerciseId: "e2", date: "Today, 8:02 AM", difficulty: "Moderate", energy: "Normal", issue: "No issue", notes: "Felt good, ready to increase weight next session.", createdAt: new Date(now - 1000 * 60 * 60 * 4).toISOString() },
      { id: "f3", clientName: "Sophia Nguyen", clientId: "c3", workoutId: "w1", workoutName: "HIIT Cardio", exerciseId: "e3", date: "Today, 7:30 AM", difficulty: "Hard", energy: "Low", issue: "Muscle soreness", notes: "Hamstrings still sore from Monday.", createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString() },
      { id: "f4", clientName: "Ava Rodriguez", clientId: "c5", workoutId: "w1", workoutName: "Mobility & Core", exerciseId: "e4", date: "Yesterday", difficulty: "Easy", energy: "High", issue: "No issue", notes: "", createdAt: new Date(now - DAY_MS).toISOString() },
      { id: "f5", clientName: "Ethan Brooks", clientId: "c6", workoutId: "w1", workoutName: "Full Body Circuit", exerciseId: "e5", date: "Yesterday", difficulty: "Moderate", energy: "Normal", issue: "Other", notes: "Slight headache toward end.", createdAt: new Date(now - DAY_MS).toISOString() },
    ],
    attendance: [],
    meals: [
      { id: "m1", clientId: "c1", clientName: "Olivia Bennett", type: "Breakfast", time: "8:32 AM", timestamp: now - 1000 * 60 * 60 * 2, note: "Oats with berries + 3 egg whites", image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=70" },
      { id: "m2", clientId: "c2", clientName: "Liam Carter", type: "Lunch", time: "1:15 PM", timestamp: now - 1000 * 60 * 60, note: "Grilled chicken bowl, brown rice, avocado", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=70" },
      { id: "m3", clientId: "c3", clientName: "Sophia Nguyen", type: "Snacks", time: "4:40 PM", timestamp: now - 1000 * 60 * 30, note: "Greek yogurt, almonds, honey", image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&auto=format&fit=crop&q=70" },
      { id: "m4", clientId: "c5", clientName: "Ava Rodriguez", type: "Dinner", time: "Yesterday, 8:10 PM", timestamp: now - 1000 * 60 * 60 * 18, note: "Salmon, quinoa, steamed broccoli", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=70" },
      { id: "m5", clientId: "c6", clientName: "Ethan Brooks", type: "Breakfast", time: "Yesterday, 7:50 AM", timestamp: now - 1000 * 60 * 60 * 28, note: "Protein smoothie + banana", image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=800&auto=format&fit=crop&q=70" },
      { id: "m6", clientId: "c1", clientName: "Olivia Bennett", type: "Lunch", time: "Yesterday, 1:25 PM", timestamp: now - 1000 * 60 * 60 * 24, note: "Tofu stir-fry with veggies", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=70" },
    ],
    measurements: [
      { id: "meas1", clientId: "c1", week: "W1", weight: 82.4, chest: 102, waist: 92, arms: 36, createdAt: "2025-03-01T00:00:00.000Z" },
      { id: "meas2", clientId: "c1", week: "W2", weight: 81.8, chest: 102, waist: 91, arms: 36, createdAt: "2025-03-08T00:00:00.000Z" },
      { id: "meas3", clientId: "c1", week: "W3", weight: 81.1, chest: 103, waist: 90, arms: 36.5, createdAt: "2025-03-15T00:00:00.000Z" },
      { id: "meas4", clientId: "c1", week: "W4", weight: 80.5, chest: 103, waist: 89, arms: 37, createdAt: "2025-03-22T00:00:00.000Z" },
      { id: "meas5", clientId: "c1", week: "W5", weight: 79.9, chest: 104, waist: 88, arms: 37, createdAt: "2025-03-29T00:00:00.000Z" },
      { id: "meas6", clientId: "c1", week: "W6", weight: 79.2, chest: 104, waist: 87, arms: 37.5, createdAt: "2025-04-05T00:00:00.000Z" },
      { id: "meas7", clientId: "c1", week: "W7", weight: 78.6, createdAt: "2025-04-12T00:00:00.000Z" },
      { id: "meas8", clientId: "c1", week: "W8", weight: 78.0, createdAt: "2025-04-19T00:00:00.000Z" },
    ],
    goals: [
      { id: "g1", clientId: "c1", title: "Lose 8 kg", start: 86, current: 78, target: 78, unit: "kg", reverse: true },
      { id: "g2", clientId: "c1", title: "Bench press 80kg", start: 50, current: 65, target: 80, unit: "kg", reverse: false },
      { id: "g3", clientId: "c1", title: "Run 5km under 25min", start: 32, current: 27, target: 25, unit: "min", reverse: true },
    ],
    payments: [
      { id: "p1", clientId: "c1", client: "Olivia Bennett", amount: 19999, plan: "Premium Quarterly", date: "Jan 10, 2025", status: "Paid", dueDate: null },
      { id: "p2", clientId: "c1", client: "Olivia Bennett", amount: 19999, plan: "Premium Quarterly", date: "Apr 10, 2025", status: "Paid", dueDate: null },
      { id: "p3", clientId: "c1", client: "Olivia Bennett", amount: 19999, plan: "Premium Quarterly", date: "Jul 10, 2025", status: "Due", dueDate: "Jul 10, 2025" },
      { id: "p4", clientId: "c2", client: "Liam Carter", amount: 7499, plan: "Standard Monthly", date: "Apr 23", status: "Due", dueDate: "2025-04-28" },
      { id: "p5", clientId: "c3", client: "Sophia Nguyen", amount: 9999, plan: "Premium Monthly", date: "Apr 22", status: "Paid", dueDate: "2025-05-05" },
      { id: "p6", clientId: "c4", client: "Noah Williams", amount: 7499, plan: "Standard Monthly", date: "Apr 12", status: "Overdue", dueDate: "2025-04-12" },
    ],
    notifications: [
      { id: "n1", type: "payment", title: "Payment due reminder", desc: "Liam Carter - due in 3 days", time: "2h ago" },
      { id: "n2", type: "missed", title: "Missed workout alert", desc: "Noah Williams missed scheduled session", time: "5h ago" },
      { id: "n3", type: "feedback", title: "New feedback submitted", desc: "Olivia reported joint pain", time: "1d ago" },
    ],
  };
}

function createUser(id, name, email, role, approvalStatus, password, profileId = null) {
  const passwordSalt = crypto.randomBytes(16).toString("hex");
  return {
    id,
    profileId,
    name,
    email: email.toLowerCase(),
    role,
    approvalStatus,
    passwordSalt,
    passwordHash: hashPassword(password, passwordSalt),
    createdAt: new Date().toISOString(),
  };
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
}

function verifyPassword(password, user) {
  return crypto.timingSafeEqual(
    Buffer.from(hashPassword(password, user.passwordSalt), "hex"),
    Buffer.from(user.passwordHash, "hex"),
  );
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    profileId: user.profileId,
    name: user.name,
    email: user.email,
    role: user.role,
    approved: user.approvalStatus === "Approved",
    approvalStatus: user.approvalStatus,
  };
}

async function loadDb() {
  await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(DB_FILE)) {
    const seed = createSeedData();
    await writeFile(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  return JSON.parse(await readFile(DB_FILE, "utf8"));
}

async function saveDb(db) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

function signToken(user) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  }));
  const signature = hmac(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  const parts = String(token ?? "").split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  if (!crypto.timingSafeEqual(Buffer.from(hmac(`${header}.${payload}`)), Buffer.from(signature))) {
    return null;
  }
  const parsed = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed;
}

function hmac(value) {
  return crypto.createHmac("sha256", JWT_SECRET).update(value).digest("base64url");
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function send(res, status, body = null) {
  const data = body === null ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(data);
}

function ok(res, data) {
  send(res, 200, { data });
}

function created(res, data) {
  send(res, 201, { data });
}

function fail(res, status, message, details = undefined) {
  send(res, status, { error: { message, details } });
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Invalid JSON body");
    error.status = 400;
    throw error;
  }
}

function route(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  return {
    method: req.method,
    pathname: url.pathname.replace(/\/+$/, "") || "/",
    query: url.searchParams,
    parts: url.pathname.split("/").filter(Boolean),
  };
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
  if (missing.length) {
    const error = new Error(`Missing required field(s): ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
}

function assertEnum(value, allowed, field) {
  if (!allowed.includes(value)) {
    const error = new Error(`${field} must be one of: ${allowed.join(", ")}`);
    error.status = 400;
    throw error;
  }
}

function id(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function trendFromAttendance(db) {
  const fallback = [
    { day: "Mon", visits: 24 },
    { day: "Tue", visits: 32 },
    { day: "Wed", visits: 28 },
    { day: "Thu", visits: 36 },
    { day: "Fri", visits: 41 },
    { day: "Sat", visits: 38 },
    { day: "Sun", visits: 19 },
  ];
  if (!db.attendance.length) return fallback;
  const byDay = new Map(fallback.map((row) => [row.day, 0]));
  for (const entry of db.attendance) {
    const day = new Date(entry.date).toLocaleDateString("en-US", { weekday: "short" });
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  return fallback.map((row) => ({ day: row.day, visits: byDay.get(row.day) ?? row.visits }));
}

function revenueTrend() {
  return [
    { month: "Nov", revenue: 672000 },
    { month: "Dec", revenue: 736000 },
    { month: "Jan", revenue: 808000 },
    { month: "Feb", revenue: 912000 },
    { month: "Mar", revenue: 1024000 },
    { month: "Apr", revenue: 1115800 },
  ];
}

function trainerForUser(db, user) {
  return db.trainers.find((trainer) => trainer.id === user.profileId || trainer.userId === user.id) ?? db.trainers[0];
}

function clientForUser(db, user) {
  return db.clients.find((client) => client.id === user.profileId || client.email.toLowerCase() === user.email) ?? db.clients[0];
}

function roleGuard(user, allowed) {
  if (!user) {
    const error = new Error("Authentication required");
    error.status = 401;
    throw error;
  }
  if (!allowed.includes(user.role)) {
    const error = new Error("You do not have permission to access this resource");
    error.status = 403;
    throw error;
  }
  if (user.role === "trainer" && user.approvalStatus !== "Approved") {
    const error = new Error("Trainer account is not approved yet");
    error.status = 403;
    throw error;
  }
}

async function getCurrentUser(req, db) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const payload = verifyToken(auth.slice("Bearer ".length));
  if (!payload) return null;
  return db.users.find((user) => user.id === payload.sub) ?? null;
}

function dashboardPayload(db) {
  const attendanceTrend = trendFromAttendance(db);
  const revenue = revenueTrend();
  return { attendanceTrend, revenueTrend: revenue };
}

async function handle(req, res) {
  if (req.method === "OPTIONS") return send(res, 204);

  const db = await loadDb();
  const currentUser = await getCurrentUser(req, db);
  const r = route(req);
  const body = ["POST", "PATCH", "PUT"].includes(req.method) ? await readJson(req) : {};

  if (r.pathname === "/api/health" && r.method === "GET") {
    return ok(res, { status: "ok", service: "fitsphere-backend", time: new Date().toISOString() });
  }

  if (r.pathname === "/api/auth/login" && r.method === "POST") {
    requireFields(body, ["email", "password"]);
    const user = db.users.find((candidate) => candidate.email === String(body.email).toLowerCase());
    if (!user || !verifyPassword(body.password, user)) return fail(res, 401, "Invalid email or password");
    if (body.role && user.role !== body.role) return fail(res, 403, `This account is not a ${body.role} account`);
    return ok(res, { user: publicUser(user), token: signToken(user) });
  }

  if (r.pathname === "/api/auth/trainer-signup" && r.method === "POST") {
    requireFields(body, ["name", "email", "password"]);
    const email = String(body.email).toLowerCase();
    if (db.users.some((user) => user.email === email)) return fail(res, 409, "Email is already registered");

    const trainerId = id("t");
    const user = createUser(id("trainer"), String(body.name), email, "trainer", "Pending", body.password, trainerId);
    const trainer = {
      id: trainerId,
      userId: user.id,
      name: user.name,
      email: user.email,
      status: "Pending",
      joinedAt: todayIso(),
      clients: 0,
    };
    db.users.push(user);
    db.trainers.unshift(trainer);
    await saveDb(db);
    return created(res, { user: publicUser(user), trainer, token: signToken(user) });
  }

  if (r.pathname === "/api/auth/me" && r.method === "GET") {
    roleGuard(currentUser, roles);
    return ok(res, { user: publicUser(currentUser) });
  }

  if (r.pathname === "/api/users/me" && r.method === "PATCH") {
    roleGuard(currentUser, roles);
    if (body.name) currentUser.name = String(body.name);
    if (body.email) {
      const email = String(body.email).toLowerCase();
      if (db.users.some((user) => user.id !== currentUser.id && user.email === email)) {
        return fail(res, 409, "Email is already registered");
      }
      currentUser.email = email;
    }
    syncProfileFromUser(db, currentUser);
    await saveDb(db);
    return ok(res, { user: publicUser(currentUser) });
  }

  if (r.pathname === "/api/users/me/password" && r.method === "PATCH") {
    roleGuard(currentUser, roles);
    requireFields(body, ["currentPassword", "newPassword"]);
    if (!verifyPassword(body.currentPassword, currentUser)) return fail(res, 400, "Current password is incorrect");
    currentUser.passwordSalt = crypto.randomBytes(16).toString("hex");
    currentUser.passwordHash = hashPassword(body.newPassword, currentUser.passwordSalt);
    await saveDb(db);
    return ok(res, { updated: true });
  }

  if (r.pathname === "/api/notifications" && r.method === "GET") {
    roleGuard(currentUser, roles);
    return ok(res, db.notifications);
  }

  if (r.pathname === "/api/admin/dashboard" && r.method === "GET") {
    roleGuard(currentUser, ["admin"]);
    const total = db.trainers.length;
    const approved = db.trainers.filter((trainer) => trainer.status === "Approved").length;
    const pending = db.trainers.filter((trainer) => trainer.status === "Pending").length;
    return ok(res, {
      stats: {
        totalTrainers: total,
        approvedTrainers: approved,
        pendingApprovals: pending,
        totalClients: db.clients.length,
      },
      ...dashboardPayload(db),
    });
  }

  if (r.pathname === "/api/admin/trainers" && r.method === "GET") {
    roleGuard(currentUser, ["admin"]);
    const status = r.query.get("status");
    const trainers = status && status !== "All" ? db.trainers.filter((trainer) => trainer.status === status) : db.trainers;
    return ok(res, trainers);
  }

  if (r.parts[0] === "api" && r.parts[1] === "admin" && r.parts[2] === "trainers" && r.parts[4] === "status" && r.method === "PATCH") {
    roleGuard(currentUser, ["admin"]);
    requireFields(body, ["status"]);
    assertEnum(body.status, trainerStatuses, "status");
    const trainer = db.trainers.find((candidate) => candidate.id === r.parts[3]);
    if (!trainer) return fail(res, 404, "Trainer not found");
    trainer.status = body.status;
    const user = db.users.find((candidate) => candidate.id === trainer.userId);
    if (user) user.approvalStatus = body.status;
    await saveDb(db);
    return ok(res, trainer);
  }

  if (r.pathname === "/api/admin/reports" && r.method === "GET") {
    roleGuard(currentUser, ["admin"]);
    return ok(res, {
      revenueTotal: db.payments.filter((p) => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0),
      attendanceTotal: trendFromAttendance(db).reduce((sum, row) => sum + row.visits, 0),
      ...dashboardPayload(db),
    });
  }

  if (r.pathname === "/api/trainer/dashboard" && r.method === "GET") {
    roleGuard(currentUser, ["trainer"]);
    const trainer = trainerForUser(db, currentUser);
    const clients = db.clients.filter((client) => client.trainerId === trainer.id);
    return ok(res, {
      stats: {
        totalClients: clients.length,
        activeClients: clients.filter((client) => client.status === "Active").length,
        todayAttendance: db.attendance.filter((entry) => entry.date === todayIso() && entry.trainerId === trainer.id).length,
        pendingPayments: clients.filter((client) => client.paymentStatus !== "Paid").length,
      },
      inactiveClients: clients.filter((client) => client.status === "Inactive" || client.lastVisit.includes("days")),
      recentFeedback: db.feedback.slice(0, 4),
      recentPayments: db.payments.slice(0, 4),
      ...dashboardPayload(db),
    });
  }

  if (r.pathname === "/api/trainer/clients" && r.method === "GET") {
    roleGuard(currentUser, ["trainer"]);
    const trainer = trainerForUser(db, currentUser);
    const query = r.query.get("q")?.toLowerCase();
    const clients = db.clients.filter((client) => client.trainerId === trainer.id && (!query || client.name.toLowerCase().includes(query)));
    return ok(res, clients);
  }

  if (r.pathname === "/api/trainer/clients" && r.method === "POST") {
    roleGuard(currentUser, ["trainer"]);
    requireFields(body, ["name", "email"]);
    const trainer = trainerForUser(db, currentUser);
    const client = {
      id: id("c"),
      trainerId: trainer.id,
      name: String(body.name),
      email: String(body.email).toLowerCase(),
      goal: body.goal ? String(body.goal) : "General fitness",
      status: "Active",
      lastVisit: "Today",
      joinedAt: todayIso(),
      streak: 0,
      plan: body.plan ? String(body.plan) : "Standard Monthly",
      paymentStatus: body.paymentStatus ?? "Paid",
      dueDate: body.dueDate ?? "-",
    };
    assertEnum(client.status, clientStatuses, "status");
    assertEnum(client.paymentStatus, paymentStatuses, "paymentStatus");
    db.clients.unshift(client);
    trainer.clients += 1;
    await saveDb(db);
    return created(res, client);
  }

  if (r.parts[0] === "api" && r.parts[1] === "trainer" && r.parts[2] === "clients" && r.parts[3]) {
    roleGuard(currentUser, ["trainer"]);
    const trainer = trainerForUser(db, currentUser);
    const client = db.clients.find((candidate) => candidate.id === r.parts[3] && candidate.trainerId === trainer.id);
    if (!client) return fail(res, 404, "Client not found");

    if (r.method === "PATCH") {
      for (const field of ["name", "email", "goal", "status", "lastVisit", "plan", "paymentStatus", "dueDate"]) {
        if (body[field] !== undefined) client[field] = body[field];
      }
      assertEnum(client.status, clientStatuses, "status");
      assertEnum(client.paymentStatus, paymentStatuses, "paymentStatus");
      await saveDb(db);
      return ok(res, client);
    }

    if (r.method === "DELETE") {
      db.clients = db.clients.filter((candidate) => candidate.id !== client.id);
      trainer.clients = Math.max(0, trainer.clients - 1);
      await saveDb(db);
      return ok(res, { deleted: true });
    }
  }

  if (r.pathname === "/api/trainer/attendance" && r.method === "GET") {
    roleGuard(currentUser, ["trainer"]);
    const date = r.query.get("date") ?? todayIso();
    const trainer = trainerForUser(db, currentUser);
    return ok(res, {
      date,
      entries: db.attendance.filter((entry) => entry.date === date && entry.trainerId === trainer.id),
      clients: db.clients.filter((client) => client.trainerId === trainer.id),
    });
  }

  if (r.pathname === "/api/trainer/attendance" && r.method === "POST") {
    roleGuard(currentUser, ["trainer"]);
    requireFields(body, ["clientId"]);
    const trainer = trainerForUser(db, currentUser);
    const date = body.date ?? todayIso();
    const client = db.clients.find((candidate) => candidate.id === body.clientId && candidate.trainerId === trainer.id);
    if (!client) return fail(res, 404, "Client not found");

    const existing = db.attendance.find((entry) => entry.clientId === client.id && entry.date === date);
    if (existing) {
      db.attendance = db.attendance.filter((entry) => entry.id !== existing.id);
      client.streak = Math.max(0, client.streak - 1);
      await saveDb(db);
      return ok(res, { marked: false, entry: existing, client });
    }

    const entry = { id: id("att"), clientId: client.id, trainerId: trainer.id, date, markedAt: new Date().toISOString() };
    db.attendance.push(entry);
    client.streak += 1;
    client.lastVisit = date === todayIso() ? "Today" : date;
    await saveDb(db);
    return created(res, { marked: true, entry, client });
  }

  if (r.pathname === "/api/trainer/workouts" && r.method === "GET") {
    roleGuard(currentUser, ["trainer"]);
    const trainer = trainerForUser(db, currentUser);
    return ok(res, {
      workouts: db.workouts.filter((workout) => workout.trainerId === trainer.id),
      exerciseLibrary: db.exerciseLibrary,
    });
  }

  if (r.pathname === "/api/trainer/workouts" && r.method === "POST") {
    roleGuard(currentUser, ["trainer"]);
    requireFields(body, ["name", "type"]);
    const trainer = trainerForUser(db, currentUser);
    const workout = {
      id: id("w"),
      trainerId: trainer.id,
      clientId: body.clientId ?? null,
      name: String(body.name),
      type: String(body.type),
      durationMinutes: Number(body.durationMinutes ?? 45),
      exercises: Array.isArray(body.exercises) ? body.exercises : [],
    };
    db.workouts.unshift(workout);
    await saveDb(db);
    return created(res, workout);
  }

  if (r.pathname === "/api/trainer/feedback" && r.method === "GET") {
    roleGuard(currentUser, ["trainer"]);
    const filter = r.query.get("filter") ?? "All";
    const feedback = db.feedback.filter((entry) => {
      const tone = feedbackTone(entry);
      if (filter === "Issues") return tone === "destructive";
      if (filter === "Hard + Low") return tone === "warning";
      if (filter === "Normal") return tone === "success";
      return true;
    });
    return ok(res, feedback);
  }

  if (r.pathname === "/api/trainer/meals" && r.method === "GET") {
    roleGuard(currentUser, ["trainer"]);
    return ok(res, filterMeals(db, r.query));
  }

  if (r.pathname === "/api/trainer/measurements" && r.method === "GET") {
    roleGuard(currentUser, ["trainer"]);
    const clientId = r.query.get("clientId") ?? "c1";
    return ok(res, db.measurements.filter((entry) => entry.clientId === clientId));
  }

  if (r.pathname === "/api/trainer/measurements" && r.method === "POST") {
    roleGuard(currentUser, ["trainer"]);
    requireFields(body, ["clientId"]);
    const measurement = {
      id: id("meas"),
      clientId: String(body.clientId),
      week: body.week ?? `W${db.measurements.filter((entry) => entry.clientId === body.clientId).length + 1}`,
      weight: optionalNumber(body.weight),
      chest: optionalNumber(body.chest),
      waist: optionalNumber(body.waist),
      arms: optionalNumber(body.arms),
      createdAt: new Date().toISOString(),
    };
    db.measurements.push(measurement);
    updateGoalProgress(db, measurement);
    await saveDb(db);
    return created(res, measurement);
  }

  if (r.pathname === "/api/trainer/goals" && r.method === "GET") {
    roleGuard(currentUser, ["trainer"]);
    const clientId = r.query.get("clientId");
    return ok(res, clientId ? db.goals.filter((goal) => goal.clientId === clientId) : db.goals);
  }

  if (r.pathname === "/api/trainer/payments" && r.method === "GET") {
    roleGuard(currentUser, ["trainer"]);
    return ok(res, db.payments);
  }

  if (r.pathname === "/api/client/workout" && r.method === "GET") {
    roleGuard(currentUser, ["client"]);
    const client = clientForUser(db, currentUser);
    const workout = db.workouts.find((candidate) => candidate.clientId === client.id) ?? db.workouts[0];
    const completed = db.workoutCompletions.filter((entry) => entry.clientId === client.id && entry.workoutId === workout.id);
    return ok(res, { workout, completed });
  }

  if (r.parts[0] === "api" && r.parts[1] === "client" && r.parts[2] === "workout" && r.parts[4] === "feedback" && r.method === "POST") {
    roleGuard(currentUser, ["client"]);
    requireFields(body, ["workoutId", "difficulty", "energy", "issue"]);
    assertEnum(body.difficulty, difficulties, "difficulty");
    assertEnum(body.energy, energyLevels, "energy");
    assertEnum(body.issue, issues, "issue");

    const client = clientForUser(db, currentUser);
    const workout = db.workouts.find((candidate) => candidate.id === body.workoutId) ?? db.workouts[0];
    const exerciseId = r.parts[3];
    const exercise = workout.exercises.find((candidate) => candidate.id === exerciseId);
    if (!exercise) return fail(res, 404, "Exercise not found");

    const completion = {
      id: id("done"),
      clientId: client.id,
      workoutId: workout.id,
      exerciseId,
      completedAt: new Date().toISOString(),
    };
    const feedback = {
      id: id("f"),
      clientName: client.name,
      clientId: client.id,
      workoutId: workout.id,
      workoutName: workout.name,
      exerciseId,
      date: formatTime(),
      difficulty: body.difficulty,
      energy: body.energy,
      issue: body.issue,
      notes: body.notes ? String(body.notes) : "",
      createdAt: new Date().toISOString(),
    };
    db.workoutCompletions.push(completion);
    db.feedback.unshift(feedback);
    await saveDb(db);
    return created(res, { completion, feedback });
  }

  if (r.pathname === "/api/client/meals" && r.method === "GET") {
    roleGuard(currentUser, ["client"]);
    const client = clientForUser(db, currentUser);
    return ok(res, db.meals.filter((meal) => meal.clientId === client.id));
  }

  if (r.pathname === "/api/client/meals" && r.method === "POST") {
    roleGuard(currentUser, ["client"]);
    requireFields(body, ["type", "image"]);
    assertEnum(body.type, mealTypes, "type");
    const client = clientForUser(db, currentUser);
    const now = new Date();
    const meal = {
      id: id("m"),
      clientId: client.id,
      clientName: client.name,
      type: body.type,
      time: formatTime(now),
      timestamp: now.getTime(),
      note: body.note ? String(body.note) : undefined,
      image: String(body.image),
    };
    db.meals.unshift(meal);
    await saveDb(db);
    return created(res, meal);
  }

  if (r.pathname === "/api/client/progress" && r.method === "GET") {
    roleGuard(currentUser, ["client"]);
    const client = clientForUser(db, currentUser);
    return ok(res, { measurements: db.measurements.filter((entry) => entry.clientId === client.id) });
  }

  if (r.pathname === "/api/client/payments" && r.method === "GET") {
    roleGuard(currentUser, ["client"]);
    const client = clientForUser(db, currentUser);
    return ok(res, {
      activePlan: {
        plan: client.plan,
        status: client.paymentStatus === "Paid" ? "Active" : client.paymentStatus,
        dueDate: client.dueDate,
      },
      history: db.payments.filter((payment) => payment.clientId === client.id),
    });
  }

  if (r.pathname === "/api/client/goals" && r.method === "GET") {
    roleGuard(currentUser, ["client"]);
    const client = clientForUser(db, currentUser);
    return ok(res, db.goals.filter((goal) => goal.clientId === client.id));
  }

  return fail(res, 404, "Route not found");
}

function optionalNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}

function syncProfileFromUser(db, user) {
  if (user.role === "trainer") {
    const trainer = db.trainers.find((candidate) => candidate.id === user.profileId || candidate.userId === user.id);
    if (trainer) {
      trainer.name = user.name;
      trainer.email = user.email;
    }
  }
  if (user.role === "client") {
    const client = db.clients.find((candidate) => candidate.id === user.profileId);
    if (client) {
      client.name = user.name;
      client.email = user.email;
    }
  }
}

function feedbackTone(entry) {
  if (entry.issue && entry.issue !== "No issue") return "destructive";
  if (entry.difficulty === "Hard" && entry.energy === "Low") return "warning";
  return "success";
}

function filterMeals(db, query) {
  const type = query.get("type") ?? "all";
  const range = query.get("range") ?? "today";
  const search = query.get("search")?.toLowerCase();
  const now = Date.now();
  return db.meals.filter((meal) => {
    if (type !== "all" && meal.type !== type) return false;
    if (range === "today" && now - meal.timestamp > DAY_MS) return false;
    if (range === "week" && now - meal.timestamp > DAY_MS * 7) return false;
    if (search && !meal.clientName.toLowerCase().includes(search)) return false;
    return true;
  });
}

function updateGoalProgress(db, measurement) {
  if (typeof measurement.weight !== "number") return;
  const weightGoal = db.goals.find((goal) => goal.clientId === measurement.clientId && goal.unit === "kg" && goal.reverse);
  if (weightGoal) weightGoal.current = measurement.weight;
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    const status = error.status ?? 500;
    const message = status === 500 ? "Internal server error" : error.message;
    if (status === 500) console.error(error);
    fail(res, status, message);
  });
});

server.listen(PORT, () => {
  console.log(`FitSphere backend listening on http://localhost:${PORT}`);
});
