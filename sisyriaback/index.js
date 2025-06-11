import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { connectDB } from "./config/db.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRouter from "./routes/authRouter.js";
import session from "express-session"; // <-- ✅ ADD THIS
import MongoStore from 'connect-mongo';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const __dirname = path.resolve();


app.use(cors({
  origin: 'https://sisyriaback-production.up.railway.app/api/users',
  credentials: true
}));
app.set('trust proxy', 1); // Required for secure cookies behind proxies

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));


// If using custom middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  next();
});;

// Middlewares
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // For form data
app.use(cookieParser()); 

// API Routes - Best Practice
app.use("/api/users", userRouter);
app.use("/api/orders", orderRoutes); 

// Production settings (for serving frontend)
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
