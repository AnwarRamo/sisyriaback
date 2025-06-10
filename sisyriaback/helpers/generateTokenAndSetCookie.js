const jwt = require('jsonwebtoken');
const dev = require('../config');

const generateTokenAndSetCookie = (res, userId) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const accessToken = jwt.sign(
    { _id: userId },
    String(dev.app.jwtAccessTokenKey),
    {
      expiresIn: '1h', // Increased expiration time to 1 hour
      algorithm: 'HS256'
    }
  );

  res.cookie('accessToken', accessToken, {
    maxAge: 3600000, // 1 hour in milliseconds
    httpOnly: true,
    secure: isProduction,
    sameSite: 'Strict', // Ensures proper cross-site behavior
  });

  return accessToken;
};

module.exports = { generateTokenAndSetCookie };
