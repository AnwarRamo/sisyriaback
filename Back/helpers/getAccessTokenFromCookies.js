// helpers/getAccessTokenFromCookies.js

const jwt = require('jsonwebtoken');
const dev = require('../config');

// Function to extract the access token from cookies
const getAccessTokenFromCookies = (cookieHeader) => {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split('; ');
  const tokenCookie = cookies.find(cookie => cookie.startsWith('accessToken='));

  return tokenCookie ? tokenCookie.split('=')[1] : null;
};

// Function to generate the access token and set it in the response cookie
const generateTokenAndSetCookie = (res, userId) => {
  const accessToken = jwt.sign(
    { _id: userId },
    String(dev.app.jwtAccessTokenKey),
    { expiresIn: '15m', algorithm: 'HS256' }
  );

  res.cookie('accessToken', accessToken, {
    maxAge: 14 * 60 * 1000, // 14 minutes
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return accessToken;
};

module.exports = { getAccessTokenFromCookies, generateTokenAndSetCookie };
