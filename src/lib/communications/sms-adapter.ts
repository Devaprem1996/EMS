import { EmsConfig } from "@/config/ems-config";

export interface SendSmsOptions {
  to: string;
  message: string;
}

export class SmsAdapter {
  private config: EmsConfig["communications"]["sms"];

  constructor(config: EmsConfig["communications"]["sms"]) {
    this.config = config;
  }

  async sendSms(options: SendSmsOptions): Promise<boolean> {
    if (!this.config || this.config.provider === "none" || this.config.provider === "mock") {
      console.log(`[SmsAdapter] Mock send to ${options.to}: ${options.message}`);
      return true;
    }

    try {
      if (this.config.provider === "twilio") {
        // TODO: Implement Twilio API using this.config.apiKey & apiSecret
        console.log(`[SmsAdapter] Twilio send to ${options.to}`);
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
