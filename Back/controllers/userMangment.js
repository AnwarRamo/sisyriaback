// controllers/userController.js
import User from "../models/user.model.js";
import Follow from "../models/follow.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const authorizeUser = (req, targetId) => {
  const isAdmin = req.user.role === 'admin';
  const isOwner = req.user.userId === targetId.toString();
  return isAdmin || isOwner;
};

// ADD a new user (Registration)
export const addUser = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Validation
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ code: 'INVALID_ROLE' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ code: 'USER_EXISTS' });
    }

    const newUser = await User.create({
      username,
      email,
      hashedPassword: await bcrypt.hash(password, 12),
      role
    });

    res.status(201).json({
      code: 'USER_CREATED',
      user: { id: newUser._id, username: newUser.username, role: newUser.role }
    });

  } catch (error) {
    console.error("Add user error:", error);
    const code = error.code === 11000 ? 'DUPLICATE_ENTRY' : 'CREATE_FAILED';
    res.status(500).json({ code, message: error.message });
  }
};




// GET user by username
export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ username: new RegExp(`^${req.params.username}$`, "i") })
      .select('-hashedPassword -__v -email')
      .lean();

    if (!user) return res.status(404).json({ code: 'USER_NOT_FOUND' });

    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id })
    ]);

    const isFollowing = req.user?.userId 
      ? Boolean(await Follow.exists({ follower: req.user.userId, following: user._id }))
      : false;

    res.json({
      ...user,
      stats: { followers: followerCount, following: followingCount },
      isFollowing
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ code: 'SERVER_ERROR', message: error.message });
  }
};

// UPDATE user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ code: 'INVALID_ID' });
    }

    // Check if the user is authorized to perform the update
    if (!authorizeUser(req, id)) {
      return res.status(403).json({ code: 'FORBIDDEN' });
    }

    const updates = { ...req.body };

    if (updates.password) {
      updates.hashedPassword = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).select('-hashedPassword -__v');

    if (!user) {
      return res.status(404).json({ code: 'USER_NOT_FOUND' });
    }

    return res.json({ code: 'USER_UPDATED', user });
  } catch (error) {
    console.error('Update user error:', error);
    const code = error.code === 11000 ? 'DUPLICATE_FIELD' : 'UPDATE_FAILED';
    res.status(500).json({ code, message: error.message });
  }
};

// DELETE user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!authorizeUser(req, id)) {
      return res.status(403).json({ code: 'FORBIDDEN' });
    }

    const user = await User.findByIdAndDelete(id);
    
    if (!user) return res.status(404).json({ code: 'USER_NOT_FOUND' });
    
    // Cleanup related data
    await Promise.all([
      Follow.deleteMany({ $or: [{ follower: id }, { following: id }] }),
      // Add other model cleanups as needed
    ]);

    res.json({ code: 'USER_DELETED', userId: id });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ code: 'DELETE_FAILED', message: error.message });
  }
};

// GET all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ code: 'ADMIN_REQUIRED' });
    }

    const users = await User.find()
      .select('-hashedPassword -__v')
      .lean();

    res.json(users);

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ code: 'FETCH_FAILED', message: error.message });
  }
};