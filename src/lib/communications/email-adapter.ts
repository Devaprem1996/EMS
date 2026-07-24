import { EmsConfig } from "@/config/ems-config";
import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

export class EmailAdapter {
  private config: NonNullable<EmsConfig["communications"]>["email"];

  constructor(config: NonNullable<EmsConfig["communications"]>["email"]) {
    this.config = config;
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.config || this.config.provider === "none") {
      console.log(`[EmailAdapter] Mock send to ${options.to}:\nSubject: ${options.subject}\nHTML: ${options.bodyHtml}`);
      return true;
    }

    try {
      if (this.config.provider === "smtp") {
        const transporter = nodemailer.createTransport({
          host: this.config.smtpHost,
          port: this.config.smtpPort,
          secure: this.config.smtpPort === 465,
          auth: {
            user: this.config.smtpUser,
            pass: this.config.smtpPass,
          },
        });

        const info = await transporter.sendMail({
          from: `"${this.config.senderName || "Safeway EMS"}" <${this.config.senderEmail || "no-reply@safeway.com"}>`,
          to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
          subject: options.subject,
          text: options.bodyText || options.subject,
          html: options.bodyHtml,
        });

        console.log(`[EmailAdapter] SMTP email sent: ${info.messageId} to ${options.to}`);
        return true;
      }
      
      if (this.config.provider === "sendgrid") {
        // TODO: Implement SendGrid API using this.config.apiKey
        console.log(`[EmailAdapter] SendGrid send to ${options.to}`);
        return true;
      }

      if (this.config.provider === "ses") {
        // TODO: Implement AWS SES using this.config.apiKey
        console.log(`[EmailAdapter] AWS SES send to ${options.to}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error("[EmailAdapter] Failed to send email:", error);
      return false;
    }
  }
}
