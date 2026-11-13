import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { config } from '../config/index.js';
import { User } from '../models/User.js';

// Ensure environment variables are loaded if running as standalone CLI script
dotenv.config(); // Load from process current working directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const DEFAULT_SEED_IDENTIFIER = 'DEFAULT_SYSTEM_ADMIN';
const BCRYPT_SALT_ROUNDS = 10;

/**
 * TalentFlow AI - Default Admin Provisioning Script
 *
 * Provisions exclusively ONE default system administrator account.
 * Credentials are read strictly from environment variables:
 *   - SEED_ADMIN_EMAIL
 *   - SEED_ADMIN_PASSWORD
 *   - SEED_ADMIN_NAME (optional, defaults to 'System Administrator')
 *
 * Security & Integrity Guarantees:
 *   1. Creates ONLY ONE default Admin account.
 *   2. No demo users, candidates, requirements, or sample data created.
 *   3. No collections cleared or existing database records deleted.
 *   4. Plain-text passwords are never hardcoded, stored, or logged.
 *   5. Duplicate prevention: Checks by unique email; does NOT overwrite existing password.
 *   6. Tagged with unique seedIdentifier ('DEFAULT_SYSTEM_ADMIN') for future auditing.
 *   7. Executed ONLY manually via CLI ('npm run seed').
 */
export const seedDatabase = async (): Promise<void> => {
  console.log('=======================================================');
  console.log('  TalentFlow AI - Default Admin Provisioning Script     ');
  console.log('=======================================================');

  // 1. Read and validate required credentials from environment
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME?.trim() || 'System Administrator';
  const seedIdentifier = process.env.SEED_ADMIN_IDENTIFIER?.trim() || DEFAULT_SEED_IDENTIFIER;

  if (!adminEmail || !adminPassword) {
    console.error('\n[Seed Error] Missing required admin credentials in environment:');
    if (!adminEmail) console.error('  - SEED_ADMIN_EMAIL is required');
    if (!adminPassword) console.error('  - SEED_ADMIN_PASSWORD is required');
    console.error('\nPlease set these variables in your .env file or pass them via CLI:');
    console.error('  Example: SEED_ADMIN_EMAIL="admin@company.com" SEED_ADMIN_PASSWORD="StrongPassword123!" npm run seed\n');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    console.error(`\n[Seed Error] Invalid email format: "${adminEmail}". Please provide a valid email address.\n`);
    process.exit(1);
  }

  // Validate password strength (minimum 8 characters)
  if (adminPassword.length < 8) {
    console.error('\n[Seed Error] Password must be at least 8 characters long for security compliance.\n');
    process.exit(1);
  }

  let connectionEstablishedLocally = false;

  try {
    // 2. Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      console.log(`[Seed] Connecting to MongoDB: ${config.mongoUri.replace(/:([^:@]{1,})@/, ':****@')}`);
      await mongoose.connect(config.mongoUri);
      connectionEstablishedLocally = true;
      console.log('[Seed] Database connection established.');
    }

    // 3. Duplicate Prevention: Check if account with this email already exists
    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      console.log(`\n[Seed Notice] Account with email "${adminEmail}" already exists.`);
      console.log(`  - User ID:         ${existingUser._id}`);
      console.log(`  - Role:            ${existingUser.role}`);
      console.log(`  - Account Status:  ${existingUser.accountStatus}`);
      console.log(`  - Seed Identifier: ${existingUser.seedIdentifier || 'N/A'}`);
      console.log('[Seed Notice] Existing password and records preserved intact (NO overwrite performed).\n');
      return;
    }

    // 4. Hash password using bcrypt
    console.log('[Seed] Hashing password with bcrypt (salt rounds: 10)...');
    const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_SALT_ROUNDS);

    // 5. Create only the default Admin account
    const newAdmin = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'Admin',
      managerClassification: null,
      accountStatus: 'Active',
      seedIdentifier,
    });

    console.log('\n[Seed Success] Default Admin account created successfully:');
    console.log(`  - User ID:         ${newAdmin._id}`);
    console.log(`  - Name:            ${newAdmin.name}`);
    console.log(`  - Email:           ${newAdmin.email}`);
    console.log(`  - Role:            ${newAdmin.role}`);
    console.log(`  - Account Status:  ${newAdmin.accountStatus}`);
    console.log(`  - Seed Identifier: ${newAdmin.seedIdentifier}`);
    console.log('  - Password Hash:   [SECURELY HASHED VIA BCRYPT]');
    console.log('\nZero demo records, HR users, managers, or sample candidates created.');
    console.log('All existing application functionality and database records remain preserved.');
    console.log('=======================================================\n');
  } catch (error: any) {
    console.error('\n[Seed Error] Failed to provision default Admin account:', error.message);
    process.exit(1);
  } finally {
    if (connectionEstablishedLocally && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('[Seed] Disconnected from MongoDB.');
    }
  }
};

// Execute manually via CLI
if (process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Fatal Error]', err);
      process.exit(1);
    });
}
