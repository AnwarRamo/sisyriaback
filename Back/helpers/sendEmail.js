const dev = require('../config');
const nodemailer = require('nodemailer');

exports.sendEmailWithNodeMailer = async (emailData) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Set to true if using port 465
      auth: {
        user: process.env.SMTP_USERNAME || dev.app.smtpUsername,
        pass: process.env.SMTP_PASSWORD || dev.app.smtpPassword,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_USERNAME || dev.app.smtpUsername,
      to: emailData.email,
      subject: emailData.subject,
      html: emailData.html,
    };

    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.response);
  } catch (error) {
    console.error('-----SMTP ERROR--------');
    console.error('Problem sending email: ', error.message); // Log only the error message
    throw error; // Optionally re-throw the error for further handling
  }
};