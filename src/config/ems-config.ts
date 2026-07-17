export interface DynamicField {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "date" | "select" | "multi-select";
  options?: string[];
  required?: boolean;
}

export interface StageConfig {
  enabled: boolean;
  displayName: string;
  fields: DynamicField[];
}

export interface EmsConfig {
  brand: {
    title: string;
    subtitle: string;
    logoUrl?: string;
    theme: {
      primaryColor: string;
      accentColor: string;
      darkTheme: boolean;
    };
    labels?: {
      serialNumber?: string;
      capacity?: string;
      extinguisherType?: string;
      itemDescription?: string;
      deliveredDate?: string;
      amcYears?: string;
      amcDate?: string;
    };
  };
  stages: {
    ENQUIRY: StageConfig;
    REFILLING: StageConfig;
    SERVICES: StageConfig;
  };
  importMappings: {
    jobNumber: string[];
    customerName: string[];
    contactPerson: string[];
    phone: string[];
    phone2: string[];
    email: string[];
    address: string[];
    serialNumber: string[];
    capacity: string[];
    extinguisherType: string[];
    itemDescription: string[];
    enquirySource: string[];
    requirementCategory: string[];
    enquiryDate: string[];
    requestedDeliveryDate: string[];
    enquiryStatus: string[];
    followUpDate: string[];
    followUpRemarks: string[];
    visitDate: string[];
    adminInstructions: string[];
    technicianInstructions: string[];
    customerLocation: string[];
    deliveredDate: string[];
    amcYears: string[];
    assignedTechnicians: string[];
    targetDashboard: string[];
  };
  categories?: string[];
  sources?: string[];
}

export const EMS_CONFIG: EmsConfig = {
  categories: ["CCTV", "New Fire Extinguisher", "Refilling"],
  sources: ["Existing Customers", "Social Media", "Phone Call", "Walk-in", "Email Enquiry", "Field Agent", "Website"],
  brand: {
    title: "Safeway",
    subtitle: "Enquiry Management System",
    theme: {
      primaryColor: "#dc2626", // Fire Engine Red
      accentColor: "#ef4444",
      darkTheme: false,
    },
    labels: {
      serialNumber: "Cylinder Tag / Serial No",
      capacity: "Cylinder Capacity",
      extinguisherType: "Extinguisher Type",
      itemDescription: "Item Description",
      deliveredDate: "Delivered Date",
      amcYears: "No. of Years",
      amcDate: "Next Refilling Date (Calculated)",
    },
  },
  stages: {
    ENQUIRY: {
      enabled: true,
      displayName: "Enquiry",
      fields: [
        {
          key: "source",
          label: "Source",
          type: "select",
          options: ["Walk-in", "Phone Call", "Email Enquiry", "Field Agent", "Website"],
          required: false,
        },
        {
          key: "urgency",
          label: "Urgency Level",
          type: "select",
          options: ["Low", "Medium", "High", "Critical"],
          required: false,
        },
      ],
    },
    REFILLING: {
      enabled: true,
      displayName: "Refilling",
      fields: [
        {
          key: "pressureTestPassed",
          label: "Hydrostatic Pressure Test Passed?",
          type: "boolean",
          required: true,
        },
        {
          key: "refillMediumQty",
          label: "Refilled Gas Qty (kg)",
          type: "number",
          required: true,
        },
        {
          key: "tareWeight",
          label: "Tare Weight (kg)",
          type: "number",
          required: false,
        },
        {
          key: "grossWeight",
          label: "Gross Weight (kg)",
          type: "number",
          required: true,
        },
      ],
    },
    SERVICES: {
      enabled: true,
      displayName: "Services",
      fields: [
        {
          key: "serviceType",
          label: "Service Done",
          type: "select",
          options: ["Hydrotesting", "Valve Replaced", "Safety Pin Replaced", "Gauge Replaced", "External Painting", "General Maintenance"],
          required: true,
        },
        {
          key: "partsReplaced",
          label: "Parts Replaced",
          type: "multi-select",
          options: ["Valve", "Pressure Gauge", "Discharge Hose", "Safety Pin", "Wall Bracket", "Squeeze Handle"],
        },
        {
          key: "nextServiceDate",
          label: "Next Service Due",
          type: "date",
          required: true,
        },
      ],
    },
  },
  importMappings: {
    jobNumber: ["job number", "extinguisher id", "ticket #", "job_no", "id", "jobno"],
    customerName: ["customer name", "client name", "customer", "client", "company_name", "company"],
    contactPerson: ["contact person name", "contact person", "contact_person", "contactperson"],
    phone: ["mobile", "contact", "phone", "phone number", "mobile_no", "contact_no", "contact no 1", "contact no1"],
    phone2: ["mobile 2", "contact 2", "phone 2", "phone number 2", "mobile_no2", "contact_no2", "contact no 2", "contact no2"],
    email: ["email", "email address", "email_id"],
    address: ["address", "location", "site_address"],
    serialNumber: ["cylinder s/n", "serial no", "tag number", "serial_number", "cylinder_no", "serial"],
    capacity: ["weight", "capacity", "size", "volume"],
    extinguisherType: ["type", "extinguisher type", "medium", "agent"],
    itemDescription: ["description", "item description", "remarks", "notes"],
    enquirySource: ["source", "enquiry source", "enquiry_source"],
    requirementCategory: ["requirement category", "category", "requirement_category"],
    enquiryDate: ["enquiry date", "created date", "enquiry_date", "date"],
    requestedDeliveryDate: ["requested delivery date", "delivery date", "delivery_date"],
    enquiryStatus: ["enquiry status", "status", "enquiry_status", "status name", "status_name"],
    followUpDate: ["follow up date", "next follow up date", "followup_date"],
    followUpRemarks: ["follow up remarks", "remarks", "followup_notes", "follow_up_notes"],
    visitDate: ["visit date", "service date", "visit_date", "visitdate"],
    adminInstructions: ["admin instructions", "admin_instructions"],
    technicianInstructions: ["technician instructions", "technician_instructions"],
    customerLocation: ["customer location", "map url", "coordinates", "location_url"],
    deliveredDate: ["delivered date", "delivered_date"],
    amcYears: ["amc years", "amc_years", "no of years", "no. of years"],
    assignedTechnicians: ["assigned technicians", "technicians", "assigned employees", "assigned_techs"],
    targetDashboard: ["upload to", "target dashboard", "dashboard", "upload_to", "target", "route to", "send to"],
  },
};
