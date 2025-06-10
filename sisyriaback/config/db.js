import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
	try {
		const mongoUri = process.env.MONGODB_URI || "mongodb+srv://anwarramo:anwar231366@cluster0.box35.mongodb.net/mydatabase"; // Use your actual database name
		console.log("mongo_uri: ", mongoUri);

		const conn = await mongoose.connect(mongoUri);
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.log("Error connection to MongoDB: ", error.message);
		process.exit(1); // 1 is failure, 0 status code is success
	}
};