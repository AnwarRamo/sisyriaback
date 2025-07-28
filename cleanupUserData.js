import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.model.js";
import Follow from "./models/follow.js";
import Trip from "./models/trip.model.js";
import Booking from "./models/Booking.model.js";
import Order from "./models/order.js";

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://anwarramo:anwar231366@cluster0.box35.mongodb.net/mydatabase";
    console.log("Connecting to MongoDB...");
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

const cleanupUserData = async (userId) => {
  try {
    console.log(`🧹 Cleaning up data for user: ${userId}`);
    
    // Clean up all related data
    const cleanupResults = await Promise.allSettled([
      // Delete follow relationships
      Follow.deleteMany({ 
        $or: [{ follower: userId }, { following: userId }] 
      }),
      
      // Remove user from trip registrations
      Trip.updateMany(
        { registeredUsers: userId },
        { $pull: { registeredUsers: userId } }
      ),
      
      // Delete user's bookings
      Booking.deleteMany({ userId: userId }),
      
      // Delete user's orders
      Order.deleteMany({ userId: userId }),
      
      // Remove user from any trip preferences
      Trip.updateMany(
        { preferredBy: userId },
        { $pull: { preferredBy: userId } }
      )
    ]);

    // Log cleanup results
    cleanupResults.forEach((result, index) => {
      const operations = [
        'Follow relationships',
        'Trip registrations', 
        'Bookings',
        'Orders',
        'Trip preferences'
      ];
      
      if (result.status === 'fulfilled') {
        console.log(`✅ Cleaned up ${operations[index]}: ${result.value?.deletedCount || result.value?.modifiedCount || 0} records`);
      } else {
        console.log(`⚠️  Failed to clean up ${operations[index]}: ${result.reason.message}`);
      }
    });

  } catch (error) {
    console.error("❌ Error during data cleanup:", error);
  }
};

const deleteUserAccount = async (username) => {
  try {
    console.log(`🔍 Searching for user: ${username}`);
    
    // Find the user
    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(username, 'i') } },
        { email: { $regex: new RegExp(username, 'i') } },
        { displayName: { $regex: new RegExp(username, 'i') } }
      ]
    });

    if (!user) {
      console.log(`❌ No user found matching: ${username}`);
      return false;
    }

    console.log(`📋 Found user:`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Display Name: ${user.displayName || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);

    // Clean up user data first
    await cleanupUserData(user._id);
    
    // Delete the user
    await User.findByIdAndDelete(user._id);
    
    console.log(`✅ Successfully deleted user: ${user.username}`);
    return true;

  } catch (error) {
    console.error("❌ Error deleting user:", error);
    return false;
  }
};

const main = async () => {
  try {
    await connectDB();
    
    const username = process.argv[2];
    
    if (!username) {
      console.log("❌ Please provide a username to delete:");
      console.log("   node cleanupUserData.js <username>");
      console.log("   Example: node cleanupUserData.js moumen");
      return;
    }

    const success = await deleteUserAccount(username);
    
    if (success) {
      console.log("🎉 User deletion completed successfully!");
    } else {
      console.log("❌ User deletion failed or user not found.");
    }

  } catch (error) {
    console.error("❌ Script failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

main(); 