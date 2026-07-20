const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { eq } = require('drizzle-orm');
const { db } = require('../db');
const { users } = require('../db/schema/users');
const { sessions } = require('../db/schema/sessions');
const { userPrevRecord, metricesCalculated } = require('../db/schema/evaluation');

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isConfirm = args.includes('--confirm');

  if (!isDryRun && !isConfirm) {
    console.error('Error: Please specify either --dry-run or --confirm.');
    console.log('Usage:');
    console.log('  node src/scripts/cleanupDuplicateEmails.js --dry-run');
    console.log('  node src/scripts/cleanupDuplicateEmails.js --confirm');
    process.exit(1);
  }

  console.log(`Starting duplicate email cleanup in ${isDryRun ? 'DRY-RUN' : 'CONFIRM'} mode...\n`);

  try {
    // 1. Fetch all users
    const allUsers = await db.select().from(users);
    console.log(`Fetched ${allUsers.length} total users.`);

    // 2. Group by normalized email
    const grouped = {};
    for (const user of allUsers) {
      if (!user.email) continue;
      const normalized = user.email.trim().toLowerCase();
      if (!grouped[normalized]) {
        grouped[normalized] = [];
      }
      grouped[normalized].push(user);
    }

    // 3. Filter groups with duplicates
    const duplicateGroups = Object.entries(grouped).filter(([_, list]) => list.length > 1);

    if (duplicateGroups.length === 0) {
      console.log('No duplicate email accounts (case-insensitive) found. Database is clean!');
      process.exit(0);
    }

    console.log(`Found ${duplicateGroups.length} group(s) of duplicate emails.\n`);

    let totalDeleted = 0;

    for (const [normalizedEmail, list] of duplicateGroups) {
      // Sort by created_at (ascending) to find the oldest
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      const keepUser = list[0];
      const deleteUsers = list.slice(1);

      console.log(`--------------------------------------------------`);
      console.log(`Group: [${normalizedEmail}]`);
      console.log(`KEEP (Oldest): ID = ${keepUser.id}, Email = "${keepUser.email}", Created At = ${keepUser.created_at}`);
      console.log(`DUPLICATES TO DELETE:`);

      for (const dup of deleteUsers) {
        console.log(`  - ID = ${dup.id}, Email = "${dup.email}", Created At = ${dup.created_at}`);

        // Check for related records
        const userSessions = await db.select().from(sessions).where(eq(sessions.user_id, dup.id));
        const userPrevRecords = await db.select().from(userPrevRecord).where(eq(userPrevRecord.user_id, dup.id));
        const userMetrics = await db.select().from(metricesCalculated).where(eq(metricesCalculated.user_id, dup.id));

        if (userSessions.length > 0 || userPrevRecords.length > 0 || userMetrics.length > 0) {
          console.warn(`    ⚠️ WARNING: User ${dup.id} has associated data that will be lost!`);
          if (userSessions.length > 0) console.warn(`      - ${userSessions.length} record(s) in "sessions" table`);
          if (userPrevRecords.length > 0) console.warn(`      - ${userPrevRecords.length} record(s) in "user_prev_record" table`);
          if (userMetrics.length > 0) console.warn(`      - ${userMetrics.length} record(s) in "metricescalculated" table`);
        } else {
          console.log(`    (No associated records found for this duplicate user.)`);
        }

        if (isConfirm) {
          // Delete related records to prevent foreign key errors
          if (userPrevRecords.length > 0) {
            await db.delete(userPrevRecord).where(eq(userPrevRecord.user_id, dup.id));
          }
          if (userMetrics.length > 0) {
            await db.delete(metricesCalculated).where(eq(metricesCalculated.user_id, dup.id));
          }
          if (userSessions.length > 0) {
            await db.delete(sessions).where(eq(sessions.user_id, dup.id));
          }

          // Delete the user record
          await db.delete(users).where(eq(users.id, dup.id));
          console.log(`    ✅ Successfully deleted user ${dup.id} and their associated records.`);
          totalDeleted++;
        }
      }
    }

    console.log(`\n--------------------------------------------------`);
    if (isDryRun) {
      console.log(`Dry-run complete. No changes were made to the database.`);
      console.log(`To apply these deletions, run the script with --confirm.`);
    } else {
      console.log(`Cleanup complete! Deleted ${totalDeleted} duplicate user account(s).`);
    }

  } catch (error) {
    console.error('An error occurred during cleanup:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
