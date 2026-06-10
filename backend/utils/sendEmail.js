const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"QuickSeva" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
};

const otpEmailTemplate = (otp) => `
  <div style="font-family:Arial,sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px;">
    <h2 style="color:#f97316;">QuickSeva</h2>
    <p>Your OTP for verification is:</p>
    <h1 style="letter-spacing:8px;color:#1e293b;">${otp}</h1>
    <p style="color:#64748b;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
  </div>
`;

const orderEmailTemplate = (orderNumber, status) => `
  <div style="font-family:Arial,sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px;">
    <h2 style="color:#f97316;">QuickSeva</h2>
    <p>Your order <strong>#${orderNumber}</strong> status has been updated to:</p>
    <h3 style="color:#16a34a;">${status.toUpperCase()}</h3>
    <p style="color:#64748b;">Log in to QuickSeva for details.</p>
  </div>
`;

module.exports = { sendEmail, otpEmailTemplate, orderEmailTemplate };
