import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
	try {
		const mongoUri = process.env.MONGO_URI || "mongodb+srv://anwarramo:anwar231366@cluster0.box35.mongodb.net/mydatabase";
		console.log("mongo_uri: ", mongoUri);

		const conn = await mongoose.connect(mongoUri);
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.log("Error connecting to MongoDB: ", error.message);
		process.exit(1);
	}
};
