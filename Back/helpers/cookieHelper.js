const jwt = require('jsonwebtoken');
const dev = require('../config');

const generateTokenAndSetCookie = (res, userId) => {
  if (!dev.app.jwtAccessTokenKey) {
    throw new Error("JWT secret key is missing! Check .env file.");
  }

  const accessToken = jwt.sign(
    { _id: userId },
    dev.app.jwtAccessTokenKey, // ✅ Corrected key
    { expiresIn: '15m' }
  );

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 15 * 60 * 1000,
    domain: process.env.NODE_ENV === 'production' ? dev.app.cookieDomain : undefined,
    path: '/',
  });

  return accessToken;
};

const getAccessTokenFromCookies = (req) => {
  if (!req.cookies) return null;
  return req.cookies.accessToken || null;
};

module.exports = { generateTokenAndSetCookie, getAccessTokenFromCookies };
