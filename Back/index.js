import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { connectDB } from "./config/db.js";
import orderRoutes from "./routes/orderRoutes.js"

import userRouter from "./routes/authRouter.js";
dotenv.config({ path: path.resolve(process.cwd(), '.env') });


console.log('--- Environment Debug ---');
console.log('.env path:', `${process.cwd()}/.env`);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET:', process.env.JWT_SECRET || 'Not found');
console.log('-----------------------');
const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();


app.use(cors({
	origin: "http://localhost:3000", 
	credentials: true,
	allowedHeaders: ['Content-Type', 'Authorization'],
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	exposedHeaders: ['Set-Cookie']

  }));
app.use(express.json()); 
app.use(cookieParser()); 

app.use("/users", userRouter);
app.use("/users", orderRoutes); 
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

app.listen(PORT, () => {
	connectDB();
	console.log("Server is running on port: ", PORT);
});