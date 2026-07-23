import { EmsConfig } from "@/config/ems-config";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

export class EmailAdapter {
  private config: EmsConfig["communications"]["email"];

  constructor(config: EmsConfig["communications"]["email"]) {
    this.config = config;
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.config || this.config.provider === "none") {
      console.log(`[EmailAdapter] Mock send to ${options.to}: ${options.subject}`);
      return true;
    }

    try {
      if (this.config.provider === "smtp") {
        // TODO: Implement Nodemailer for SMTP using this.config.smtpHost, etc.
        console.log(`[EmailAdapter] SMTP send to ${options.to}`);
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
