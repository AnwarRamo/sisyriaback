import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { connectDB } from "./config/db.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRouter from "./routes/authRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const __dirname = path.resolve();

// CORS Configuration - IMPORTANT for frontend to connect
app.use(cors({
origin:    origin: ['https://sisyriafinly.netlify.app';],

    credentials: true,
}));

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
