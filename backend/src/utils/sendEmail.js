import nodemailer from 'nodemailer';
import dns from 'dns';

// Force IPv4 for DNS resolution (fixes ENETUNREACH IPv6 routing errors on platforms like Render)
dns.setDefaultResultOrder('ipv4first');

/**
 * sendEmail - Utility function to send emails via SMTP using nodemailer.
 * If SMTP configuration is missing or invalid in development mode,
 * it falls back to logging the email to the console.
 * 
 * @param {Object} options - Email options
 */
const sendEmail = async (options) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER;

  if (isDev && (!hasSMTP || !process.env.SMTP_PASS)) {
    console.log(`\n=============================================`);
    console.log(`[DEV MODE EMAIL LOGGER]`);
    console.log(`To:      ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message:\n${options.message}`);
    console.log(`=============================================\n`);
    return;
  }

  // Ensure config is present in production (startup script handles this, but double check)
  if (!hasSMTP || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials are missing. Check environment variables.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000, // 10 seconds to connect
    greetingTimeout: 5000,    // 5 seconds for greeting
    socketTimeout: 15000,     // 15 seconds of inactivity
  });

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'AscendIQ Support'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`SMTP Email dispatch failed: ${error.message}`);
    if (isDev) {
      console.log(`[FALLBACK DEV EMAIL LOGGER]\nSubject: ${options.subject}\nTo: ${options.email}`);
      return;
    }
    throw new Error('Failed to send verification or reset email.');
  }
};

export default sendEmail;
