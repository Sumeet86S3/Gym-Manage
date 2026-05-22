ALTER TABLE `clients` ADD `monthly_fee` integer DEFAULT 0 NOT NULL;

UPDATE `clients`
SET `payment_status` = CASE
  WHEN `payment_status` = 'Due' THEN 'Due Soon'
  WHEN `payment_status` = 'Overdue' THEN 'Unpaid'
  ELSE `payment_status`
END;

UPDATE `payments`
SET `status` = CASE
  WHEN `status` = 'Due' THEN 'Due Soon'
  WHEN `status` = 'Overdue' THEN 'Unpaid'
  ELSE `status`
END;
