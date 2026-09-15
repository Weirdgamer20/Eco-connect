import nodemailer from "nodemailer";
import { getEnv } from "./env";

let _transporter: nodemailer.Transporter | undefined;

function getTransporter() {
  if (!_transporter) {
    const env = getEnv();

    if (env.NODE_ENV === "development" || !env.SMTP_HOST) {
      // Use Ethereal (fake SMTP) for development
      _transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
          user: env.SMTP_USER || "test@ethereal.email",
          pass: env.SMTP_PASS || "testpassword",
        },
      });
    } else {
      _transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }
  return _transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const env = getEnv();

  if (env.NODE_ENV === "development" || !env.SMTP_HOST) {
    console.log(`[Email MOCK] To: ${options.to} | Subject: ${options.subject}`);
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}
