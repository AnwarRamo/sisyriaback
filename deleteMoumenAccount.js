import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.model.js";
import Follow from "./models/follow.js";

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

const deleteMoumenAccount = async () => {
  try {
    console.log("🔍 Searching for 'moumen' accounts...");
    
    // Search for users with 'moumen' in username, email, or displayName
    const moumenUsers = await User.find({
      $or: [
        { username: { $regex: /moumen/i } },
        { email: { $regex: /moumen/i } },
        { displayName: { $regex: /moumen/i } }
      ]
    });

    if (moumenUsers.length === 0) {
      console.log("✅ No 'moumen' accounts found in the database.");
      return;
    }

    console.log(`📋 Found ${moumenUsers.length} account(s) with 'moumen':`);
    moumenUsers.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Display Name: ${user.displayName || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log("---");
    });

    // Ask for confirmation
    console.log("⚠️  WARNING: This will permanently delete the account(s) and all related data!");
    console.log("📝 To proceed with deletion, run this script with the --delete flag:");
    console.log("   node deleteMoumenAccount.js --delete");

    // Check if --delete flag is provided
    if (process.argv.includes('--delete')) {
      console.log("🗑️  Proceeding with deletion...");
      
      for (const user of moumenUsers) {
        console.log(`🗑️  Deleting user: ${user.username} (${user.email})`);
        
        // Delete the user
        await User.findByIdAndDelete(user._id);
        
        // Clean up related data
        await Follow.deleteMany({ 
          $or: [{ follower: user._id }, { following: user._id }] 
        });
        
        console.log(`✅ Successfully deleted user: ${user.username}`);
      }
      
      console.log("🎉 All 'moumen' accounts have been deleted successfully!");
    } else {
      console.log("💡 To actually delete the accounts, run: node deleteMoumenAccount.js --delete");
    }

  } catch (error) {
    console.error("❌ Error during account deletion:", error);
  }
};

const main = async () => {
  try {
    await connectDB();
    await deleteMoumenAccount();
  } catch (error) {
    console.error("❌ Script failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

main(); 