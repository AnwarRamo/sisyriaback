require('dotenv').config();

const dev = {
  db: {
    mongoURL: process.env.MONGODB_URL || 'mongodb+srv://anwarramo:anwar231366@cluster0.box35.mongodb.net/',
  },
  app: {
    port: process.env.SERVER_PORT || 8000,
    jwtAccountActivationKey: process.env.JWT_ACCOUNT_ACTIVATION_KEY,
    jwtResetPasswordKey: process.env.JWT_RESET_PASSWORD_KEY,
    jwtAccessTokenKey: process.env.JWT_ACCESS_TOKEN_KEY || 'your-default-secret-key',
    jwtRefreshTokenKey: process.env.JWT_REFRESH_TOKEN_KEY,
    smtpUsername: process.env.SMTP_USERNAME,
    smtpPassword: process.env.SMTP_PASSWORD,
    clientUrl: process.env.CLIENT_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
};
console.log("JWT_ACCESS_TOKEN_KEY:", dev.app.jwtAccessTokenKey); // Debugging output

module.exports = dev;
