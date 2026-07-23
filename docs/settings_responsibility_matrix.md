# Settings & Responsibility Matrix: Why Roles Have Different Controls

To run a successful Software-as-a-Service (SaaS) application, settings must be carefully delegated based on **responsibility, technical skill, and security risk**. Exposing structural domain settings to standard clients is dangerous, but blocking them from changing their own business logo or dark mode is restrictive.

Here is the strategic breakdown of why settings are distributed among **Developers**, **Client Admins**, and **Technicians**.

---

## 🗺️ Role Ownership Matrix

| Settings Area | Developer (`SUPER_ADMIN`) | Client Admin (`ADMIN`) | Technician (`TECHNICIAN`) |
| :--- | :---: | :---: | :---: |
| **Workflow Stages** | ✅ Edit / Define | ❌ View Only | ❌ Hidden |
| **Custom Input Schemas** | ✅ Create / Edit | ❌ View Only | ❌ Hidden |
| **Workspace Branding (Logo/Name)**| ✅ Overwrite | ✅ Edit | ❌ Hidden |
| **User/Staff Management** | ✅ Platform-wide | ✅ Tenant-only | ❌ Hidden |
| **UI Theme (Dark / Light Mode)** | ✅ Default Config | ✅ Preference | ✅ Preference |
| **Personal Profile/Password** | ✅ Self | ✅ Self | ✅ Self |

---

## 🛡️ 1. Why Developers Hold the Keys to Domain Structures
* **Preventing Database & API Corruption**: The workflow stages (e.g. `Enquiry` ➔ `Services`) trigger database query filters and API hooks. If a client admin deletes or renames a stage to something random (e.g. "Drafting Phase"), it could break the backend API routes, cause search filters to return empty results, and mismatch CSV bulk imports.
* **Preserving Product Supportability**: If every client builds highly custom stages and database modifications ad-hoc, your development team will not be able to push global software updates without breaking individual client accounts. Keeping database schemas standard and configuration-driven by developers ensures one central code version updates easily for everyone.

---

## 🏢 2. Why Client Admins Control Branding & Operations
* **Operational Autonomy**: Client Admins manage their own businesses. They need to add new workers, disable former staff, reset technician passwords, and manage customer lists dynamically. Having to contact a developer for daily tasks would cause massive operational delays for them and create a bottleneck for your team.
* **Corporate Identity (White-labeling)**: Clients buy SaaS applications to make them look like their own systems. Exposing settings for **Business Logos**, **Subdomain names**, and **Primary Theme colors** makes them feel like the application is uniquely theirs, raising the value of your product.

---

## 📱 3. Why Technicians Control Personal Preferences
* **Field Usability**: Technicians are on-site workers. They only have access to personal settings like **Dark/Light Mode** (necessary for viewing screens in bright sunlight or at night) and **Language preferences**.
* **Securing Client Data**: Technicians must never have access to company-wide settings (such as billing, logo editing, or staff deletion) as it poses a severe insider threat and data corruption risk.
