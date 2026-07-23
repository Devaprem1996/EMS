/**
 * EMS SaaS Tenant Provisioning Script
 * 
 * This script automates the onboarding of a new client (tenant).
 * Because EMS uses a Single-Tenant Architecture, this script provisions
 * an isolated database and a new hosting instance for each client.
 * 
 * Usage: npx ts-node scripts/provision-tenant.ts <tenant_name> <admin_email>
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// --- Pluggable Infrastructure Providers ---

interface DatabaseProvider {
  provisionDatabase(tenantName: string): Promise<string>; // Returns connection URL
}

interface HostingProvider {
  provisionInstance(tenantName: string, dbUrl: string): Promise<string>; // Returns deployed URL
}

// 1. Mock Database Provider (For testing before deciding on Neon/AWS)
class MockDatabaseProvider implements DatabaseProvider {
  async provisionDatabase(tenantName: string): Promise<string> {
    console.log(`[DB Provider] Provisioning isolated database for '${tenantName}'...`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For local testing, we could just create a local SQLite file
    const dbFileName = `tenant_${tenantName.toLowerCase().replace(/[^a-z0-9]/g, '')}.db`;
    const dbPath = path.join(process.cwd(), 'prisma', dbFileName);
    console.log(`[DB Provider] Created mock database at ${dbPath}`);
    
    return `file:./${dbFileName}`;
  }
}

// 2. Mock Hosting Provider (For testing before deciding on Vercel/AWS)
class MockHostingProvider implements HostingProvider {
  async provisionInstance(tenantName: string, dbUrl: string): Promise<string> {
    console.log(`[Hosting Provider] Creating new deployment instance for '${tenantName}'...`);
    console.log(`[Hosting Provider] Injecting DATABASE_URL = ${dbUrl}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const url = `https://${tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ems-platform.mock`;
    console.log(`[Hosting Provider] Deployment successful at ${url}`);
    
    return url;
  }
}

// --- Orchestration Pipeline ---

async function runPrismaMigrations(dbUrl: string) {
  console.log(`[Pipeline] Running Prisma migrations on new database...`);
  try {
    // In a real environment, you'd run `npx prisma migrate deploy`
    // using the newly injected DATABASE_URL environment variable.
    // For this mock, we just run `db push` to create tables in the local sqlite db.
    execSync(`npx prisma db push`, { 
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'inherit' 
    });
    console.log(`[Pipeline] Schema migration complete.`);
  } catch (error) {
    console.error(`[Pipeline] Failed to run migrations:`, error);
    throw error;
  }
}

async function seedSuperAdmin(dbUrl: string, adminEmail: string) {
  console.log(`[Pipeline] Seeding SUPER_ADMIN user: ${adminEmail}`);
  try {
    // For this mock pipeline, we'll just log it.
    // In production, we'd run a Prisma script to insert the user record
    // using the specific tenant's dbUrl.
    console.log(`[Pipeline] Simulated creating user in ${dbUrl}`);
    console.log(`[Pipeline] SUPER_ADMIN seeded successfully.`);
  } catch (error) {
    console.error(`[Pipeline] Failed to seed SUPER_ADMIN:`, error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: npx ts-node scripts/provision-tenant.ts <tenant_name> <admin_email>");
    process.exit(1);
  }

  const tenantName = args[0];
  const adminEmail = args[1];

  console.log(`\n🚀 Starting Automated Provisioning for: ${tenantName}\n`);

  // Initialize Providers (Can swap these out for Vercel/Neon adapters later)
  const dbProvider = new MockDatabaseProvider();
  const hostingProvider = new MockHostingProvider();

  try {
    // Step 1: Provision DB
    console.log(`\n--- Step 1: Infrastructure ---`);
    const dbUrl = await dbProvider.provisionDatabase(tenantName);

    // Step 2: Run Migrations
    console.log(`\n--- Step 2: Database Schema ---`);
    await runPrismaMigrations(dbUrl);

    // Step 3: Provision Hosting & Inject Config
    console.log(`\n--- Step 3: Application Hosting ---`);
    const deployedUrl = await hostingProvider.provisionInstance(tenantName, dbUrl);

    // Step 4: Seed SUPER_ADMIN
    console.log(`\n--- Step 4: Access Management ---`);
    await seedSuperAdmin(dbUrl, adminEmail);

    console.log(`\n✅ Provisioning Complete!`);
    console.log(`=========================================`);
    console.log(`Tenant Name: ${tenantName}`);
    console.log(`Admin Login: ${adminEmail}`);
    console.log(`App URL:     ${deployedUrl}`);
    console.log(`=========================================\n`);

  } catch (error) {
    console.error(`\n❌ Provisioning Failed:`, error);
    process.exit(1);
  }
}

main();
