-- Remove the retired JharResult Web Push subscription and delivery-log tables.
-- Safe to run even if the old Web Push migrations were never applied.
DROP TABLE IF EXISTS push_notification_logs;
DROP TABLE IF EXISTS push_subscriptions;
