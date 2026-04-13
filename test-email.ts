import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.sendMail({
  from: `"Test" <${process.env.SMTP_USER}>`,
  to: 'exploration.codee@gmail.com',
  subject: 'Test Email',
  text: 'This is a test email'
}).then(info => {
  
}).catch(err => {
  console.error('Error:', err.message);
});
