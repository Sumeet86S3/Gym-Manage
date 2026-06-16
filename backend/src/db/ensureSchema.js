import { turso } from "../config/db.js";
import { logger } from "../config/logger.js";

export async function ensureRuntimeSchema() {
  const tables = await turso.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('clients', 'payments', 'refresh_sessions', 'trainers', 'attendance', 'measurements')",
  );
  const tableNames = new Set(tables.rows.map((row) => row.name));
  if (!tableNames.has("clients") || !tableNames.has("payments")) {
    logger.warn(
      "Skipping runtime data normalization because migrations have not created tables yet",
    );
    return;
  }

  const clientColumns = await turso.execute("PRAGMA table_info(clients)");
  const hasMonthlyFee = clientColumns.rows.some((column) => column.name === "monthly_fee");

  if (!hasMonthlyFee) {
    logger.info("Adding missing clients.monthly_fee column");
    await turso.execute("ALTER TABLE clients ADD monthly_fee integer DEFAULT 0 NOT NULL");
  }

  if (tableNames.has("trainers")) {
    const trainerColumns = await turso.execute("PRAGMA table_info(trainers)");
    const trainerColumnNames = new Set(trainerColumns.rows.map((column) => column.name));
    const trainerAdds = [
      [
        "gym_name",
        "ALTER TABLE trainers ADD gym_name text DEFAULT 'FitSphere Elite Studio' NOT NULL",
      ],
      [
        "gym_address",
        "ALTER TABLE trainers ADD gym_address text DEFAULT 'Indiranagar Performance Hub' NOT NULL",
      ],
      ["gym_latitude", "ALTER TABLE trainers ADD gym_latitude real DEFAULT 12.9719 NOT NULL"],
      ["gym_longitude", "ALTER TABLE trainers ADD gym_longitude real DEFAULT 77.6412 NOT NULL"],
      [
        "attendance_radius_meters",
        "ALTER TABLE trainers ADD attendance_radius_meters integer DEFAULT 100 NOT NULL",
      ],
      [
        "gym_location_configured",
        "ALTER TABLE trainers ADD gym_location_configured integer DEFAULT false NOT NULL",
      ],
    ];
    for (const [name, statement] of trainerAdds) {
      if (!trainerColumnNames.has(name)) {
        logger.info({ column: name }, "Adding missing trainers attendance location column");
        await turso.execute(statement);
      }
    }
  }

  if (tableNames.has("attendance")) {
    const attendanceColumns = await turso.execute("PRAGMA table_info(attendance)");
    const attendanceColumnNames = new Set(attendanceColumns.rows.map((column) => column.name));
    const attendanceAdds = [
      ["method", "ALTER TABLE attendance ADD method text DEFAULT 'Trainer' NOT NULL"],
      ["latitude", "ALTER TABLE attendance ADD latitude real"],
      ["longitude", "ALTER TABLE attendance ADD longitude real"],
      ["accuracy_meters", "ALTER TABLE attendance ADD accuracy_meters real"],
      ["distance_meters", "ALTER TABLE attendance ADD distance_meters real"],
    ];
    for (const [name, statement] of attendanceAdds) {
      if (!attendanceColumnNames.has(name)) {
        logger.info({ column: name }, "Adding missing attendance location audit column");
        await turso.execute(statement);
      }
    }
  }

  if (tableNames.has("measurements")) {
    const measurementColumns = await turso.execute("PRAGMA table_info(measurements)");
    const measurementColumnNames = new Set(measurementColumns.rows.map((column) => column.name));
    const measurementAdds = [
      ["trainer_note", "ALTER TABLE measurements ADD trainer_note text"],
      ["condition", "ALTER TABLE measurements ADD condition text"],
      ["front_photo_url", "ALTER TABLE measurements ADD front_photo_url text"],
      ["side_photo_url", "ALTER TABLE measurements ADD side_photo_url text"],
      ["back_photo_url", "ALTER TABLE measurements ADD back_photo_url text"],
    ];
    for (const [name, statement] of measurementAdds) {
      if (!measurementColumnNames.has(name)) {
        logger.info({ column: name }, "Adding missing measurement note/photo column");
        await turso.execute(statement);
      }
    }
  }

  if (tableNames.has("refresh_sessions")) {
    const sessionColumns = await turso.execute("PRAGMA table_info(refresh_sessions)");
    const sessionColumnNames = new Set(sessionColumns.rows.map((column) => column.name));
    if (!sessionColumnNames.has("persistent")) {
      logger.info("Adding missing refresh_sessions.persistent column");
      await turso.execute(
        "ALTER TABLE refresh_sessions ADD persistent integer DEFAULT false NOT NULL",
      );
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
