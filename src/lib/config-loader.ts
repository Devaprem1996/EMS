import { prisma } from "@/lib/db";
import { EMS_CONFIG, EmsConfig } from "@/config/ems-config";

export async function getDbConfig(tenantId?: string | null): Promise<EmsConfig> {
  try {
    const record = await prisma.systemConfig.findFirst({
      where: tenantId ? { tenantId } : { id: "default" },
    });
    if (record && record.config) {
      const dbConfig = JSON.parse(record.config);
      // Merge: load dynamic branding & theme from DB; keep system requirements (stages, fields, categories, importMappings) strictly from centralized EMS_CONFIG.
      return {
        ...EMS_CONFIG,
        brand: {
          ...EMS_CONFIG.brand,
          ...(dbConfig.brand || {}),
        },
      };
    }
  } catch (error) {
    console.error("[Config Loader] Error loading config from database:", error);
  }
  return EMS_CONFIG;
}
