const User = require('../models/users');
const createError = require('http-errors');
const bcrypt = require('bcrypt');

const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const createUser = async (userData) => {
  const { name, email, password, phone, image } = userData;

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError(400, 'User with this email already exists');
  }

  // Hash the password before saving
  const salt = await bcrypt.genSalt(10);  // Generate salt properly
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    name,
    email,
    password: hashedPassword, // Store the hashed password
    phone,
    image: image || process.env.DEFAULT_USER_IMAGE_PATH || 'public/images/users/default.png', // Default image handling
  });

  const savedUser = await newUser.save();
  if (!savedUser) {
    throw createError(500, 'Failed to create user account');
  }

  return savedUser;
};

module.exports = {
  findUserByEmail,
  createUser,
};
