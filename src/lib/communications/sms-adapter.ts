import { EmsConfig } from "@/config/ems-config";
import twilio from "twilio";

export interface SendSmsOptions {
  to: string;
  message: string;
}

export class SmsAdapter {
  private config: NonNullable<EmsConfig["communications"]>["sms"];

  constructor(config: NonNullable<EmsConfig["communications"]>["sms"]) {
    this.config = config;
  }

  async sendSms(options: SendSmsOptions): Promise<boolean> {
    if (!this.config || this.config.provider === "none" || this.config.provider === "mock") {
      console.log(`[SmsAdapter] Mock send to ${options.to}:\nMessage: ${options.message}`);
      return true;
    }

    try {
      if (this.config.provider === "twilio") {
        const client = twilio(this.config.apiKey, this.config.apiSecret);
        const res = await client.messages.create({
          body: options.message,
          from: this.config.senderId,
          to: options.to,
        });
        console.log(`[SmsAdapter] Twilio SMS sent: ${res.sid} to ${options.to}`);
        return true;
      }
      
      if (this.config.provider === "messagebird") {
        // TODO: Implement MessageBird API
        console.log(`[SmsAdapter] MessageBird send to ${options.to}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error("[SmsAdapter] Failed to send SMS:", error);
      return false;
    }
  }
}
