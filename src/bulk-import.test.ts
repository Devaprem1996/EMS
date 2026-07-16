import { describe, it, expect } from "vitest"; 
import { EMS_CONFIG } from "./config/ems-config"; 

function resolveTargetStage(uploadTo: string | null | undefined, enquiryStatus?: string | null) { 
  const target = (uploadTo || "").trim().toLowerCase(); 
  if (["refilling","refill","r"].includes(target)) return { stage: "REFILLING", status: "Refilling Order Received" }; 
  if (["service","services","s"].includes(target)) return { stage: "SERVICES", status: "Pending" }; 
  return { stage: "ENQUIRY", status: enquiryStatus || "Enquiry Registered" }; 
} 

function calculateAmcDate(d: Date, y: number) { 
  const r = new Date(d); 
  r.setFullYear(r.getFullYear() + y); 
  return r; 
} 

function isDeliveryBeforeEnquiry(e: Date, d: Date) { 
  const d1 = new Date(e.getFullYear(), e.getMonth(), e.getDate()); 
  const d2 = new Date(d.getFullYear(), d.getMonth(), d.getDate()); 
  return d2 < d1; 
} 

function resolveAssignFor(s: string | null | undefined) { 
  if (s === "SERVICES") return "SERVICE"; 
  if (s === "REFILLING") return "REFILLING"; 
  return null; 
} 

describe("Bulk Import Routing", () => { 
  it("Refilling->REFILLING", () => { 
    const r = resolveTargetStage("Refilling"); 
    expect(r.stage).toBe("REFILLING"); 
    expect(r.status).toBe("Refilling Order Received"); 
  }); 
  it("refilling lowercase->REFILLING", () => expect(resolveTargetStage("refilling").stage).toBe("REFILLING")); 
  it("refill alias->REFILLING", () => expect(resolveTargetStage("refill").stage).toBe("REFILLING")); 
  it("R shorthand->REFILLING", () => expect(resolveTargetStage("R").stage).toBe("REFILLING")); 
  it("Service->SERVICES", () => { 
    const r = resolveTargetStage("Service"); 
    expect(r.stage).toBe("SERVICES"); 
    expect(r.status).toBe("Pending"); 
  }); 
  it("Services plural->SERVICES", () => expect(resolveTargetStage("Services").stage).toBe("SERVICES")); 
  it("S shorthand->SERVICES", () => expect(resolveTargetStage("S").stage).toBe("SERVICES")); 
  it("blank->ENQUIRY", () => { 
    const r = resolveTargetStage(""); 
    expect(r.stage).toBe("ENQUIRY"); 
    expect(r.status).toBe("Enquiry Registered"); 
  }); 
  it("blank uses custom status", () => expect(resolveTargetStage("", "Order Confirmed").status).toBe("Order Confirmed")); 
  it("unknown->ENQUIRY", () => expect(resolveTargetStage("Random").stage).toBe("ENQUIRY")); 
  it("whitespace->ENQUIRY", () => expect(resolveTargetStage("   ").stage).toBe("ENQUIRY")); 
}); 

describe("assignFor Resolution", () => { 
  it("SERVICES->SERVICE", () => expect(resolveAssignFor("SERVICES")).toBe("SERVICE")); 
  it("REFILLING->REFILLING", () => expect(resolveAssignFor("REFILLING")).toBe("REFILLING")); 
  it("ENQUIRY->null", () => expect(resolveAssignFor("ENQUIRY")).toBeNull()); 
}); 

describe("AMC Date", () => { 
  it("1 year", () => { 
    const a = calculateAmcDate(new Date(2025, 6, 15), 1); 
    expect(a.getFullYear()).toBe(2026); 
    expect(a.getDate()).toBe(15); 
  }); 
  it("3 years", () => expect(calculateAmcDate(new Date(2025, 0, 1), 3).getFullYear()).toBe(2028)); 
  it("no mutate", () => { 
    const d = new Date(2025, 0, 1); 
    const t = d.getTime(); 
    calculateAmcDate(d, 1); 
    expect(d.getTime()).toBe(t); 
  }); 
}); 

describe("Date Validation", () => { 
  it("before->invalid", () => expect(isDeliveryBeforeEnquiry(new Date(2025, 6, 15), new Date(2025, 6, 10))).toBe(true)); 
  it("same day->valid", () => expect(isDeliveryBeforeEnquiry(new Date(2025, 6, 15), new Date(2025, 6, 15))).toBe(false)); 
  it("after->valid", () => expect(isDeliveryBeforeEnquiry(new Date(2025, 6, 15), new Date(2025, 6, 20))).toBe(false)); 
  it("cross month->valid", () => expect(isDeliveryBeforeEnquiry(new Date(2025, 6, 30), new Date(2025, 7, 1))).toBe(false)); 
}); 

describe("Config Mappings", () => { 
  it("targetDashboard exists", () => expect(EMS_CONFIG.importMappings.targetDashboard).toBeDefined()); 
  it("has upload to alias", () => expect(EMS_CONFIG.importMappings.targetDashboard).toContain("upload to")); 
  it("has target dashboard alias", () => expect(EMS_CONFIG.importMappings.targetDashboard).toContain("target dashboard")); 
  it("all keys present", () => { 
    ["customerName", "contactPerson", "phone", "requirementCategory", "enquiryDate", "enquiryStatus", "assignedTechnicians", "targetDashboard"].forEach(k => expect(EMS_CONFIG.importMappings).toHaveProperty(k)); 
  }); 
});

