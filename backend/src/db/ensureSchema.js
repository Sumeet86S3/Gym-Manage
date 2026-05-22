import { turso } from "../config/db.js";
import { logger } from "../config/logger.js";

export async function ensureRuntimeSchema() {
  const clientColumns = await turso.execute("PRAGMA table_info(clients)");
  const hasMonthlyFee = clientColumns.rows.some((column) => column.name === "monthly_fee");

  if (!hasMonthlyFee) {
    logger.info("Adding missing clients.monthly_fee column");
    await turso.execute("ALTER TABLE clients ADD monthly_fee integer DEFAULT 0 NOT NULL");
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
