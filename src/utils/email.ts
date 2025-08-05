import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string; // Add this optional property
}

export const sendEmail = async (options: EmailOptions) => {
  const mailOptions = {
    from: `"LendLocal" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    ...(options.html && { html: options.html }), // Include html if provided
  };

  await transporter.sendMail(mailOptions);
};