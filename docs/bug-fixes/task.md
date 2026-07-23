# Tasks

- `[x]` Fix Employee cache invalidation on PUT endpoint (`src/app/api/employees/[id]/route.ts`)
- `[x]` Fix Bulk Import database crash and set assignment type correctly (`src/app/api/jobs/bulk-import/route.ts`)
- `[x]` Fix Task completion: transition stage to COMPLETED, log delivered date, and calculate AMC date (`src/app/api/tasks/[id]/route.ts`)
- `[x]` Resolve linter issues:
  - `[x]` Fix hoisting in QRScannerModal (`src/components/QRScannerModal.tsx`)
  - `[x]` Fix synchronous state warning in ConfigContext (`src/context/ConfigContext.tsx`)
  - `[x]` Fix typescript generic 'any' warning in cache helper (`src/lib/cache.ts`)
  - `[x]` Clean up unused variables and constants in tests (`src/security.test.ts`)
- `[x]` Run verifications:
  - `[x]` Run Vitest suite (`npm run test`)
  - `[x]` Run ESLint (`npm run lint`)
  - `[x]` Run Next.js compilation (`npm run build`)
  - `[x]` Run E2E ticket lifecycle integration test (`node lifecycle_test.js`)
