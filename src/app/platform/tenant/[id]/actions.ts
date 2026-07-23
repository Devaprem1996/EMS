"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateTenantConfig(tenantId: string, newConfigObj: any) {
  // Check if system config exists for this tenant
  const existingConfig = await prisma.systemConfig.findFirst({
    where: { tenantId }
  });

  if (existingConfig) {
    await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: { config: JSON.stringify(newConfigObj) }
    });
  } else {
    // Should never really happen if seeded properly, but fallback
    await prisma.systemConfig.create({
      data: {
        id: `config-${tenantId}`,
        tenantId,
        config: JSON.stringify(newConfigObj)
      }
    });
  }

  revalidatePath(`/platform/tenant/${tenantId}`);
  return { success: true };
}
