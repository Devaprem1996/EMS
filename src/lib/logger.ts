/**
 * EMS Platform Centralized Telemetry & Logger
 * 
 * In a multi-instance, single-tenant SaaS architecture, if an error occurs,
 * it is critical to know WHICH tenant experienced the error.
 * 
 * This logger wraps standard console.error with Tenant Context and is 
 * designed to be a drop-in replacement for APM tools like Sentry, Datadog, 
 * or Winston.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogContext {
  tenantId?: string;
  userId?: string;
  path?: string;
  [key: string]: any;
}

class TelemetryLogger {
  private baseTenantId: string = "UNKNOWN_TENANT";

  /**
   * For single-tenant deployments, the Tenant ID is usually injected
   * via an environment variable by the provisioning script (Phase 6.2).
   */
  constructor() {
    if (process.env.NEXT_PUBLIC_TENANT_ID) {
      this.baseTenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    } else if (process.env.DATABASE_URL) {
      // Fallback: Try to extract tenant name from SQLite database filename
      const match = process.env.DATABASE_URL.match(/tenant_([a-z0-9]+)\.db/i);
      if (match) this.baseTenantId = match[1].toUpperCase();
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const tenant = context?.tenantId || this.baseTenantId;
    const ctxString = context ? ` | Ctx: ${JSON.stringify(context)}` : '';
    
    return `[${timestamp}] [${level}] [Tenant: ${tenant}] ${message}${ctxString}`;
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage('INFO', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('WARN', message, context));
  }

  error(message: string, error?: any, context?: LogContext) {
    const msg = this.formatMessage('ERROR', message, context);
    console.error(msg);
    if (error) {
      console.error(error);
    }
    // TODO: Sentry.captureException(error, { tags: { tenant: this.baseTenantId } });
  }

  fatal(message: string, error?: any, context?: LogContext) {
    const msg = this.formatMessage('FATAL', message, context);
    console.error(`🚨 FATAL: ${msg}`);
    if (error) {
      console.error(error);
    }
    // TODO: APM Critical Alert Trigger
  }
}

export const logger = new TelemetryLogger();
