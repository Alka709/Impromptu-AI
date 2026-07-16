require('dotenv').config();
const { db } = require('./src/db');
const { sessions } = require('./src/db/schema/sessions');
const { userPrevRecord, metricesCalculated } = require('./src/db/schema/evaluation');

async function main() {
  const allSessions = await db.select().from(sessions);
  const lastSession = allSessions[allSessions.length - 1];
  console.log('Last Session ID:', lastSession?.id);
  console.log('Audio URL:', lastSession?.audio_url);

  const metrics = await db.select().from(metricesCalculated);
  const lastMetrics = metrics[metrics.length - 1];
  const records = await db.select().from(userPrevRecord);
  const lastRecord = records[records.length - 1];
  console.log('Last Record Summary:', lastRecord?.summary);
  console.log('Last Record Overall Score:', lastRecord?.overall_score);
}

main().catch(console.error).finally(() => process.exit(0));
