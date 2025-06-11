import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { connectDB } from "./config/db.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRouter from "./routes/authRouter.js";
import session from "express-session";
import MongoStore from "connect-mongo";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const __dirname = path.resolve();

// Connect to MongoDB
connectDB();

// ✅ Log mongo URI to check
console.log("mongo_uri:", process.env.MONGO_URI);

// CORS Configuration (replace with your frontend domain!)
app.use(
  cors({
    origin: "https://your-frontend-domain.com", // ✅ <-- Replace with real frontend
    credentials: true,
  })
);

// Trust proxy if behind one (e.g. Railway, Vercel)
app.set("trust proxy", 1);

// Session config
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", true);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use("/api/users", userRouter);
app.use("/api/orders", orderRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
