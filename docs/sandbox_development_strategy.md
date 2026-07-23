# Sandbox Development Strategy: How to Build the Perfect System Safely

To build the new configuration-driven engine without touching or risking your first client's active code, choose one of these three sandbox strategies:

---

## 🌲 Option A: Git Feature Branching (Industry Standard)
This is the standard software development practice for working on major updates.

```
(main branch: First Client's Code - Stable)
  o───────────────────────────────────────o  (Active Client deployment)
   \
    \───o─────────o─────────o  (feature/multi-domain-whitelabel branch)
        (Develop, test, and perfect here)
```

### Steps:
1. Open your terminal in the workspace directory.
2. Create a new branch:
   ```bash
   git checkout -b feature/multi-domain-whitelabel
   ```
3. Do all your refactoring, page routing updates, and database experiments on this branch.
4. If you need to fix a bug for your live client:
   - Commit your current work.
   - Switch back to `main`: `git checkout main`.
   - Fix the bug, deploy it, and switch back: `git checkout feature/multi-domain-whitelabel`.
5. Once the feature branch is perfect, tested, and approved, merge it into `main`.

---

## 📁 Option B: Co-existing Sandbox Folder (Inside current project)
If you do not want to use Git branches, you can write the new dynamic code side-by-side with the current code in the same workspace.

### Directory Structure:
```
src/
├── app/
│   ├── admin/
│   │   ├── enquiry/ (Active Client)
│   │   ├── refilling/ (Active Client)
│   │   └── services/ (Active Client)
│   │
│   │   └── sandbox/ (DEVELOPER SANDBOX - NEW)
│   │       ├── dashboard/
│   │       │   └── [stageCode]/
│   │       │       └── page.tsx (New Dynamic Router)
│   │       └── settings/
│   │           └── page.tsx (New Dynamic Settings Panel)
```

### How to use this:
- Your active client continues using `/admin/enquiry` as their entry point.
- You develop and test the dynamic engine at `/admin/sandbox/dashboard/ENQUIRY`.
- You can change code, databases, and page files under `/sandbox` without ever affecting the files under `/enquiry`, `/refilling`, or `/services`.
- Once verified, you change the sidebar navigation links to point to the `/sandbox` paths.

---

## 📂 Option C: Duplicate Project Directory (Isolated Project)
Duplicate the entire project folder to a separate location.

### Steps:
1. Copy the folder `EMS` and paste it as a new folder `EMS-Whitelabel-Core`.
2. Open `EMS-Whitelabel-Core` in your editor.
3. Open a separate terminal and run `npm run dev` on a different port:
   ```bash
   npm run dev -- -p 3001
   ```
4. This gives you a completely separate database, server, and codebase. You can modify it, refactor it, or delete folders without any risk of affecting the live application running on port 3000.
