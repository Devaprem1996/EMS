# 🧠 Safeway EMS: System Design Learning Playbook

This reference guide documents system design patterns, architectures, and practice exercises based on the Safeway EMS system. It is designed for low-code/no-code developers to reference as they learn the mechanics of scalable application development.

---

## 🎨 Pattern 1: Configuration-Driven UI (No-Code forms)

### How it works:
Instead of hardcoding inputs in HTML:
```html
<!-- Hardcoded: Hard to change -->
<input type="text" placeholder="Tare Weight" />
```
We define fields in a JSON config schema:
```typescript
const fields = [
  { key: "tareWeight", label: "Tare Weight", type: "number" }
];
```
And loop over them in React to generate the inputs dynamically:
```tsx
{fields.map((field) => (
  <div key={field.key}>
    <label>{field.label}</label>
    <input type={field.type} name={field.key} />
  </div>
))}
```

### 🎯 Practice Exercise:
Add a new dropdown select under enquiry in [ems-config.ts](file:///c:/Users/Guvi/Desktop/PW/EMS/src/config/ems-config.ts) for *"Preferred Contact Channel"*. Set option strings to `["Phone Call", "WhatsApp", "Email"]`. Observe how the UI renders this dropdown and saves it to the database with zero code edits.

---

## 💾 Pattern 2: Hybrid Relational + JSON Database Model

### How it works:
SQLite databases require rigid table structures. To support custom client fields without modifying the database structure, we use the `stageData` column in the `Ticket` table as a serialized JSON string.

- **Structured Fields**: `id`, `ticketNumber`, `customerId`, `currentStage` (indexed, fast queries).
- **Dynamic Fields**: `stageData = '{"tareWeight": 14.5, "pressureTestPassed": true}'`.

### How to query JSON fields in Prisma:
To fetch all tickets where the pressure test failed (assuming SQLite JSON functions):
```typescript
const failedTests = await prisma.ticket.findMany({
  where: {
    stageData: {
      path: "$.pressureTestPassed",
      equals: false
    }
  }
});
```

---

## 🔑 Pattern 3: HMAC Cookie Session Authentication

### How it works:
We check sessions inside [middleware.ts](file:///c:/Users/Guvi/Desktop/PW/EMS/src/middleware.ts) without querying the database on every single page load.
1. The user logs in. The server creates a session payload: `{ "userId": "123", "role": "ADMIN", "exp": 1799999999 }`.
2. The server signs this payload using a `SESSION_SECRET` key to create a signature.
3. The server joins them: `payload.signature` and stores it in the cookie.
4. When a new page loads, the middleware splits the cookie, verifies the signature against the payload, and validates expiration. If valid, the user is let in.

---

## 📐 System Design Glossary & Best Practices

1. **Multi-Tenancy**: Serving multiple clients from a single codebase deployment. Isolated subdomains (e.g. `client.ems.com`) dynamically routes requests to client database contexts.
2. **SLA (Service Level Agreement) Tracking**: Code calculations that check if a job is completed within its target duration.
3. **Database Seeding**: An automated script (`prisma/seed.ts`) that populates the database with initial values, roles, and configuration rows, allowing you to spin up a fresh instance instantly.
4. **API Rate Limiting**: Placing restrictions on the number of requests a single IP can make within a minute, protecting server resources from overload.

---

## 📨 Pattern 4: Unified Communications Adapter Pattern

### How it works:
When building integrations for email or SMS, developers often hardcode SMTP configurations or API payloads (like Twilio or AWS SNS) directly inside their endpoints. Under whitelabeling or multi-tenancy, this is a major anti-pattern. Instead, we use the **Adapter Pattern**:
1. We define a standard, platform-agnostic interface:
   ```typescript
   export interface SendEmailOptions {
     to: string | string[];
     subject: string;
     bodyHtml: string;
   }
   ```
2. We create concrete adapter classes (e.g., `EmailAdapter`, `SmsAdapter`) that receive config parameters dynamically on construction.
3. The adapter translates inputs into provider-specific requests (Nodemailer SMTP, SendGrid JSON APIs, or AWS SES SDK calls).
4. **Why it rules**: The API route code stays exactly the same, whether a tenant is using mock logs, custom SMTP, or cloud providers!

### 🎯 Practice Exercise:
Configure `EMS_CONFIG` in `src/config/ems-config.ts` to use twilio and nodemailer details, instantiate the adapters inside the ticket stage transition route (`/api/jobs/bulk-transition`), and test automatic email dispatches when moving cylinder states.

---

## 🎹 Pattern 5: Global Browser Event Triggers (Command Palette)

### How it works:
To bridge a global component (like `<CommandPalette />` mounted in the layout) with active child dashboards (like enquiry forms), we utilize **Custom Window Events**.
1. When the user types or clicks "Add Lead" in the palette, the palette triggers a global event:
   ```typescript
   window.dispatchEvent(new CustomEvent("trigger-add-enquiry-modal"));
   ```
2. The enquiry dashboard page registers a listener on mount:
   ```typescript
   useEffect(() => {
     const handleAdd = () => setIsAddModalOpen(true);
     window.addEventListener("trigger-add-enquiry-modal", handleAdd);
     return () => window.removeEventListener("trigger-add-enquiry-modal", handleAdd);
   }, []);
   ```
3. This completely decouples the components, allowing communication across layouts without passing complex React state drilldowns!
