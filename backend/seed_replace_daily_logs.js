const mysql = require('mysql2/promise');
const julyDailyLogs = require('./july_daily_logs');

async function run() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'Bunny2026$',
    database: 'daruru_farm',
  });

  await conn.query('DELETE FROM daily_activities');
  await conn.query('ALTER TABLE daily_activities AUTO_INCREMENT = 1');

  const [farms] = await conn.query('SELECT id, userId FROM farms');
  for (const farm of farms) {
    for (const log of julyDailyLogs) {
      await conn.query(
        `INSERT INTO daily_activities (date, activityType, notes, farmId, userId, pesticideName, pesticideQuantity, pesticideTime)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.date,
          log.activityType,
          log.notes,
          farm.id,
          farm.userId,
          log.pesticideName || null,
          log.pesticideQuantity || null,
          log.pesticideTime || null,
        ]
      );
    }
  }

  const [[{ count }]] = await conn.query('SELECT COUNT(*) AS count FROM daily_activities');
  console.log(`Replaced daily logs. Rows now: ${count} (${julyDailyLogs.length} days x ${farms.length} farms)`);
  await conn.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
