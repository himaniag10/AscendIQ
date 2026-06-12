import nodemailer from 'nodemailer';

/**
 * sendEmail - Utility function to send emails via SMTP using nodemailer.
 * If SMTP configuration is missing or invalid in development mode,
 * it falls back to logging the email to the console.
 * 
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.message - Text/HTML message content
 */
const sendEmail = async (options) => {
  const isDev = process.env.NODE_ENV === 'development';
  const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER;

  // If we are in development and SMTP configuration is missing, fall back to console logging
  if (isDev && (!hasSMTP || !process.env.SMTP_PASS)) {
    console.log(`\n=============================================`);
    console.log(`[DEV MODE EMAIL LOGGER]`);
    console.log(`To:      ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message:`);
    console.log(options.message);
    console.log(`=============================================\n`);
    return;
  }

  // Define SMTP transporter configurations
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false, // true for 465, false for other ports (like 587)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Required for TLS configurations (especially Gmail port 587)
    tls: {
      rejectUnauthorized: false
    }
  });

  // Define mail details
  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'AscendIQ Support'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message, // Send as HTML
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    // If SMTP send fails, log error and fall back to console print in dev mode so the app doesn't crash
    console.error(`SMTP Email dispatch failed: ${error.message}`);
    if (isDev) {
      console.log(`\n=============================================`);
      console.log(`[FALLBACK DEV EMAIL LOGGER]`);
      console.log(`To:      ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Message:`);
      console.log(options.message);
      console.log(`=============================================\n`);
      return;
    }
    // Re-throw in production
    throw new Error('Failed to send verification or reset email.');
  }
};

export default sendEmail;
