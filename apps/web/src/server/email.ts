import nodemailer from "nodemailer";
import { log } from "./log";

/** Sends transactional email via SMTP_URL. Without SMTP, links are logged (development only). */
export async function sendEmail(to: string, subject: string, text: string) {
  const url = process.env.SMTP_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      log.error("email.not_configured", { subject });
      throw new Error("Email is not configured");
    }
    log.info("email.dev_outbox", { to, subject, text });
    return;
  }
  const transport = nodemailer.createTransport(url);
  await transport.sendMail({ from: process.env.EMAIL_FROM, to, subject, text });
}
