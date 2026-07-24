import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { invalidateJobsAndTasks } from "@/lib/cache";
import { EMS_CONFIG } from "@/config/ems-config";
import { EmailAdapter } from "@/lib/communications/email-adapter";
import { SmsAdapter } from "@/lib/communications/sms-adapter";

// POST /api/jobs/bulk-transition - Bulk transition jobs to a new stage
// Flow 1: Only "Order Confirmed" tickets are eligible to transition to REFILLING.
// Tickets that are not "Order Confirmed" are skipped and reported back to the caller.
export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobIds, toStage, toStatus, skipStatusCheck } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: "jobIds must be a non-empty array" }, { status: 400 });
    }

    if (!toStage) {
      return NextResponse.json({ error: "toStage is required" }, { status: 400 });
    }

    let transitioned = 0;
    const skippedTickets: string[] = [];
    const notificationsToSend: any[] = [];

    // Perform transaction
    await prisma.$transaction(async (tx: any) => {
      for (const id of jobIds) {
        // 1. Find job (ticket)
        const job = await tx.ticket.findUnique({
          where: { id },
          include: { customer: true }
        });
        if (!job) continue;

        // Flow 1 Guard: For REFILLING transitions, only allow "Order Confirmed" tickets.
        // skipStatusCheck=true is used by auto-route (Flow 3) which creates and immediately routes.
        if (toStage === "REFILLING" && !skipStatusCheck && job.currentStatus !== "Order Confirmed") {
          skippedTickets.push(job.ticketNumber);
          continue;
        }

        const nextStatus =
          toStatus ||
          (toStage === "REFILLING"
            ? "Refilling Order Received"
            : toStage === "SERVICES"
            ? "Pending"
            : "Completed");

        // 2. Update stage and status
        await tx.ticket.update({
          where: { id },
          data: {
            currentStage: toStage,
            currentStatus: nextStatus,
            updatedBy: session.userId,
          },
        });

        // 3. Add history record
        await tx.ticketHistory.create({
          data: {
            ticketId: id,
            changedById: session.userId,
            fromStage: job.currentStage,
            toStage: toStage,
            fromStatus: job.currentStatus,
            toStatus: nextStatus,
            remarks: `Transitioned stage from ${job.currentStage} to ${toStage}`,
            createdBy: session.userId,
            updatedBy: session.userId,
          },
        });

        if (job.customer) {
          notificationsToSend.push({
            ticketNumber: job.ticketNumber,
            customerEmail: job.customer.email,
            customerPhone: job.customer.secondaryPhone || job.customer.primaryPhone,
            customerName: job.customer.companyName || job.customer.contactName || "Customer",
            oldStage: job.currentStage,
            newStage: toStage,
            oldStatus: job.currentStatus,
            newStatus: nextStatus,
          });
        }

        transitioned++;
      }
    });

    // Invalidate cached lists
    invalidateJobsAndTasks();

    // Trigger alerts in background asynchronously
    if (notificationsToSend.length > 0) {
      (async () => {
        try {
          const emailConfig = EMS_CONFIG.communications?.email;
          const smsConfig = EMS_CONFIG.communications?.sms;

          const emailAdapter = emailConfig ? new EmailAdapter(emailConfig) : null;
          const smsAdapter = smsConfig ? new SmsAdapter(smsConfig) : null;

          for (const item of notificationsToSend) {
            // Email Transition Alert
            if (emailAdapter && item.customerEmail) {
              await emailAdapter.sendEmail({
                to: item.customerEmail,
                subject: `[Safeway Alert] Cylinder ${item.ticketNumber} Update`,
                bodyHtml: `
                  <div style="font-family: sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #ef4444; margin-top: 0; font-size: 20px; font-weight: 800;">Safeway CRM</h2>
                    <p style="font-size: 14px; color: #cbd5e1;">Dear ${item.customerName},</p>
                    <p style="font-size: 14px; color: #cbd5e1;">Your cylinder registration record <strong>${item.ticketNumber}</strong> has been updated:</p>
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 16px; margin: 15px 0;">
                      <table style="border-collapse: collapse; width: 100%; font-size: 13.5px;">
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                          <td style="padding: 8px 0; color: #94a3b8;">Previous Status:</td>
                          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #e2e8f0;">${item.oldStage} (${item.oldStatus})</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8;">New Active Status:</td>
                          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #a3e635;">${item.newStage} (${item.newStatus})</td>
                        </tr>
                      </table>
                    </div>
                    <p style="font-size: 11.5px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; margin-bottom: 0; text-align: center;">
                      This is an automated notification from Safeway Enquiry Management System.
                    </p>
                  </div>
                `
              }).catch(err => console.error("[Bulk Transition Notification] Email dispatch error:", err));
            }

            // SMS Transition Alert
            if (smsAdapter && item.customerPhone) {
              const smsText = `Safeway CRM: Cylinder ${item.ticketNumber} transitioned to ${item.newStage} (${item.newStatus}).`;
              await smsAdapter.sendSms({
                to: item.customerPhone,
                message: smsText
              }).catch(err => console.error("[Bulk Transition Notification] SMS dispatch error:", err));
            }
          }
        } catch (err) {
          console.error("[Bulk Transition Notification] Communications thread error:", err);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      transitioned,
      skipped: skippedTickets.length,
      skippedTickets,
    });
  } catch (error) {
    console.error("[Bulk Transition API] Error:", error);
    return NextResponse.json({ error: "Failed to perform bulk transition" }, { status: 500 });
  }
}

