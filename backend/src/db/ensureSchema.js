import { turso } from "../config/db.js";
import { logger } from "../config/logger.js";

export async function ensureRuntimeSchema() {
  const tables = await turso.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('clients', 'payments', 'refresh_sessions')",
  );
  const tableNames = new Set(tables.rows.map((row) => row.name));
  if (!tableNames.has("clients") || !tableNames.has("payments")) {
    logger.warn("Skipping runtime data normalization because migrations have not created tables yet");
    return;
  }

  const clientColumns = await turso.execute("PRAGMA table_info(clients)");
  const hasMonthlyFee = clientColumns.rows.some((column) => column.name === "monthly_fee");

  if (!hasMonthlyFee) {
    logger.info("Adding missing clients.monthly_fee column");
    await turso.execute("ALTER TABLE clients ADD monthly_fee integer DEFAULT 0 NOT NULL");
  }

  if (tableNames.has("refresh_sessions")) {
    const sessionColumns = await turso.execute("PRAGMA table_info(refresh_sessions)");
    const sessionColumnNames = new Set(sessionColumns.rows.map((column) => column.name));
    if (!sessionColumnNames.has("persistent")) {
      logger.info("Adding missing refresh_sessions.persistent column");
      await turso.execute("ALTER TABLE refresh_sessions ADD persistent integer DEFAULT false NOT NULL");
    }
    if (!sessionColumnNames.has("user_agent")) {
      logger.info("Adding missing refresh_sessions.user_agent column");
      await turso.execute("ALTER TABLE refresh_sessions ADD user_agent text");
    }
    if (!sessionColumnNames.has("last_used_at")) {
      logger.info("Adding missing refresh_sessions.last_used_at column");
      await turso.execute("ALTER TABLE refresh_sessions ADD last_used_at text");
    }
  }

  await turso.execute(`
    UPDATE clients
    SET payment_status = CASE
      WHEN payment_status = 'Due' THEN 'Due Soon'
      WHEN payment_status = 'Overdue' THEN 'Unpaid'
      ELSE payment_status
    END
  `);

  await turso.execute(`
    UPDATE payments
    SET status = CASE
      WHEN status = 'Due' THEN 'Due Soon'
      WHEN status = 'Overdue' THEN 'Unpaid'
      ELSE status
    END
  `);
}
