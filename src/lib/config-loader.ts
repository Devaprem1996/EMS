import { prisma } from "@/lib/db";
import { EMS_CONFIG, EmsConfig } from "@/config/ems-config";

export async function getDbConfig(tenantId?: string | null): Promise<EmsConfig> {
  try {
    const record = await prisma.systemConfig.findFirst({
      where: tenantId ? { tenantId } : { id: "default" },
    });
    if (record && record.config) {
      const dbConfig = JSON.parse(record.config);
      // Fully merge settings, prioritizing database overrides
      return {
        categories: dbConfig.categories || EMS_CONFIG.categories,
        sources: dbConfig.sources || EMS_CONFIG.sources,
        importMappings: {
          ...EMS_CONFIG.importMappings,
          ...(dbConfig.importMappings || {}),
        },
        brand: {
          ...EMS_CONFIG.brand,
          ...(dbConfig.brand || {}),
          theme: {
            ...EMS_CONFIG.brand.theme,
            ...(dbConfig.brand?.theme || {}),
          },
          labels: {
            ...EMS_CONFIG.brand.labels,
            ...(dbConfig.brand?.labels || {}),
          },
        },
        stages: {
          ...EMS_CONFIG.stages,
          ...(dbConfig.stages || {}),
        },
      };
    }
  } catch (error) {
    console.error("[Config Loader] Error loading config from database:", error);
  }
  return EMS_CONFIG;
}
