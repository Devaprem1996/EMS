# Implementation Plan - Production Issues Resolution

This plan details the critical production bugs, workflow gaps, and build-blocking code quality issues identified in the Safeway Enquiry Management System (EMS), and outlines the proposed code fixes.

## Proposed Changes

### 1. Cache Inconsistency in Employee Updates
* **Problem**: In `src/app/api/employees/[id]/route.ts`, updating an employee (e.g. deactivating a user or changing their details) does not invalidate the `employees:*` cache pattern. Since `/api/employees` caches the active list for 5 minutes, stale employee profiles or deactivated technicians remain visible in the active technicians select menus.
* **Fix**: Invalidate the employee cache pattern in `/api/employees/[id]` PUT handler.

#### [MODIFY] [route.ts](file:///c:/Users/Guvi/Desktop/PW/EMS/src/app/api/employees/%5Bid%5D/route.ts)
- Import `serverCache` from `@/lib/cache`.
- Call `serverCache.invalidatePattern(/^employees:/);` upon successful database updates.

---

### 2. Bulk Import Assignment Insertion Crash
* **Problem**: In `src/app/api/jobs/bulk-import/route.ts`, the database write tries to insert `assignFor` into the `TicketAssignment` table (`prisma.ticketAssignment.createMany`). However, `assignFor` does not exist on that table (it is actually `assignmentType` on the parent `Ticket` table), causing a database/Prisma constraint error that crashes any bulk import containing assigned technicians with a 500 error.
* **Fix**: Remove `assignFor` from `TicketAssignment` insertions and instead set `assignmentType` on the `Ticket` creation.

#### [MODIFY] [route.ts](file:///c:/Users/Guvi/Desktop/PW/EMS/src/app/api/jobs/bulk-import/route.ts)
- Set the `assignmentType` property on `prisma.ticket.create` data mapping.
- Remove the `assignFor` key from `prisma.ticketAssignment.createMany` data payload.

---

### 3. Missing Stage Transition & AMC Calculation on Task Completion
* **Problem**: In `src/app/api/tasks/[id]/route.ts`, when a technician marks an assignment status as `"Completed"`, it only changes the `currentStatus` to `"Service Done"` or `"Order Delivered"`. It fails to transition `currentStage` to `"COMPLETED"`, meaning completed tickets are never archived and remain active in dashboards. It also fails to record `deliveredDate` and calculate the next year's `amcDate` based on `amcYears`.
* **Fix**: Fully transition the parent ticket to `"COMPLETED"` stage, set the correct status based on type, record `deliveredDate`, and compute `amcDate`.

#### [MODIFY] [route.ts](file:///c:/Users/Guvi/Desktop/PW/EMS/src/app/api/tasks/%5Bid%5D/route.ts)
- In the transaction select block, retrieve `assignmentType` and `amcYears` from the parent `Ticket`.
- If `status === "Completed"`, set `currentStage` to `"COMPLETED"` and set status to `"Service Done"` (for `"SERVICE"` type), `"Order Delivered"` (for `"REFILLING"` type), or `"Completed"` (for others).
- Set `deliveredDate` to current date, and if `amcYears` is set, compute `amcDate` as `deliveredDate` + `amcYears` years.

---

### 4. Code Quality & Linting Blockers (Pre-deployment compliance)
* **Problem**: There are multiple linter errors causing `npm run lint` to fail, which blocks continuous integration/deployment:
  1. `src/components/QRScannerModal.tsx`: `startCamera` and `stopCamera` are accessed in `useEffect` before declaration (hoisting issue).
  2. `src/context/ConfigContext.tsx`: `setState` (`setThemeMode`) is called synchronously in `useEffect`, violating standard React render rules.
  3. `src/security.test.ts` & `src/lib/cache.ts`: Unused variables and `any` declarations.
* **Fix**: Rearrange functions, use asynchronous state updates in effects, and clean up typescript declarations.

#### [MODIFY] [QRScannerModal.tsx](file:///c:/Users/Guvi/Desktop/PW/EMS/src/components/QRScannerModal.tsx)
- Move `startCamera` and `stopCamera` function declarations above the `useEffect` hook.

#### [MODIFY] [ConfigContext.tsx](file:///c:/Users/Guvi/Desktop/PW/EMS/src/context/ConfigContext.tsx)
- Wrap `setThemeMode` updates within `useEffect` inside a `setTimeout` callback to run asynchronously.

#### [MODIFY] [cache.ts](file:///c:/Users/Guvi/Desktop/PW/EMS/src/lib/cache.ts)
- Disable the `no-explicit-any` warning for the generic internal cache map.

#### [MODIFY] [security.test.ts](file:///c:/Users/Guvi/Desktop/PW/EMS/src/security.test.ts)
- Clean up unused variables and convert rate limit test results to `const`.

## Verification Plan

### Automated Tests
- Run `npm run test` (Vitest unit tests).
- Run `npm run lint` (ESLint clean check).
- Run `npm run build` (Next.js production compiler check).
- Run `node lifecycle_test.js` (E2E browser scenario integration).

### Manual Verification
- We can verify that the task completion automatically transitions the ticket to the COMPLETED stage and sets delivered date/AMC date in the database.
