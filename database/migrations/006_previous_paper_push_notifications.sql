-- Add a distinct audit type for previous-year-paper publication notifications.
-- Keep all existing notification types supported.
ALTER TABLE push_notification_logs
  MODIFY notification_type ENUM('new_post','post_update','manual','quiz_new','paper_new') NOT NULL;
